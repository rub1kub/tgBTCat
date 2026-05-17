#!/usr/bin/env python3
import json
import os
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

import requests

TONCENTER_RUN_GET_ENDPOINT = "https://toncenter.com/api/v3/runGetMethod"
TONCENTER_TRANSACTIONS_ENDPOINT = "https://toncenter.com/api/v3/transactions"
MAX_BODY_BYTES = 32 * 1024
RATE_WINDOW_SECONDS = 10
RATE_MAX_REQUESTS = 120
MAX_TRANSACTION_LIMIT = 1000
DEFAULT_CACHE_TTL_SECONDS = 3
TRANSACTIONS_CACHE_TTL_SECONDS = 8
STALE_IF_ERROR_SECONDS = 30

ALLOWED_METHODS = {
    "get_global_fees",
    "get_wallet_fees",
    "get_next_proposal_id",
    "get_proposal",
    "get_wallet_address",
    "get_wallet_data",
}

KNOWN_ADDRESS_METHODS = {
    "EQBAJ9rR-ZlVJZAgy7pHa3oIdORX6fzfGwdKknxFE43DLpRR": {"get_global_fees"},
    "EQB9i0ArmUaBXhq7hVfV5Q1eANcdDchrqiCXnmlbG_Oabrmh": {"get_wallet_fees"},
    "EQAuV-4s02xuBkSaF7rinSu8kIoNrG9MoP6NLlX4Gyp2mcYM": {"get_next_proposal_id", "get_proposal"},
    "EQAtFLwK8HZD6KD1UF4h-S6BzYyTReSUJzQBLhHIycqfDpro": {"get_wallet_address"},
}

ALLOWED_TRANSACTION_ACCOUNTS = {
    "EQAuV-4s02xuBkSaF7rinSu8kIoNrG9MoP6NLlX4Gyp2mcYM",
}

rate_state: dict[str, list[float]] = {}
response_cache: dict[str, dict[str, object]] = {}


class ProxyHandler(BaseHTTPRequestHandler):
    server_version = "TgBtcCatToncenterProxy/1.0"

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_common_headers()
        self.end_headers()

    def do_POST(self):
        if self.path != "/runGetMethod":
            self.send_json(404, {"error": "not found"})
            return

        client_ip = self.headers.get("X-Forwarded-For", self.client_address[0]).split(",")[0].strip()
        if not allow_rate(client_ip):
            self.send_json(429, {"error": "rate limit exceeded"})
            return

        try:
            body = self.read_json_body()
            self.validate_request(body)
        except ValueError as exc:
            self.send_json(400, {"error": str(exc)})
            return

        api_key = os.environ.get("TONCENTER_API_KEY")
        if not api_key:
            self.send_json(500, {"error": "toncenter api key is not configured"})
            return

        cache_key = build_run_get_cache_key(body)
        cached = get_cached_response(cache_key)
        if cached is not None:
            self.send_cached_response(cached, "HIT")
            return

        try:
            upstream = requests.post(
                TONCENTER_RUN_GET_ENDPOINT,
                json=body,
                headers={"Content-Type": "application/json", "X-API-Key": api_key},
                timeout=12,
            )
        except requests.RequestException:
            stale = get_cached_response(cache_key, allow_stale=True)
            if stale is not None:
                self.send_cached_response(stale, "STALE")
                return
            self.send_json(502, {"error": "toncenter upstream is unavailable"})
            return

        if should_cache_run_get(body, upstream.status_code):
            store_cached_response(cache_key, upstream, DEFAULT_CACHE_TTL_SECONDS)

        self.send_upstream_response(upstream, "MISS")

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path != "/transactions":
            self.send_json(404, {"error": "not found"})
            return

        client_ip = self.headers.get("X-Forwarded-For", self.client_address[0]).split(",")[0].strip()
        if not allow_rate(client_ip):
            self.send_json(429, {"error": "rate limit exceeded"})
            return

        try:
            params = self.validate_transactions_query(parse_qs(parsed.query))
        except ValueError as exc:
            self.send_json(400, {"error": str(exc)})
            return

        api_key = os.environ.get("TONCENTER_API_KEY")
        if not api_key:
            self.send_json(500, {"error": "toncenter api key is not configured"})
            return

        cache_key = build_transactions_cache_key(params)
        cached = get_cached_response(cache_key)
        if cached is not None:
            self.send_cached_response(cached, "HIT")
            return

        try:
            upstream = requests.get(
                TONCENTER_TRANSACTIONS_ENDPOINT,
                params=params,
                headers={"X-API-Key": api_key},
                timeout=12,
            )
        except requests.RequestException:
            stale = get_cached_response(cache_key, allow_stale=True)
            if stale is not None:
                self.send_cached_response(stale, "STALE")
                return
            self.send_json(502, {"error": "toncenter upstream is unavailable"})
            return

        if upstream.status_code == 200:
            store_cached_response(cache_key, upstream, TRANSACTIONS_CACHE_TTL_SECONDS)

        self.send_upstream_response(upstream, "MISS")

    def send_upstream_response(self, upstream, cache_status):
        self.send_response(upstream.status_code)
        self.send_common_headers()
        self.send_header("X-Proxy-Cache", cache_status)
        self.send_header("Content-Type", upstream.headers.get("Content-Type", "application/json"))
        self.end_headers()
        self.wfile.write(upstream.content)

    def send_cached_response(self, cached, cache_status):
        content = cached["content"]
        self.send_response(cached["status_code"])
        self.send_common_headers()
        self.send_header("X-Proxy-Cache", cache_status)
        self.send_header("Content-Type", cached["content_type"])
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def read_json_body(self):
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0:
            raise ValueError("empty request body")
        if length > MAX_BODY_BYTES:
            raise ValueError("request body is too large")
        raw = self.rfile.read(length)
        try:
            body = json.loads(raw)
        except json.JSONDecodeError:
            raise ValueError("invalid json body")
        if not isinstance(body, dict):
            raise ValueError("request body must be an object")
        return body

    def validate_request(self, body):
        address = body.get("address")
        method = body.get("method")
        stack = body.get("stack")

        if not isinstance(address, str) or not address:
            raise ValueError("address is required")
        if not isinstance(method, str) or method not in ALLOWED_METHODS:
            raise ValueError("method is not allowed")
        if not isinstance(stack, list) or len(stack) > 8:
            raise ValueError("stack must be a short array")

        known_methods = KNOWN_ADDRESS_METHODS.get(address)
        if known_methods is not None and method not in known_methods:
            raise ValueError("method is not allowed for this address")
        if method != "get_wallet_data" and known_methods is None:
            raise ValueError("address is not allowed for this method")

        for item in stack:
            if not isinstance(item, dict):
                raise ValueError("stack item must be an object")
            if item.get("type") not in {"num", "cell", "slice"}:
                raise ValueError("stack item type is not allowed")
            value = item.get("value")
            if value is not None and not isinstance(value, str):
                raise ValueError("stack item value must be a string")
            if isinstance(value, str) and len(value) > 8192:
                raise ValueError("stack item value is too large")

    def validate_transactions_query(self, query):
        account = self.single_query_value(query, "account", required=True)
        if account not in ALLOWED_TRANSACTION_ACCOUNTS:
            raise ValueError("account is not allowed")

        limit_raw = self.single_query_value(query, "limit", required=False) or "100"
        sort = self.single_query_value(query, "sort", required=False) or "desc"
        offset_raw = self.single_query_value(query, "offset", required=False) or "0"

        try:
            limit = int(limit_raw)
            offset = int(offset_raw)
        except ValueError:
            raise ValueError("limit and offset must be numbers")

        if limit < 1 or limit > MAX_TRANSACTION_LIMIT:
            raise ValueError("limit is out of range")
        if offset < 0:
            raise ValueError("offset is out of range")
        if sort not in {"asc", "desc"}:
            raise ValueError("sort is not allowed")

        return {
            "account": account,
            "limit": str(limit),
            "offset": str(offset),
            "sort": sort,
        }

    def single_query_value(self, query, name, required):
        values = query.get(name)
        if not values:
            if required:
                raise ValueError(f"{name} is required")
            return None
        if len(values) != 1:
            raise ValueError(f"{name} must be provided once")
        value = values[0]
        if not isinstance(value, str) or len(value) > 128:
            raise ValueError(f"{name} is invalid")
        return value

    def send_json(self, status, payload):
        data = json.dumps(payload, separators=(",", ":")).encode()
        self.send_response(status)
        self.send_common_headers()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def send_common_headers(self):
        self.send_header("Access-Control-Allow-Origin", "https://tgbtcat.fun")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("X-Content-Type-Options", "nosniff")

    def log_message(self, fmt, *args):
        return


def allow_rate(client_ip: str) -> bool:
    now = time.time()
    window_start = now - RATE_WINDOW_SECONDS
    hits = [ts for ts in rate_state.get(client_ip, []) if ts >= window_start]
    if len(hits) >= RATE_MAX_REQUESTS:
        rate_state[client_ip] = hits
        return False
    hits.append(now)
    rate_state[client_ip] = hits
    return True


def build_run_get_cache_key(body) -> str:
    normalized = json.dumps(body, sort_keys=True, separators=(",", ":"))
    return f"runGetMethod:{normalized}"


def build_transactions_cache_key(params) -> str:
    normalized = json.dumps(params, sort_keys=True, separators=(",", ":"))
    return f"transactions:{normalized}"


def should_cache_run_get(body, status_code: int) -> bool:
    if status_code != 200:
        return False
    return body.get("method") != "get_wallet_data"


def get_cached_response(key: str, allow_stale: bool = False):
    cached = response_cache.get(key)
    if cached is None:
        return None

    now = time.time()
    if now <= cached["expires_at"]:
        return cached
    if allow_stale and now <= cached["stale_until"]:
        return cached

    response_cache.pop(key, None)
    return None


def store_cached_response(key: str, upstream, ttl_seconds: int):
    now = time.time()
    response_cache[key] = {
        "status_code": upstream.status_code,
        "content_type": upstream.headers.get("Content-Type", "application/json"),
        "content": upstream.content,
        "expires_at": now + ttl_seconds,
        "stale_until": now + ttl_seconds + STALE_IF_ERROR_SECONDS,
    }


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8787"))
    server = ThreadingHTTPServer(("127.0.0.1", port), ProxyHandler)
    server.serve_forever()

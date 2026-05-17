const TONCENTER_DIRECT_BASE_ENDPOINT = 'https://toncenter.com/api/v3';
const TONCENTER_PROXY_BASE_ENDPOINT = '/api/toncenter';

export function getToncenterRunGetMethodEndpoint(): string {
  return `${getToncenterBaseEndpoint()}/runGetMethod`;
}

export function getToncenterTransactionsEndpoint(): string {
  return `${getToncenterBaseEndpoint()}/transactions`;
}

function getToncenterBaseEndpoint(): string {
  if (typeof window === 'undefined') {
    return TONCENTER_DIRECT_BASE_ENDPOINT;
  }

  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    return TONCENTER_DIRECT_BASE_ENDPOINT;
  }

  return TONCENTER_PROXY_BASE_ENDPOINT;
}

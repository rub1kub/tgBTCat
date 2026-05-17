const TONCENTER_DIRECT_ENDPOINT = 'https://toncenter.com/api/v3/runGetMethod';
const TONCENTER_PROXY_ENDPOINT = '/api/toncenter/runGetMethod';

export function getToncenterRunGetMethodEndpoint(): string {
  if (typeof window === 'undefined') {
    return TONCENTER_DIRECT_ENDPOINT;
  }

  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    return TONCENTER_DIRECT_ENDPOINT;
  }

  return TONCENTER_PROXY_ENDPOINT;
}

import type { RequestStats } from '../types/request-stats';

const encoder = new TextEncoder();

function byteLength(value: string): number {
  return encoder.encode(value).length;
}

export function calculateHeaderBytes(headers: Record<string, string>): number {
  return Object.entries(headers).reduce((total, [key, value]) => {
    return total + byteLength(`${key}: ${value}\r\n`);
  }, 0);
}

export function calculateBodyBytes(body?: string): number {
  return body ? byteLength(body) : 0;
}

function parseContentLength(headers: Record<string, string>): number | undefined {
  const value = Object.entries(headers).find(
    ([key]) => key.toLowerCase() === 'content-length',
  )?.[1];
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function parseNetworkUrl(url: string): Pick<RequestStats['network'], 'protocol' | 'host' | 'port'> {
  try {
    const parsed = new URL(url);
    return {
      protocol: parsed.protocol,
      host: parsed.hostname,
      port: parsed.port || undefined,
    };
  } catch {
    return {
      protocol: 'unknown:',
      host: url,
      port: undefined,
    };
  }
}

export function buildRequestStats(input: {
  request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string;
  };
  response: {
    url?: string;
    redirected?: boolean;
    headers: Record<string, string>;
    body: string;
  };
  timings: {
    totalMs: number;
    ttfbMs?: number;
    downloadMs?: number;
  };
  errorType?: RequestStats['network']['errorType'];
}): RequestStats {
  const requestHeadersBytes = calculateHeaderBytes(input.request.headers);
  const requestBodyBytes = calculateBodyBytes(input.request.body);
  const responseHeadersBytes = calculateHeaderBytes(input.response.headers);
  const responseBodyBytes = calculateBodyBytes(input.response.body);
  const finalUrl =
    input.response.url && input.response.url !== input.request.url ? input.response.url : undefined;
  const networkUrl = finalUrl ?? input.request.url;
  const network = parseNetworkUrl(networkUrl);

  return {
    timings: input.timings,
    requestSize: {
      headersBytes: requestHeadersBytes,
      bodyBytes: requestBodyBytes,
      totalBytes: requestHeadersBytes + requestBodyBytes,
    },
    responseSize: {
      headersBytes: responseHeadersBytes,
      bodyBytes: responseBodyBytes,
      totalBytes: responseHeadersBytes + responseBodyBytes,
      contentLengthHeader: parseContentLength(input.response.headers),
    },
    network: {
      url: input.request.url,
      finalUrl,
      protocol: network.protocol,
      host: network.host,
      port: network.port,
      redirected: Boolean(input.response.redirected),
      errorType: input.errorType,
    },
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

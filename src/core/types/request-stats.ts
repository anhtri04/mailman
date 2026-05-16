export interface RequestSizeStats {
  headersBytes: number;
  bodyBytes: number;
  totalBytes: number;
}

export interface ResponseSizeStats {
  headersBytes: number;
  bodyBytes: number;
  totalBytes: number;
  contentLengthHeader?: number;
}

export interface RequestTimingStats {
  totalMs: number;
  ttfbMs?: number;
  downloadMs?: number;
}

export interface NetworkStats {
  url: string;
  finalUrl?: string;
  protocol: string;
  host: string;
  port?: string;
  redirected: boolean;
  errorType?: 'network' | 'timeout' | 'dns' | 'unknown';
}

export interface RequestStats {
  timings: RequestTimingStats;
  requestSize: RequestSizeStats;
  responseSize: ResponseSizeStats;
  network: NetworkStats;
}

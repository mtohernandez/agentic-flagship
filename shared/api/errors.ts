export class HttpError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly body?: string;

  constructor(status: number, statusText: string, body?: string) {
    super(`HTTP ${status}: ${statusText}`);
    this.name = 'HttpError';
    this.status = status;
    this.statusText = statusText;
    this.body = body;
  }
}

export class StreamError extends Error {
  constructor(message: string = 'Stream error') {
    super(message);
    this.name = 'StreamError';
  }
}

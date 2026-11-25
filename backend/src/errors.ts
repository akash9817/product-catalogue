/** Application error that the HTTP layer maps to a status code and a safe message. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export interface FieldIssue {
  field: string;
  message: string;
}

export class ValidationError extends HttpError {
  constructor(
    message: string,
    public readonly details: FieldIssue[] = [],
  ) {
    super(400, message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(404, message);
    this.name = "NotFoundError";
  }
}

/** A dependency (email provider, product data) failed; the client may retry. */
export class UpstreamError extends HttpError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(502, message);
    this.name = "UpstreamError";
    if (options?.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

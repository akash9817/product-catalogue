import type { ErrorRequestHandler } from "express";
import { HttpError, type FieldIssue, ValidationError } from "../errors.js";
import { ProductSourceError } from "../products/errors.js";

interface ErrorBody {
  error: string;
  details?: FieldIssue[];
}

/**
 * Converts errors into JSON responses. Internal details are logged, never sent
 * to the client.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (res.headersSent) {
    return;
  }

  if (err instanceof ValidationError) {
    const body: ErrorBody = { error: err.message, details: err.details };
    res.status(err.status).json(body);
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message } satisfies ErrorBody);
    return;
  }

  if (err instanceof ProductSourceError) {
    console.error("[products] upstream failure:", err.message, err.cause ?? "");
    res.status(502).json({ error: "Product data is temporarily unavailable. Please try again." } satisfies ErrorBody);
    return;
  }

  // Malformed JSON bodies and similar parser errors carry a 4xx status from body-parser.
  const status = typeof err?.status === "number" ? err.status : undefined;
  if (status && status >= 400 && status < 500) {
    res.status(status).json({ error: "Malformed request" } satisfies ErrorBody);
    return;
  }

  console.error("[server] unhandled error:", err);
  res.status(500).json({ error: "Something went wrong" } satisfies ErrorBody);
};

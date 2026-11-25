/** Raised when an upstream product data source fails or returns unusable data. */
export class ProductSourceError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ProductSourceError";
  }
}

import type { Product } from "./types.js";

/**
 * Abstraction over wherever product data comes from (Fake Store API today,
 * a database or PIM later). Services depend on this interface only.
 */
export interface ProductSource {
  listProducts(): Promise<Product[]>;
  /** Returns null when the product does not exist. */
  getProduct(id: number): Promise<Product | null>;
  listCategories(): Promise<string[]>;
}

import type { ProductSource } from "./ProductSource.js";
import type { Product } from "./types.js";

interface Entry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Decorator that caches reads from any ProductSource for a fixed TTL.
 * Keeps the Fake Store API from being hit on every page view and
 * keeps caching concerns out of the adapter.
 */
export class CachedProductSource implements ProductSource {
  private readonly cache = new Map<string, Entry<unknown>>();

  constructor(
    private readonly inner: ProductSource,
    private readonly ttlMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  listProducts(): Promise<Product[]> {
    return this.remember("products", () => this.inner.listProducts());
  }

  getProduct(id: number): Promise<Product | null> {
    return this.remember(`product:${id}`, () => this.inner.getProduct(id));
  }

  listCategories(): Promise<string[]> {
    return this.remember("categories", () => this.inner.listCategories());
  }

  private async remember<T>(key: string, load: () => Promise<T>): Promise<T> {
    if (this.ttlMs === 0) {
      return load();
    }
    const hit = this.cache.get(key) as Entry<T> | undefined;
    if (hit && hit.expiresAt > this.now()) {
      return hit.value;
    }
    const value = await load();
    this.cache.set(key, { value, expiresAt: this.now() + this.ttlMs });
    return value;
  }
}

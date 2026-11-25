import { vi } from "vitest";
import type { ProductSource } from "../src/products/ProductSource.js";
import type { Product } from "../src/products/types.js";

export function makeProduct(overrides: Partial<Product> & { id: number }): Product {
  return {
    title: `Product ${overrides.id}`,
    price: 10,
    description: "A generic product",
    category: "electronics",
    image: "https://example.com/image.png",
    rating: { rate: 3, count: 10 },
    ...overrides,
  };
}

/** A small catalogue that covers top rated, additional, search and multiple categories. */
export const sampleProducts: Product[] = [
  makeProduct({ id: 1, title: "Backpack", category: "men's clothing", rating: { rate: 4.1, count: 50 } }),
  makeProduct({ id: 2, title: "Gold ring", category: "jewelery", description: "Solid gold ring", rating: { rate: 4.9, count: 10 } }),
  makeProduct({ id: 3, title: "SSD drive", category: "electronics", description: "Fast storage", rating: { rate: 4.8, count: 200 } }),
  makeProduct({ id: 4, title: "Wool jacket", category: "men's clothing", rating: { rate: 2.5, count: 5 } }),
  makeProduct({ id: 5, title: "Silk scarf", category: "women's clothing", rating: { rate: 4.7, count: 30 } }),
  makeProduct({ id: 6, title: "Monitor", category: "electronics", rating: { rate: 4.8, count: 20 } }),
  makeProduct({ id: 7, title: "Rain shell", category: "men's clothing", rating: { rate: 3.9, count: 12 } }),
  makeProduct({ id: 8, title: "Bracelet", category: "jewelery", rating: { rate: 1.2, count: 3 } }),
  makeProduct({ id: 9, title: "Phone case", category: "electronics", rating: { rate: 4.0, count: 70 } }),
  makeProduct({ id: 10, title: "Hoodie", category: "men's clothing", description: "Warm cotton", rating: { rate: 4.2, count: 40 } }),
  makeProduct({ id: 11, title: "Tote bag", category: "women's clothing", rating: { rate: 3.3, count: 9 } }),
];

/** In-memory ProductSource double backed by a fixed list. */
export function fakeSource(products: Product[] = sampleProducts) {
  const categories = [...new Set(products.map((p) => p.category))];
  return {
    listProducts: vi.fn(async (): Promise<Product[]> => products),
    getProduct: vi.fn(async (id: number): Promise<Product | null> => products.find((p) => p.id === id) ?? null),
    listCategories: vi.fn(async (): Promise<string[]> => categories),
  } satisfies ProductSource & Record<string, unknown>;
}

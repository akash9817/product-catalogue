import { z } from "zod";
import type { ProductSource } from "./ProductSource.js";
import { ProductSourceError } from "./errors.js";
import type { Product } from "./types.js";

const productSchema = z.object({
  id: z.number(),
  title: z.string(),
  price: z.number(),
  description: z.string(),
  category: z.string(),
  image: z.string(),
  rating: z.object({
    rate: z.number(),
    count: z.number(),
  }),
});

const productListSchema = z.array(productSchema);
const categoriesSchema = z.array(z.string());

export interface FakeStoreOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

/**
 * Adapter for https://fakestoreapi.com. Only this file knows about the Fake Store
 * payload; everything else works with the `Product` domain type.
 */
export class FakeStoreProductSource implements ProductSource {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: FakeStoreOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 5000;
  }

  async listProducts(): Promise<Product[]> {
    const data = await this.getJson("/products", productListSchema);
    return data;
  }

  async getProduct(id: number): Promise<Product | null> {
    const response = await this.request(`/products/${id}`);
    if (response.status === 404) {
      return null;
    }
    return this.parse(response, productSchema, `/products/${id}`);
  }

  async listCategories(): Promise<string[]> {
    return this.getJson("/products/categories", categoriesSchema);
  }

  private async getJson<T>(path: string, schema: z.ZodType<T>): Promise<T> {
    const response = await this.request(path);
    return this.parse(response, schema, path);
  }

  private async request(path: string): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      if (!response.ok && response.status !== 404) {
        throw new ProductSourceError(`Fake Store returned HTTP ${response.status} for ${path}`);
      }
      return response;
    } catch (error) {
      if (error instanceof ProductSourceError) {
        throw error;
      }
      throw new ProductSourceError(`Fake Store request failed for ${path}`, { cause: error });
    } finally {
      clearTimeout(timer);
    }
  }

  private async parse<T>(response: Response, schema: z.ZodType<T>, path: string): Promise<T> {
    let body: unknown;
    try {
      body = await response.json();
    } catch (error) {
      throw new ProductSourceError(`Fake Store returned invalid JSON for ${path}`, { cause: error });
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new ProductSourceError(`Fake Store payload for ${path} did not match the expected shape`);
    }
    return parsed.data;
  }
}

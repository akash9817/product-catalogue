import { describe, expect, it, vi } from "vitest";
import { FakeStoreProductSource } from "../src/products/FakeStoreProductSource.js";
import { ProductSourceError } from "../src/products/errors.js";
import { makeProduct } from "./fixtures.js";

const BASE = "https://fakestoreapi.test";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function sourceWith(fetchImpl: typeof fetch) {
  return new FakeStoreProductSource({ baseUrl: `${BASE}/`, fetchImpl });
}

describe("FakeStoreProductSource", () => {
  it("maps the product list and strips trailing slashes from the base URL", async () => {
    const product = makeProduct({ id: 1 });
    const fetchImpl = vi.fn(async () => jsonResponse([product]));
    const source = sourceWith(fetchImpl as unknown as typeof fetch);

    const products = await source.listProducts();

    expect(products).toEqual([product]);
    expect(fetchImpl.mock.calls[0]![0]).toBe(`${BASE}/products`);
  });

  it("returns null for an unknown product id", async () => {
    const fetchImpl = vi.fn(async () => new Response("", { status: 404 }));
    const source = sourceWith(fetchImpl as unknown as typeof fetch);
    expect(await source.getProduct(999)).toBeNull();
  });

  it("loads categories", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(["electronics", "jewelery"]));
    const source = sourceWith(fetchImpl as unknown as typeof fetch);
    expect(await source.listCategories()).toEqual(["electronics", "jewelery"]);
    expect(fetchImpl.mock.calls[0]![0]).toBe(`${BASE}/products/categories`);
  });

  it("throws ProductSourceError on an HTTP 5xx", async () => {
    const fetchImpl = vi.fn(async () => new Response("oops", { status: 503 }));
    const source = sourceWith(fetchImpl as unknown as typeof fetch);
    await expect(source.listProducts()).rejects.toBeInstanceOf(ProductSourceError);
  });

  it("throws ProductSourceError when the payload does not match the expected shape", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse([{ id: "not-a-number" }]));
    const source = sourceWith(fetchImpl as unknown as typeof fetch);
    await expect(source.listProducts()).rejects.toThrow(/did not match/);
  });

  it("throws ProductSourceError when the network request fails", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    const source = sourceWith(fetchImpl as unknown as typeof fetch);
    await expect(source.listCategories()).rejects.toBeInstanceOf(ProductSourceError);
  });
});

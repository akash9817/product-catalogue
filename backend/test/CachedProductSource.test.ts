import { describe, expect, it } from "vitest";
import { CachedProductSource } from "../src/products/CachedProductSource.js";
import { fakeSource, makeProduct } from "./fixtures.js";

describe("CachedProductSource", () => {
  it("serves repeated reads from the cache within the TTL", async () => {
    const inner = fakeSource([makeProduct({ id: 1 })]);
    const cached = new CachedProductSource(inner, 60_000);

    await cached.listProducts();
    await cached.listProducts();
    await cached.getProduct(1);
    await cached.getProduct(1);

    expect(inner.listProducts).toHaveBeenCalledTimes(1);
    expect(inner.getProduct).toHaveBeenCalledTimes(1);
  });

  it("reloads after the TTL has expired", async () => {
    let now = 0;
    const inner = fakeSource([makeProduct({ id: 1 })]);
    const cached = new CachedProductSource(inner, 1_000, () => now);

    await cached.listCategories();
    now = 999;
    await cached.listCategories();
    expect(inner.listCategories).toHaveBeenCalledTimes(1);

    now = 1_000;
    await cached.listCategories();
    expect(inner.listCategories).toHaveBeenCalledTimes(2);
  });

  it("does not cache when the TTL is zero", async () => {
    const inner = fakeSource([makeProduct({ id: 1 })]);
    const cached = new CachedProductSource(inner, 0);

    await cached.listProducts();
    await cached.listProducts();
    expect(inner.listProducts).toHaveBeenCalledTimes(2);
  });
});

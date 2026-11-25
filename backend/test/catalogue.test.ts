import { describe, expect, it } from "vitest";
import { CATEGORY_TOP_RATED_COUNT, CatalogueService, FEATURED_COUNT, toCategorySlug } from "../src/services/catalogue.js";
import { fakeSource, makeProduct, sampleProducts } from "./fixtures.js";

describe("toCategorySlug", () => {
  it("makes URL-safe slugs from Fake Store category names", () => {
    expect(toCategorySlug("men's clothing")).toBe("mens-clothing");
    expect(toCategorySlug("jewelery")).toBe("jewelery");
    expect(toCategorySlug("  Women's  Clothing ")).toBe("womens-clothing");
  });
});

describe("CatalogueService.getFeatured", () => {
  it("returns the top five products by rating", async () => {
    const service = new CatalogueService(fakeSource());
    const featured = await service.getFeatured();

    expect(featured).toHaveLength(FEATURED_COUNT);
    expect(featured.map((p) => p.id)).toEqual([2, 3, 6, 5, 10]);
  });

  it("breaks rating ties by review count, then id", async () => {
    const products = [
      makeProduct({ id: 20, rating: { rate: 4.5, count: 10 } }),
      makeProduct({ id: 21, rating: { rate: 4.5, count: 99 } }),
      makeProduct({ id: 22, rating: { rate: 4.5, count: 10 } }),
    ];
    const service = new CatalogueService(fakeSource(products));
    const featured = await service.getFeatured();
    expect(featured.map((p) => p.id)).toEqual([21, 20, 22]);
  });

  it("does not mutate the source list", async () => {
    const products = [...sampleProducts];
    const before = products.map((p) => p.id);
    await new CatalogueService(fakeSource(products)).getFeatured();
    expect(products.map((p) => p.id)).toEqual(before);
  });
});

describe("CatalogueService.listCategories", () => {
  it("returns name and slug pairs", async () => {
    const service = new CatalogueService(fakeSource());
    const categories = await service.listCategories();
    expect(categories).toContainEqual({ name: "men's clothing", slug: "mens-clothing" });
  });
});

describe("CatalogueService.getCategory", () => {
  it("returns the category with its products ordered by rating", async () => {
    const service = new CatalogueService(fakeSource());
    const view = await service.getCategory("mens-clothing");

    expect(view).not.toBeNull();
    expect(view!.category).toEqual({ name: "men's clothing", slug: "mens-clothing" });
    // Men's clothing has four products (ids 1, 4, 7, 10); all fit in the top-rated block.
    expect(view!.topRated.map((p) => p.id)).toEqual([10, 1, 7, 4]);
    expect(view!.additional).toEqual([]);
  });

  it("puts the overflow into additional when a category has more than the top-rated count", async () => {
    const products = Array.from({ length: 6 }, (_, i) =>
      makeProduct({ id: 100 + i, category: "electronics", rating: { rate: 5 - i * 0.5, count: 1 } }),
    );
    const service = new CatalogueService(fakeSource(products));
    const view = await service.getCategory("electronics");

    expect(view!.topRated).toHaveLength(CATEGORY_TOP_RATED_COUNT);
    expect(view!.additional.map((p) => p.id)).toEqual([104, 105]);
    expect(view!.topRated[0]!.id).toBe(100);
  });

  it("returns null for an unknown category slug", async () => {
    const service = new CatalogueService(fakeSource());
    expect(await service.getCategory("not-a-category")).toBeNull();
  });
});

describe("CatalogueService.search", () => {
  it("matches title case-insensitively", async () => {
    const service = new CatalogueService(fakeSource());
    const results = await service.search("MONITOR");
    expect(results.map((p) => p.id)).toEqual([6]);
  });

  it("matches description text", async () => {
    const service = new CatalogueService(fakeSource());
    const results = await service.search("cotton");
    expect(results.map((p) => p.id)).toEqual([10]);
  });

  it("does not match on category name", async () => {
    const service = new CatalogueService(fakeSource());
    const results = await service.search("jewelery");
    expect(results).toEqual([]);
  });

  it("returns nothing for an empty or whitespace term", async () => {
    const service = new CatalogueService(fakeSource());
    expect(await service.search("   ")).toEqual([]);
  });

  it("only returns products whose text contains the term", async () => {
    const service = new CatalogueService(fakeSource());
    const results = await service.search("ring");
    expect(results.every((p) => `${p.title} ${p.description}`.toLowerCase().includes("ring"))).toBe(true);
    expect(results.map((p) => p.id)).toEqual([2]);
  });
});

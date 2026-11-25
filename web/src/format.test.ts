import { describe, expect, it } from "vitest";
import { formatCategoryName, formatPrice, toCategorySlug } from "./format";

describe("formatCategoryName", () => {
  it("capitalises each word without touching letters after an apostrophe", () => {
    expect(formatCategoryName("men's clothing")).toBe("Men's Clothing");
    expect(formatCategoryName("jewelery")).toBe("Jewelery");
  });
});

describe("toCategorySlug", () => {
  it("matches the backend slug rules", () => {
    expect(toCategorySlug("men's clothing")).toBe("mens-clothing");
    expect(toCategorySlug("women's clothing")).toBe("womens-clothing");
  });
});

describe("formatPrice", () => {
  it("formats amounts as US dollars", () => {
    expect(formatPrice(695)).toBe("$695.00");
  });
});

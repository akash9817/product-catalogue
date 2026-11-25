import type { ProductSource } from "../products/ProductSource.js";
import type { Product } from "../products/types.js";

/** Number of products shown on the home page. */
export const FEATURED_COUNT = 5;
/** Number of "top rated" products shown first on a category page. */
export const CATEGORY_TOP_RATED_COUNT = 4;

export interface CategorySummary {
  slug: string;
  name: string;
}

export interface CategoryView {
  category: CategorySummary;
  topRated: Product[];
  additional: Product[];
}

/** Turns "men's clothing" into "mens-clothing" for use in URLs. */
export function toCategorySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/'/g, "")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Highest rating first; ties go to the product with more reviews, then lowest id. */
export function compareByRating(a: Product, b: Product): number {
  if (b.rating.rate !== a.rating.rate) {
    return b.rating.rate - a.rating.rate;
  }
  if (b.rating.count !== a.rating.count) {
    return b.rating.count - a.rating.count;
  }
  return a.id - b.id;
}

export class CatalogueService {
  constructor(private readonly source: ProductSource) {}

  /** The "chosen" top rated products for the home page. */
  async getFeatured(): Promise<Product[]> {
    const products = await this.source.listProducts();
    return [...products].sort(compareByRating).slice(0, FEATURED_COUNT);
  }

  async listCategories(): Promise<CategorySummary[]> {
    const names = await this.source.listCategories();
    return names.map((name) => ({ name, slug: toCategorySlug(name) }));
  }

  /** Returns null when no category matches the slug. */
  async getCategory(slug: string): Promise<CategoryView | null> {
    const categories = await this.listCategories();
    const match = categories.find((category) => category.slug === slug);
    if (!match) {
      return null;
    }

    const inCategory = (await this.source.listProducts())
      .filter((product) => product.category === match.name)
      .sort(compareByRating);

    return {
      category: match,
      topRated: inCategory.slice(0, CATEGORY_TOP_RATED_COUNT),
      additional: inCategory.slice(CATEGORY_TOP_RATED_COUNT),
    };
  }

  /**
   * Case-insensitive substring match on title and description only.
   * An empty term returns no results.
   */
  async search(term: string): Promise<Product[]> {
    const needle = term.trim().toLowerCase();
    if (needle.length === 0) {
      return [];
    }
    const products = await this.source.listProducts();
    return products
      .filter(
        (product) =>
          product.title.toLowerCase().includes(needle) ||
          product.description.toLowerCase().includes(needle),
      )
      .sort(compareByRating);
  }

  /** Returns null when the product does not exist. */
  async getProduct(id: number): Promise<Product | null> {
    return this.source.getProduct(id);
  }
}

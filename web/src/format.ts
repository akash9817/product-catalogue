const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function formatPrice(amount: number): string {
  return currency.format(amount);
}

/** Title-cases a Fake Store category name, e.g. "men's clothing" -> "Men's Clothing". */
export function formatCategoryName(name: string): string {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Must match the backend's toCategorySlug (backend/src/services/catalogue.ts),
 * so links built here resolve against the category API.
 */
export function toCategorySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/'/g, "")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

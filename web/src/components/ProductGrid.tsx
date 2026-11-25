import type { Product } from "../api/types";
import { ProductTile } from "./ProductTile";

interface ProductGridProps {
  products: Product[];
  emptyMessage?: string;
}

export function ProductGrid({ products, emptyMessage = "No products to show yet." }: ProductGridProps) {
  if (products.length === 0) {
    return <p className="empty-state">{emptyMessage}</p>;
  }
  return (
    <ul className="product-grid">
      {products.map((product) => (
        <li key={product.id}>
          <ProductTile product={product} />
        </li>
      ))}
    </ul>
  );
}

import { Link } from "react-router-dom";
import type { Product } from "../api/types";
import { formatPrice } from "../format";

export function ProductTile({ product }: { product: Product }) {
  return (
    <Link to={`/products/${product.id}`} className="product-tile" aria-label={product.title}>
      <div className="product-tile__image">
        <img src={product.image} alt="" loading="lazy" />
      </div>
      <div className="product-tile__body">
        <h3 className="product-tile__title">{product.title}</h3>
        <p className="product-tile__price">{formatPrice(product.price)}</p>
        <p className="product-tile__rating">
          {product.rating.rate.toFixed(1)} rating ({product.rating.count} reviews)
        </p>
      </div>
    </Link>
  );
}

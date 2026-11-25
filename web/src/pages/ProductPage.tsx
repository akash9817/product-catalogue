import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { EnquiryForm } from "../components/EnquiryForm";
import { ErrorMessage, Loading } from "../components/StatusMessage";
import { formatCategoryName, formatPrice, toCategorySlug } from "../format";
import { useAsync } from "../hooks/useAsync";

export function ProductPage() {
  const { id = "" } = useParams();
  const productId = Number(id);
  const product = useAsync(`product:${id}`, () => api.getProduct(productId));
  const [enquiring, setEnquiring] = useState(false);

  if (product.status === "loading") return <Loading />;
  if (product.status === "error") return <ErrorMessage message={product.error} />;

  const item = product.data;
  return (
    <article className="product-detail">
      <div className="product-detail__image">
        <img src={item.image} alt={item.title} />
      </div>
      <div className="product-detail__body">
        <h1>{item.title}</h1>
        <p className="product-tile__price">{formatPrice(item.price)}</p>
        <p>
          Category:{" "}
          <Link to={`/category/${toCategorySlug(item.category)}`}>{formatCategoryName(item.category)}</Link>
        </p>
        <p>
          {item.rating.rate.toFixed(1)} rating ({item.rating.count} reviews)
        </p>
        <p>{item.description}</p>

        {enquiring ? (
          <EnquiryForm productId={item.id} productTitle={item.title} />
        ) : (
          <button type="button" className="button-primary" onClick={() => setEnquiring(true)}>
            Enquire
          </button>
        )}
      </div>
    </article>
  );
}

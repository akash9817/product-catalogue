import { useParams } from "react-router-dom";
import { api } from "../api/client";
import { ProductGrid } from "../components/ProductGrid";
import { ErrorMessage, Loading } from "../components/StatusMessage";
import { formatCategoryName } from "../format";
import { useAsync } from "../hooks/useAsync";

export function CategoryPage() {
  const { slug = "" } = useParams();
  const category = useAsync(`category:${slug}`, () => api.getCategory(slug));

  if (category.status === "loading") return <Loading />;
  if (category.status === "error") return <ErrorMessage message={category.error} />;

  const { category: summary, topRated, additional } = category.data;
  const title = formatCategoryName(summary.name);

  return (
    <section>
      <h1>{title}</h1>

      <h2>Top rated in {title}</h2>
      <ProductGrid products={topRated} emptyMessage="No products in this category yet." />

      {additional.length > 0 && (
        <>
          <h2>More in {title}</h2>
          <ProductGrid products={additional} />
        </>
      )}
    </section>
  );
}

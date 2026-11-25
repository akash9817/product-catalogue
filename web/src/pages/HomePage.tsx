import { api } from "../api/client";
import { ProductGrid } from "../components/ProductGrid";
import { ErrorMessage, Loading } from "../components/StatusMessage";
import { useAsync } from "../hooks/useAsync";

export function HomePage() {
  const featured = useAsync("featured", () => api.getFeatured());

  return (
    <section>
      <h1>Top rated products</h1>
      {featured.status === "loading" && <Loading />}
      {featured.status === "error" && <ErrorMessage message={featured.error} />}
      {featured.status === "success" && <ProductGrid products={featured.data} />}
    </section>
  );
}

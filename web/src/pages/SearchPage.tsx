import { useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { ProductGrid } from "../components/ProductGrid";
import { ErrorMessage, Loading } from "../components/StatusMessage";
import { useAsync } from "../hooks/useAsync";

export function SearchPage() {
  const [params] = useSearchParams();
  const term = (params.get("q") ?? "").trim();

  if (!term) {
    return (
      <section>
        <h1>Search</h1>
        <p>Enter a term in the search bar to find products.</p>
      </section>
    );
  }

  return <SearchResults term={term} />;
}

function SearchResults({ term }: { term: string }) {
  const results = useAsync(`search:${term}`, () => api.searchProducts(term));

  return (
    <section>
      <h1>Results for &ldquo;{term}&rdquo;</h1>
      {results.status === "loading" && <Loading label="Searching..." />}
      {results.status === "error" && <ErrorMessage message={results.error} />}
      {results.status === "success" && (
        <>
          <p aria-live="polite">
            {results.data.length} {results.data.length === 1 ? "product" : "products"} found
          </p>
          <ProductGrid products={results.data} emptyMessage="No products match your search." />
        </>
      )}
    </section>
  );
}

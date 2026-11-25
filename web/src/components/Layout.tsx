import { Link, NavLink, Outlet } from "react-router-dom";
import { api } from "../api/client";
import { formatCategoryName } from "../format";
import { useAsync } from "../hooks/useAsync";
import { SearchBar } from "./SearchBar";

export function Layout() {
  const categories = useAsync("categories", () => api.listCategories());

  return (
    <div className="app">
      <header className="site-header">
        <div className="site-header__top">
          <Link to="/" className="site-logo">
            Catalogue
          </Link>
          <SearchBar />
        </div>
        <nav className="site-nav" aria-label="Categories">
          {categories.status === "success" &&
            categories.data.map((category) => (
              <NavLink key={category.slug} to={`/category/${category.slug}`}>
                {formatCategoryName(category.name)}
              </NavLink>
            ))}
        </nav>
      </header>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <p>Proof of concept. Product data is provided by the Fake Store API.</p>
      </footer>
    </div>
  );
}

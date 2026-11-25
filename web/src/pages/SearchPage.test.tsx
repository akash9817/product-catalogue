import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client";
import type { Product } from "../api/types";
import { Layout } from "../components/Layout";
import { SearchPage } from "./SearchPage";

vi.mock("../api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/client")>();
  return {
    ...actual,
    api: {
      listCategories: vi.fn(async () => []),
      searchProducts: vi.fn(),
    },
  };
});

const searchProducts = vi.mocked(api.searchProducts);

const monitor: Product = {
  id: 6,
  title: "Monitor",
  price: 199,
  description: "27 inch display",
  category: "electronics",
  image: "https://example.com/monitor.png",
  rating: { rate: 4.8, count: 20 },
};

const jacket: Product = {
  id: 4,
  title: "Wool jacket",
  price: 55,
  description: "Warm",
  category: "men's clothing",
  image: "https://example.com/jacket.png",
  rating: { rate: 2.5, count: 5 },
};

function renderApp(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<p>Home</p>} />
          <Route path="search" element={<SearchPage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("search", () => {
  beforeEach(() => {
    searchProducts.mockReset();
  });

  it("asks the user for a term when there is no query", () => {
    renderApp("/search");
    expect(screen.getByText(/Enter a term in the search bar/)).toBeInTheDocument();
    expect(searchProducts).not.toHaveBeenCalled();
  });

  it("disables the search button until a term is entered", async () => {
    const user = userEvent.setup();
    renderApp("/");

    const button = screen.getByRole("button", { name: "Search" });
    expect(button).toBeDisabled();

    await user.type(screen.getByRole("searchbox"), "mon");
    expect(button).toBeEnabled();
  });

  it("searches when the search button is clicked and shows only matching products", async () => {
    const user = userEvent.setup();
    searchProducts.mockResolvedValue([monitor]);
    renderApp("/");

    await user.type(screen.getByRole("searchbox"), "monitor");
    await user.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => expect(searchProducts).toHaveBeenCalledWith("monitor"));
    expect(await screen.findByText("1 product found")).toBeInTheDocument();
    const results = screen.getByRole("list");
    expect(within(results).getByRole("link", { name: "Monitor" })).toBeInTheDocument();
    expect(within(results).queryByRole("link", { name: "Wool jacket" })).not.toBeInTheDocument();
  });

  it("shows an empty state when nothing matches", async () => {
    searchProducts.mockResolvedValue([]);
    renderApp("/search?q=zzz");

    expect(await screen.findByText("0 products found")).toBeInTheDocument();
    expect(screen.getByText("No products match your search.")).toBeInTheDocument();
  });

  it("renders results for the term in the URL", async () => {
    searchProducts.mockResolvedValue([jacket]);
    renderApp("/search?q=jacket");

    expect(await screen.findByRole("link", { name: "Wool jacket" })).toBeInTheDocument();
    expect(searchProducts).toHaveBeenCalledWith("jacket");
  });
});

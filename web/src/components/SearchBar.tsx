import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

interface SearchBarProps {
  initialValue?: string;
}

export function SearchBar({ initialValue = "" }: SearchBarProps) {
  const [term, setTerm] = useState(initialValue);
  const navigate = useNavigate();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = term.trim();
    if (!trimmed) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form className="search-bar" role="search" onSubmit={handleSubmit}>
      <label htmlFor="site-search" className="visually-hidden">
        Search products
      </label>
      <input
        id="site-search"
        type="search"
        placeholder="Search products"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
      />
      <button type="submit" disabled={term.trim().length === 0}>
        Search
      </button>
    </form>
  );
}

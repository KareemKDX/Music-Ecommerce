import { useState, useEffect } from "react";
import type { Product } from "../types/Product";
import ProductCard from "./ProductCard";
import "../css/Products.css";
import api from "../axios/api";
import Loading from "../components/Loading";

const PAGE_SIZE = 12;

type SearchMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

function Products() {
  // Vanliga produktlistan (från databasen)
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Sökningen (från Algolia via vårt eget API)
  const [searchText, setSearchText] = useState(""); // det man skriver i fältet
  const [query, setQuery] = useState(""); // det man har sökt på
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<Product[]>([]);
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Hämta alla produkter när sidan laddas
  useEffect(() => {
    async function getProducts() {
      try {
        const response = await api.get("/products");
        const data: Product[] = response.data;
        setProducts(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    getProducts();
  }, []);

  // SEARCH WHEN FIELD
  useEffect(() => {
    if (query === "") {
      return;
    }

    async function search() {
      setSearching(true);
      setSearchError("");

      try {
        const response = await api.get("/search", {
          params: { q: query, page: page, pageSize: PAGE_SIZE },
        });

        setResults(response.data.data);
        setMeta(response.data.meta);
      } catch (error) {
        console.error(error);
        setResults([]);
        setMeta(null);
        setSearchError(
          "Sökningen fungerar inte just nu. Försök igen om en stund.",
        );
      } finally {
        setSearching(false);
      }
    }

    search();
  }, [query, page]);

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    setPage(1); // ny sökning börjar alltid på sida 1
    setQuery(searchText.trim());
  }

  function clearSearch() {
    setSearchText("");
    setQuery("");
    setPage(1);
    setResults([]);
    setMeta(null);
    setSearchError("");
  }

  function goToPreviousPage() {
    if (page > 1) {
      setPage(page - 1);
    }
  }

  function goToNextPage() {
    if (meta !== null && page < meta.totalPages) {
      setPage(page + 1);
    }
  }

  if (loading) {
    return <Loading />;
  }

  const isSearching = query !== "";

  return (
    <>
      <div className="search-container">
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search products..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            maxLength={100}
          />
          <button type="submit" className="primary-button">
            Search
          </button>
          {isSearching && (
            <button
              type="button"
              className="outline-button"
              onClick={clearSearch}
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {isSearching && searching && <Loading />}

      {isSearching && searchError !== "" && (
        <p className="search-message error-text">{searchError}</p>
      )}

      {isSearching && !searching && searchError === "" && meta !== null && (
        <p className="search-message">
          {meta.total} matches for "{query}"
        </p>
      )}

      {isSearching &&
        !searching &&
        searchError === "" &&
        results.length === 0 && (
          <p className="search-message">No products matched your search.</p>
        )}

      {/* SHOW WHEN FIELD HAS STRING, OTHERWISE FROM DB */}
      <div className="product-container">
        {isSearching
          ? results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          : products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
      </div>

      {isSearching && meta !== null && meta.totalPages > 1 && (
        <div className="search-pagination">
          <button onClick={goToPreviousPage} disabled={page === 1}>
            Föregående
          </button>
          <span>
            Sida {meta.page} av {meta.totalPages}
          </span>
          <button onClick={goToNextPage} disabled={page === meta.totalPages}>
            Nästa
          </button>
        </div>
      )}
    </>
  );
}

export default Products;

import { useState } from "react";
import type { ImportedProduct, SkippedProduct } from "../types/importedProduct";

import "../css/AdminProductPage.css";

type ImportProductProps = {
  importedProducts: ImportedProduct[];
  skippedProducts: SkippedProduct[];
  formatType: string;
};

const PAGE_SIZE = 10;

function ImportProduct({
  importedProducts,
  skippedProducts,
  formatType,
}: ImportProductProps) {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(importedProducts.length / PAGE_SIZE);

  const startIndex = (page - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const visibleProducts = importedProducts.slice(startIndex, endIndex);

  function goToPreviousPage() {
    if (page > 1) {
      setPage(page - 1);
    }
  }

  function goToNextPage() {
    if (page < totalPages) {
      setPage(page + 1);
    }
  }

  return (
    <div className="imported-products-card">
      <p>
        {importedProducts.length} produkter importerade från{" "}
        {formatType.toUpperCase()}
      </p>

      <div className="skipped-table">
        <p className="error-text">
          Products with errors: {skippedProducts.length}
        </p>

        {skippedProducts.length > 0 && (
          <p>
            {skippedProducts.map((sProduct) => (
              <p key={sProduct.sku}>
                SKU: {sProduct.sku} Reason: {sProduct.reason}
              </p>
            ))}
          </p>
        )}
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Name</th>
            <th>Description</th>
            <th>Price</th>
            <th>Image</th>
          </tr>
        </thead>
        <tbody>
          {visibleProducts.map((mProduct) => (
            <tr key={mProduct.sku}>
              <td>{mProduct.sku}</td>
              <td>{mProduct.name}</td>
              <td>{mProduct.description}</td>
              <td>{mProduct.price} kr</td>
              <td>{mProduct.image}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={goToPreviousPage} disabled={page === 1}>
            Föregående
          </button>

          <span>
            Sida {page} av {totalPages}
          </span>

          <button onClick={goToNextPage} disabled={page === totalPages}>
            Nästa
          </button>
        </div>
      )}
    </div>
  );
}

export default ImportProduct;

import type { ImportedProduct, SkippedProduct } from "../types/importedProduct";

import "../css/AdminProductPage.css";

type ImportProductProps = {
  importedProducts: ImportedProduct[];
  skippedProducts: SkippedProduct[];
};

function ImportProduct({
  importedProducts,
  skippedProducts,
}: ImportProductProps) {
  return (
    <div className="imported-products-card">
      <p>{importedProducts.length} produkter importerade</p>
      <p>{skippedProducts.length} produkter hoppades över</p>

      {skippedProducts.length > 0 && (
        <ul>
          {skippedProducts.map((sProduct) => (
            <li key={sProduct.sku}>
              {sProduct.sku}: {sProduct.reason}
            </li>
          ))}
        </ul>
      )}

      <table className="admin-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Namn</th>
            <th>Beskrivning</th>
            <th>Pris</th>
            <th>Bild</th>
          </tr>
        </thead>
        <tbody>
          {importedProducts.map((mProduct) => (
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
    </div>
  );
}

export default ImportProduct;

import type { Product } from "../types/Product";
import { useNavigate } from "react-router-dom";

function AdminProductCard({
  product,
  deleteProduct,
}: {
  product: Product;
  deleteProduct: (id: number) => void;
}) {
  const navigate = useNavigate();

  return (
    <div className="product-card">
      <div className="product-image">
        <img src={"/Images/" + product.image} alt={product.name} />
      </div>

      <div className="product-info">
        <h2>{product.name}</h2>
        <p className="product-price">{product.price} kr</p>
      </div>

      <div className="product-actions">
        <button>More</button>
        <button onClick={() => navigate("/admin/product/edit/" + product.id)}>
          Edit
        </button>

        <button onClick={() => deleteProduct(product.id)}>Delete</button>
      </div>
    </div>
  );
}

export default AdminProductCard;

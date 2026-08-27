import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Product } from "../types/Product";
import "../css/EditProductPage.css";

import api from "../axios/api";

function EditProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    async function getProduct() {
      try {
        const response = await api.get("/products/" + id);

        const data: Product[] = response.data;

        setProduct(data[0]);
      } catch (error) {
        console.error(error);
      }
    }

    getProduct();
  }, [id]);

  async function updateProduct(event: React.SubmitEvent) {
    event.preventDefault();

    if (!product) {
      return;
    }

    try {
      await api.put("/products/" + product.id, {
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
      });

      navigate("/admin");
    } catch (error) {
      console.error(error);
    }
  }

  if (!product) {
    return <p>Laddar produkt...</p>;
  }

  return (
    <div className="forms-page-container">
      <div className="edit-product-header">
        <h1>Redigera produkt</h1>
      </div>

      <form className="form-card" onSubmit={updateProduct}>
        <div className="form-group">
          <label htmlFor="name">Namn</label>

          <input
            id="name"
            type="text"
            value={product.name}
            onChange={(event) =>
              setProduct({
                ...product,
                name: event.target.value,
              })
            }
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Beskrivning</label>

          <textarea
            id="description"
            value={product.description}
            onChange={(event) =>
              setProduct({
                ...product,
                description: event.target.value,
              })
            }
          />
        </div>

        <div className="form-group">
          <label htmlFor="price">Pris</label>

          <input
            id="price"
            type="number"
            value={product.price}
            onChange={(event) =>
              setProduct({
                ...product,
                price: Number(event.target.value),
              })
            }
          />
        </div>

        <div className="form-group">
          <label htmlFor="image">Bild</label>

          <input
            id="image"
            type="text"
            value={product.image}
            onChange={(event) =>
              setProduct({
                ...product,
                image: event.target.value,
              })
            }
          />
        </div>

        <button className="primary-button" type="submit">
          Spara ändringar
        </button>

        <button
          className="delete-button"
          type="button"
          onClick={() => navigate("/admin")}
        >
          Avbryt
        </button>
      </form>
    </div>
  );
}

export default EditProductPage;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../axios/api";
import "../css/CreateProductPage.css";

function CreateProductPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [image, setImage] = useState("");

  async function createProduct(event: React.SubmitEvent) {
    event.preventDefault();

    try {
      //POST NEW PRODUCT TO DATABASE
      const token = localStorage.getItem("token");

      await api.post(
        "/products",
        { name, description, price, image },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // NAVIGATE TO ADMIN PAGE IF EVERYTHING OK
      navigate("/admin");
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="forms-page-container">
      <div className="create-product-header">
        <h1>Fill in form to create a new product</h1>
      </div>

      <form className="form-card" onSubmit={createProduct}>
        <div className="form-group">
          <label htmlFor="name">Namn</label>

          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Beskrivning</label>

          <textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="price">Pris</label>

          <input
            id="price"
            type="number"
            min="0"
            value={price}
            onChange={(event) => setPrice(Number(event.target.value))}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="image">Bild</label>

          <input
            id="image"
            type="text"
            value={image}
            onChange={(event) => setImage(event.target.value)}
            required
          />
        </div>

        <button className="primary-button" type="submit">
          Skapa produkt
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

export default CreateProductPage;

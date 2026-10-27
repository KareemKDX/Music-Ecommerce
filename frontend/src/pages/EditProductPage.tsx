import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Product } from "../types/Product";
import "../css/EditProductPage.css";
import { Link } from "react-router-dom";

import api from "../axios/api";

function EditProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);

  //IMAGE UPLOAD
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");

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

  async function updateProduct(event: React.FormEvent) {
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

  async function uploadImage() {
    if (!product || !imageFile) {
      return;
    }

    if (!product.sku) {
      setUploadError("This product has no article number (sku) yet.");
      return;
    }

    setUploadError("");
    setUploadMessage("");
    setUploading(true);

    const form = new FormData();
    form.append("image", imageFile);

    try {
      const response = await api.post(
        "/admin/products/" + product.sku + "/image",
        form,
      );

      // SET UPLOADED IMAGE
      setProduct({ ...product, image_url: response.data.url });
      setImageFile(null);
      setUploadMessage("Image uploaded.");
    } catch (error: any) {
      // IF FAILED KEEP OLD IMAGE FILE
      setUploadError(
        error.response?.data?.error ?? "Could not upload the image.",
      );
    }

    setUploading(false);
  }

  if (!product) {
    return <p>Laddar produkt...</p>;
  }

  const currentImage = product.image_url
    ? product.image_url
    : "/Images/" + product.image;

  return (
    <div className="admin-page">
      <div className="admin-header-content">
        <div>
          <h1>Admin Dashboard</h1>

          <p className="admin-subtitle">Edit product</p>
          <Link to="/admin/products" className="back-link">
            <span className="back-link-arrow">←</span>
            Back to dashboard
          </Link>
        </div>
      </div>
      <div className="forms-page-container">
        <div className="edit-product-header">
          <h3>Redigera produkt</h3>
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
            <label htmlFor="image-file">Bild</label>

            <div className="image-upload">
              <img
                className="image-upload-preview"
                src={currentImage}
                alt={product.name}
              />

              <input
                id="image-file"
                type="file"
                accept="image/png, image/jpeg"
                onChange={(event) =>
                  setImageFile(event.target.files?.[0] ?? null)
                }
              />

              <button
                className="outline-button"
                type="button"
                onClick={uploadImage}
                disabled={!imageFile || uploading}
              >
                {uploading ? "Laddar upp..." : "Ladda upp bild"}
              </button>

              {uploadError && <p className="error-text">{uploadError}</p>}
              {uploadMessage && (
                <p className="upload-success">{uploadMessage}</p>
              )}
            </div>
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
    </div>
  );
}

export default EditProductPage;

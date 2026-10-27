import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { pool } from "../mysql-database";
import jwt from "jsonwebtoken";
import { indexProducts } from "../integrations/search-adapter";
import { Product } from "../types/Product";
import {
  removeProductImage,
  uploadProductImage,
} from "../integrations/storage-adapter";
import multer from "multer";
import { authenticateJWT } from "../authentication/authenticateJWT";

const adminRouter = Router();

adminRouter.post("/login", async (req, res) => {
  try {
    let email = req.body.email;
    let password = req.body.password;

    const [rows] = await pool.execute(
      `SELECT id, email
       FROM users
       WHERE email = ? AND password = ? AND is_Admin = true`,
      [email, password],
    );

    // TYPE
    const admins = rows as {
      id: number;
      email: string;
    }[];

    //IF NOT FOUND
    if (admins.length === 0) {
      return res.status(401).json({
        message: "Fel email eller lösenord",
      });
    }

    const admin = admins[0];

    const token = jwt.sign(
      {
        userId: admin.id,
        email: admin.email,
        role: "admin",
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: "2h",
      },
    );

    res.json({
      message: "Inloggning lyckades",
      admin: admins[0],
      token,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Kunde inte logga in",
    });
  }
});

//AGOLIA

adminRouter.post("/search/index", async (_req, res) => {
  try {
    // FETCH ALL PROODUCTS FROM DATABASE AND LOOP THROUGH THEM
    const [rows] = await pool.query(
      "SELECT id, sku, name, description, price, image FROM products WHERE sku IS NOT NULL",
    );

    const products: Product[] = [];
    for (const row of rows as any[]) {
      products.push({
        id: row.id,
        sku: row.sku,
        name: row.name,
        description: row.description,
        price: Number(row.price),
        image: row.image,
      });
    }

    // 2. Skicka dem till Algolia
    const indexed = await indexProducts(products);
    res.json({ indexed });
  } catch (err) {
    console.error("Could not send the products to Algolia:", err);
    res.status(502).json({
      error:
        "Could not send the products to the search service. Try again later.",
    });
  }
});

/* --- CREATE: POST /api/admin/products --- */
adminRouter.post("/products", async (req, res) => {
  const newProduct: Product = {
    sku: "LEV-1009",
    name: "Vit strumpor",
    image: "Strumpor",
    price: 29,
    description: "Mjuk strumpor i ekologisk bomull.",
  };

  try {
    // Remember that Algolia is to mirror what is saved in the products table in your DB. Make sure to do the following order when performing CRUD
    // 1. Save first in DB
    // 2. If all is well,  index the new product in Algolia.
    await indexProducts([newProduct]);
    res.status(201).json({ newProduct, searchIndexed: true });
  } catch (err) {
    console.warn("Could not index the new product to Algolia:", err);
    res.status(201).json({ newProduct, searchIndexed: false });
  }
});

/* --- UPDATE: PUT /api/admin/products/:sku --- */
adminRouter.put("/products/:sku", async (req, res) => {
  const updatedProduct: Product = {
    sku: req.params.sku, // e.g. LEV-1009, the product we created above
    name: "Vita strumpor - updated",
    price: 39, // new price
    description: "Mjuka strumpor i ekologisk bomull.",
    image: "Image",
  };

  // Same order as for create:
  // 1. Update first in DB
  // 2. If all is well, update the product in Algolia.
  // It's the SAME call as for create: saveObjects is an upsert on objectID,
  // so the same sku replaces the old record instead of creating a new one.

  try {
    await indexProducts([updatedProduct]);
    res.json({ updatedProduct, searchIndexed: true });
  } catch (err) {
    console.warn("Could not index the updated product to Algolia:", err);
    res.json({ updatedProduct, searchIndexed: false });
  }
});

/* --- DELETE: DELETE /api/admin/products/:sku --- */
adminRouter.delete("/products/:sku", async (req, res) => {
  const deletedSku = req.params.sku; // e.g. LEV-1009

  // Same order as for create and update:
  // 1. Delete first in DB
  // 2. If all is well, remove the product from Algolia.
  // Otherwise the search still finds a product that no longer exists.
});

// Think about: what else changes a product? An order that lowers the stock?
// Then it also has to update Algolia – otherwise the search shows the wrong stock.

const MAX_SIZE = 4 * 1024 * 1024; // 4 MB, Matches the Supabase Storage Bucket limit
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

// multer reads multipart/form-data, the format a browser uses to send files.
// limits the fileSize to 4MB
const upload = multer({
  limits: { fileSize: MAX_SIZE },
});

// Receives ONE file in the field "image". If multer can't read it, we answer 400 with a clear message.
// 1.1 Validate file
function recieveImage(req: Request, res: Response, next: NextFunction) {
  upload.single("image")(req, res, function (err) {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      // A Multer error occurred when uploading, in this example, max FILE_SIZE exeeded
      res.status(400).json({
        error: `The image is too large. Max ${MAX_SIZE / (1024 * 1024)} MB.`,
      });
      return;
    } else if (err) {
      // An unknown error occurred when uploading.
      res.status(400).json({
        error: `Could not read the File. Send ONE image file in the field "image`,
      });
      return;
    }

    next();
  });
}

/* --- UPLOAD: POST /api/admin/products/:sku/image  (multipart/form-data, field "image") → { url } --- */
adminRouter.post(
  "/products/:sku/image",
  authenticateJWT,
  recieveImage,
  async (req, res) => {
    // 1.2 Validate sku and file
    const sku = typeof req.params.sku === "string" ? req.params.sku : "";
    if (!sku) {
      res.status(400).json({ error: "Invalid sku" });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        error: `Missing image. Send the image file in the field "image"`,
      });
      return;
    }

    if (!ALLOWED_TYPES.includes(req.file.mimetype)) {
      res.status(400).json({ error: `The file is not a JPEG nor PNG image` });
      return;
    }

    console.log(
      "\n[ADMIN] Image for",
      sku,
      "–",
      req.file.originalname,
      req.file.mimetype,
      req.file.size,
      "bytes",
    );

    // 2. In your shop: fetch the product from the DB by sku – it must exist, and we need its OLD image:
    //    SELECT image_path FROM products WHERE sku = $1      → no row: answer 404
    //    In the walkthrough there is no database, so every valid sku is accepted and there is no old image.
    // const product
    // const oldImagePath = product.image_path

    const [rows] = await pool.execute(
      "SELECT image_path FROM products WHERE sku = ?",
      [sku],
    );
    const found = rows as { image_path: string | null }[];

    if (found.length === 0) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const oldImagePath = found[0].image_path;

    // 3. Upload to Supabase Storage
    let image;
    try {
      image = await uploadProductImage(sku, {
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
      });
    } catch (err) {
      console.error(err);
      // The product keeps its old image – nothing has been changed in the DB yet.
      res.status(502).json({
        error: "The image service is not responding. Try again later.",
      });
      return;
    }

    // 4. In your shop: save the new image on the product. Save BOTH the path and the URL:
    //    the URL to show the image, the path to delete the file later.
    //      UPDATE products SET image_path = $1, image_url = $2 WHERE sku = $3

    try {
      await pool.execute(
        "UPDATE products SET image_path = ?, image_url = ? WHERE sku = ?",
        [image.path, image.url, sku],
      );
    } catch (err) {
      console.error(err);
      // Databasen misslyckades: ta bort den nya filen igen, så blir inget kvar i bucketen
      try {
        await removeProductImage(image.path);
      } catch (cleanupError) {
        console.warn("Could not remove the unused image:", cleanupError);
      }
      res.status(500).json({ error: "Could not save the image" });
      return;
    }

    if (oldImagePath) {
      try {
        await removeProductImage(oldImagePath);
      } catch (err) {
        console.warn("Could not remove the old image:", err);
      }
    }

    // 5. Delete the old image from Supabase Storage – only NOW, after the new one is uploaded AND saved.
    //    In the other order, a failed upload would leave the product without any image.
    //    oldImagePath is the image_path fetched in step 2, before the UPDATE in step 4 overwrote it.
    //      if (oldImagePath) await removeProductImage(oldImagePath)
    //    In the walkthrough there is no old image (no database, see step 2), so this line is a comment.
    //    If the removal fails: log it and still answer 201. The product shows the new image –
    //    the old file is only left over in the bucket (it can be cleaned up later).

    res.status(201).json({ path: image.path, url: image.url });
  },
);

/* --- DELETE: DELETE /api/admin/products/:sku/image → { deleted } --- */
// Removes the product's image without replacing it.
adminRouter.delete("/products/:sku/image", async (req, res) => {
  // 1. In your shop: fetch the image's path from the DB by sku – NEVER from the request,
  //    so an admin can't delete any file in the bucket by sending another path.
  //      SELECT image_path FROM products WHERE sku = $1
  //    No row → 404 "No such product". image_path is NULL → 404 "The product has no image".
  //
  //    In the walkthrough there is no database, so React sends the path in the query string:
  //    ?path=products/LEV-1001/...png
  const path = (req.query.path ?? "") as string;

  // 2. Delete the file from Supabase Storage
  try {
    await removeProductImage(path);
  } catch (err) {
    console.error(err);
    res
      .status(502)
      .json({ error: "The image service is not responding. Try again later." });
    return;
  }

  // 3. In your shop: remove the image from the product as well:
  //      UPDATE products SET image_path = NULL, image_url = NULL WHERE sku = $1
  res.json({ deleted: path });
});

export default adminRouter;

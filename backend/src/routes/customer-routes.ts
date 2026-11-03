import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { pool } from "../mysql-database";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authenticateJWT } from "../authentication/authenticateJWT";
import { Customer } from "../types/Customer";
import { mergeGuestCart } from "../services/cart-service";

const customerRouter = Router();

const SALT_ROUNDS = 10;

//PREPARED INPUT RULES TO FORM
const Username = z
  .string()
  .trim()
  .min(2, "Username must be at least 2 characters")
  .max(100);
const Email = z.string().trim().toLowerCase().email("Invalid email").max(200);
const Password = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(100);

//ZOD OBJECT FOR REGISTER
const RegisterRequest = z.object({
  username: Username,
  email: Email,
  password: Password,
});

const UpdateRequest = z
  .object({
    username: Username.optional(),
    email: Email.optional(),
    password: Password.optional(),
  })
  .refine((body) => Object.values(body).some((v) => v !== undefined), {
    message: "Nothing to update",
  });

function signToken(customer: Customer) {
  return jwt.sign(
    {
      userId: customer.id,
      email: customer.email,
      role: customer.is_admin === 1 ? "admin" : "customer",
    },
    process.env.JWT_SECRET!,
    { expiresIn: "2h" },
  );
}

function isDuplicateEntry(error: unknown) {
  return (error as { code?: string })?.code === "ER_DUP_ENTRY";
}

// Checks that user is a customer.
function requireCustomer(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "customer") {
    return res.status(403).json({ message: "Only customers can do this" });
  }
  next();
}

// POST NEW USER
customerRouter.post("/register", async (req, res) => {
  const body = RegisterRequest.safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({ message: body.error.issues[0].message });
  }

  try {
    const { username, email, password } = body.data;
    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await pool.execute(
      `INSERT INTO users (username, email, password, is_admin) VALUES (?, ?, ?, 0)`,
      [username, email, hash],
    );

    const customer: Customer = {
      id: (result as { insertId: number }).insertId,
      email,
      is_admin: 0,
    };

    // GIVE THE NEW ACCOUNT THE CART THE CUSTOMER USED AS A GUEST
    await mergeGuestCart(customer.id, req.header("X-Cart-Token"));

    res.status(201).json({
      message: "Konto skapat",
      user: customer,
      token: signToken(customer),
    });
  } catch (error) {
    if (isDuplicateEntry(error)) {
      return res.status(409).json({ message: "Email is already registered" });
    }
    console.error(error);
    res.status(500).json({ message: "Kunde inte skapa konto" });
  }
});

//LOGIN
customerRouter.post("/login", async (req, res) => {
  console.log("login hit");
  try {
    const { email, password } = req.body;

    const [rows] = await pool.execute(
      `SELECT id, email, password, is_admin
    FROM users
    WHERE email = ? AND is_admin = 0`,
      [email],
    );

    const customers = rows as {
      id: number;
      email: string;
      password: string | null;
      is_admin: number;
    }[];
    const customer = customers[0];
    console.log("CUSTOMER:", customer);

    if (!customer?.password || typeof password !== "string") {
      return res.status(401).json({ message: "Fel email eller lösenord" });
    }

    // Accounts created before hashing was added still have normal password. checks here.
    const isHashed = customer.password.startsWith("$2");
    const passwordMatches = isHashed
      ? await bcrypt.compare(password, customer.password)
      : password === customer.password;

    if (!passwordMatches) {
      return res.status(401).json({ message: "Fel email eller lösenord" });
    }

    // If no hash on old account then update
    if (!isHashed) {
      await pool.execute(`UPDATE users SET password = ? WHERE id = ?`, [
        await bcrypt.hash(password, SALT_ROUNDS),
        customer.id,
      ]);
    }

    const user = {
      id: customer.id,
      email: customer.email,
      is_admin: customer.is_admin,
    };
    console.log(user);

    // MOVE THE GUEST CART (IF ANY) TO THE USER
    await mergeGuestCart(customer.id, req.header("X-Cart-Token"));

    res.json({ message: "Inloggning lyckades", user, token: signToken(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Kunde inte logga in" });
  }
});

/* --- GET /api/customer/me → logged-in customer's profile --- */
customerRouter.get(
  "/me",
  authenticateJWT,
  requireCustomer,
  async (req, res) => {
    try {
      const [rows] = await pool.execute(
        `SELECT id, username, email FROM users WHERE id = ? AND is_admin = false`,
        [req.user!.userId],
      );

      const customer = (rows as Customer[])[0];
      if (!customer) {
        return res.status(404).json({ message: "Account not found" });
      }

      res.json(customer);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Kunde inte hämta konto" });
    }
  },
);

/* --- PUT /api/customer/me  { username?, email?, password? } → updated profile + new token --- */
customerRouter.put(
  "/me",
  authenticateJWT,
  requireCustomer,
  async (req, res) => {
    const body = UpdateRequest.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ message: body.error.issues[0].message });
    }

    try {
      const { username, email, password } = body.data;
      const fields: string[] = [];
      const values: string[] = [];

      if (username !== undefined) {
        fields.push("username = ?");
        values.push(username);
      }
      if (email !== undefined) {
        fields.push("email = ?");
        values.push(email);
      }
      if (password !== undefined) {
        fields.push("password = ?");
        values.push(await bcrypt.hash(password, SALT_ROUNDS));
      }

      const [result] = await pool.execute(
        `UPDATE users SET ${fields.join(", ")} WHERE id = ? AND is_admin = false`,
        [...values, req.user!.userId],
      );

      if ((result as { affectedRows: number }).affectedRows === 0) {
        return res.status(404).json({ message: "Account not found" });
      }

      const [rows] = await pool.execute(
        `SELECT id, username, email FROM users WHERE id = ?`,
        [req.user!.userId],
      );
      const customer = (rows as Customer[])[0];

      // Email lives in the token, so hand out a fresh one
      res.json({
        message: "Konto uppdaterat",
        user: customer,
        token: signToken(customer),
      });
    } catch (error) {
      if (isDuplicateEntry(error)) {
        return res.status(409).json({ message: "Email is already registered" });
      }
      console.error(error);
      res.status(500).json({ message: "Kunde inte uppdatera konto" });
    }
  },
);

/* --- DELETE /api/customer/me → deletes account, or anonymizes it if it has orders --- */
customerRouter.delete(
  "/me",
  authenticateJWT,
  requireCustomer,
  async (req, res) => {
    const userId = req.user!.userId;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [orderRows] = await connection.execute(
        `SELECT COUNT(*) AS count FROM orders WHERE user_id = ?`,
        [userId],
      );
      const hasOrders = (orderRows as { count: number }[])[0].count > 0;

      let affectedRows: number;

      if (hasOrders) {
        // Orders reference the user, so keep the row for order history but remove
        // personal data and make the account impossible to log in to
        await connection.execute(`DELETE FROM carts WHERE user_id = ?`, [
          userId,
        ]);
        const [result] = await connection.execute(
          `UPDATE users
         SET username = 'Deleted user', email = ?, password = NULL
         WHERE id = ? AND is_admin = false`,
          [`deleted-${userId}@deleted.invalid`, userId],
        );
        affectedRows = (result as { affectedRows: number }).affectedRows;
      } else {
        // Carts are removed by ON DELETE CASCADE
        const [result] = await connection.execute(
          `DELETE FROM users WHERE id = ? AND is_admin = false`,
          [userId],
        );
        affectedRows = (result as { affectedRows: number }).affectedRows;
      }

      if (affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ message: "Account not found" });
      }

      await connection.commit();
      res.json({ message: "Konto raderat" });
    } catch (error) {
      await connection.rollback();
      console.error(error);
      res.status(500).json({ message: "Kunde inte radera konto" });
    } finally {
      connection.release();
    }
  },
);

export default customerRouter;

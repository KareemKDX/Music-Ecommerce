import { Router } from "express";
import { pool } from "../mysql-database";
import jwt from "jsonwebtoken";

const customerRouter = Router();

customerRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.execute(
      `SELECT id, email FROM users WHERE email = ? AND password = ? AND is_Admin = false`,
      [email, password],
    );

    const customers = rows as { id: number; email: string }[];

    if (customers.length === 0) {
      return res.status(401).json({ message: "Fel email eller lösenord" });
    }

    const customer = customers[0];

    const token = jwt.sign(
      { userId: customer.id, email: customer.email, role: "customer" },
      process.env.JWT_SECRET!,
      { expiresIn: "2h" },
    );

    res.json({ message: "Inloggning lyckades", user: customer, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Kunde inte logga in" });
  }
});

export default customerRouter;

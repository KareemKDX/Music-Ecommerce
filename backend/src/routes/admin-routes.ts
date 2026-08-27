import { Router } from "express";
import { pool } from "../mysql-database";
import jwt from "jsonwebtoken";

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

    //IF NO FOUND
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

export default adminRouter;

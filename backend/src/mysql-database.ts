import mysql from "mysql2/promise";
import "dotenv/config";

export const pool = mysql.createPool({
  host: process.env.MYSQL_DATABASE_HOST,
  port: parseInt(process.env.MYSQL_DATABASE_PORT!),
  database: "defaultdb",
  user: process.env.MYSQL_DATABASE_USER,
  password: process.env.MYSQL_DATABASE_PASSWORD,
});

console.log("Pool created");

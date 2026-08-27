# 🎵 E-SHOP — Music Equipment Store

A full-stack e-commerce web application built as a school project.
The application allows customers to browse products, manage their shopping cart and place orders, while administrators can manage products and orders through an admin dashboard.

## 🚀 Live Demo

**Frontend:** https://eshop-frontend-mauve.vercel.app/

**Backend:** https://eshop-backend-gules.vercel.app/

> The application uses Vercel for deployment and Aiven for the MySQL database.

---

## 🛠️ Tech Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Axios
- CSS

### Backend

- Node.js
- Express
- TypeScript
- JWT authentication
- MySQL
- mysql2
- CORS

### Database & Deployment

- MySQL hosted on Aiven
- Vercel for frontend and backend deployment
- Git & GitHub

---

## ✨ Features

### 👤 Customer

- Browse available products
- View individual product details
- Add products to the shopping cart
- View and manage cart contents
- Place orders
- Customer authentication
- JWT-based authentication

### 🔐 Administrator

- Secure admin login
- JWT authentication
- Admin authorization
- Create products
- Edit products
- Delete products
- View customer orders
- Update order status

---

## 🏗️ Project Structure

```text
project/
├── backend/
│   ├── src/
│   │   ├── authentication/
│   │   ├── routes/
│   │   ├── types/
│   │   ├── axios/
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── context/
    │   ├── pages/
    │   ├── types/
    │   ├── utils/
    │   └── App.tsx
    ├── public/
    ├── package.json
    └── vite.config.ts
```

---

## 🔑 Authentication

The application uses **JSON Web Tokens (JWT)** for authentication.

After a successful login, the backend creates a JWT containing information about the authenticated user. The frontend stores the token in `localStorage`.

Axios automatically adds the token to requests through an interceptor:

```text
Authorization: Bearer <token>
```

Protected backend endpoints verify the token before allowing access.

Administrators are additionally checked through the user's admin status, ensuring that authenticated customers cannot access administrator functionality.

---

## 🛒 Shopping Cart & Orders

Customers can add products to their cart and adjust quantities before checking out.

The backend handles the order creation process:

```text
Customer
   ↓
Shopping Cart
   ↓
Checkout
   ↓
Create Order
   ↓
Order Items
   ↓
Database
```

Order information is stored separately from the current product data, allowing previous orders to remain available even when products are later modified.

---

## 🗄️ Database

The application uses MySQL with tables for the main e-commerce entities:

- `users`
- `products`
- `carts`
- `cart_items`
- `orders`
- `order_items`

The backend uses a MySQL connection pool through `mysql2/promise` to efficiently handle database connections.

---

## 💻 Running the Project Locally

### 1. Clone the repository

```bash
git clone <repository-url>
cd <project-folder>
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
```

### 3. Install backend dependencies

```bash
cd ../backend
npm install
```

### 4. Environment variables

Create a `.env` file in the backend with the required database and JWT configuration:

```env
MYSQL_DATABASE_HOST=
MYSQL_DATABASE_PORT=
MYSQL_DATABASE_USER=
MYSQL_DATABASE_PASSWORD=
JWT_SECRET=
```

### 5. Start the backend

```bash
npm run dev
```

### 6. Start the frontend

From the frontend directory:

```bash
npm run dev
```

The frontend and backend can then be accessed through their respective local development URLs.

---

## 📡 Main API Endpoints

### Products

| Method | Endpoint            | Description      |
| ------ | ------------------- | ---------------- |
| GET    | `/api/products`     | Get all products |
| GET    | `/api/products/:id` | Get one product  |
| POST   | `/api/products`     | Create product   |
| PUT    | `/api/products/:id` | Update product   |
| DELETE | `/api/products/:id` | Delete product   |

### Authentication

| Method | Endpoint           | Description                |
| ------ | ------------------ | -------------------------- |
| POST   | `/api/admin/login` | Authenticate administrator |

### Cart

| Method | Endpoint        | Description             |
| ------ | --------------- | ----------------------- |
| GET    | `/api/cart`     | Get current user's cart |
| POST   | `/api/cart`     | Add product to cart     |
| DELETE | `/api/cart/:id` | Remove cart item        |

### Orders

| Method | Endpoint                | Description                     |
| ------ | ----------------------- | ------------------------------- |
| GET    | `/api/orders`           | Get orders                      |
| POST   | `/api/orders`           | Create an order                 |
| GET    | `/api/orders/:id/items` | Get items belonging to an order |

---

## 🎨 Design

The application uses a music-inspired visual theme with a dark interface and gold accent colors.

The goal was to create a simple but modern storefront while keeping the interface easy to navigate for both customers and administrators.

---

## 📚 Project Purpose

This project was created as part of a **System Development** school assignment.

The main focus was to practice building a complete full-stack application and connecting the different parts of the system:

```text
React + TypeScript
        ↓
      Axios
        ↓
Express + TypeScript
        ↓
       MySQL
        ↓
      Aiven
```

The project also provided practical experience with authentication, REST APIs, database relationships, CRUD operations, Git/GitHub and deployment with Vercel.

---

## 👨‍💻 Authors

**Kareem KDX**

School project — Systemutveckling 1

# Spexah Instruments — Music Equipment Store

A full-stack e-commerce web application built as a school project.
The application allows customers to browse products, manage their shopping cart and place orders, while administrators can manage products and orders through an admin dashboard.

## Live Demo

**Frontend:** https://music-ecommerce-frontend.vercel.app/

**Backend:** https://music-ecommerce-two.vercel.app/

### Test-accounts

Admin - Username: Admin@gmail.com Password: Admin@gmail.com
Customer - Username: customer@gmailtest.com Password: Customer123

### Env

- Both /frontend and /backend have their own .env-example files. Copy them into
  your own .env. Add all your own keys there for every corresponding task and follow the manuals provided there.

> The application uses Vercel for deployment and Aiven for the MySQL database.

## Tech Stack

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
- Vercel for frontend and backend deployment (separate projects)
- GitHub

## 3rd-party Integrations

### Postnord Shipping - Adapter and service created with help of AI.

Manual control and documentation read before, so that AI input & code matches PostNords own documentation and is correct by giving providing Claude all API-endpoints URL:s and Request bodies. Manually checked and verified after implementation.

- PROMPT (translated from swedish to english)

- **Service points:** the customer enters a postal code and sees the nearest PostNord service points, fetched via our server. The server checks that the chosen service point is among those returned for that postal code.
- **Delivery time:** checkout shows the estimated delivery from PostNord, from the shop's postal code to the customer's (e.g. "Estimated delivery: Tuesday 27/10").
- **Shipping prices:** our own price list, two options (service point and home delivery), a fixed price each, and free shipping above an order value threshold. PostNord has no price API for Sweden.
- **Server-side price:** the shipping price is calculated on the server and shown before payment. React never sends a price.
- **Saved on the order:** shipping method, shipping price and service point. The shipping cost is its own line item in the Stripe Checkout Session.
- **Validation:** all PostNord responses are validated with Zod before use.
- **Common requirements:** calls go through the backend, one adapter per service, keys in `.env`, timeouts and error handling.

Step 2 – Endpoints to use

**Delivery time and date** (transit time, address to address):

```
GET https://api2.postnord.com/rest/transport/v2/transittime/addresstoaddress
  ?apikey=<POSTNORD_API_KEY>
  &startTime=2026-10-28T08:00
  &originPostalCode=17173
  &originCountryCode=SE
  &destinationPostalCode=17173
  &destinationCountryCode=SE
  &showInternalAdditionalServiceCode=false
```

**Nearest service points:**

```
GET https://atapi2.postnord.com/rest/businesslocation/v5/servicepoints/nearest/byaddress
  ?apikey=<POSTNORD_API_KEY>
  &returnType=json
  &countryCode=SE
  &postalCode=11152
  &numberOfServicePoints=5
```

Step 3 – Environment

`POSTNORD_API_KEY` and `SHOP_POSTAL_CODE` are set in `backend/.env` and in the backend project on Vercel. The key lives only on the server. The orders table already has the new columns for shipping method, shipping price and service point, so only backend and frontend code is needed.

Prompt to the AI (do not code yet)

> Don't write code yet. First read the existing adapters in `backend/src/integrations/` and the checkout route, then give me a plan. Use the two endpoints in Step 2 and apply them to the requirements in Step 1.
> Use `process.env.POSTNORD_API_KEY` and `process.env.SHOP_POSTAL_CODE`. Do not open or read `.env`.
> For each endpoint, tell me which parts of the request and response you are sure about and which you are guessing, so I can verify them against PostNord's documentation.

### Currency selector (Frankfurter)

`currency-adapter.ts` fetches exchange rates from Frankfurter through `fetchJson` (timeout and error handling) and validates them with Zod, including positive rates. React shows prices in SEK, EUR or USD. If the rates can't be fetched, prices fall back to SEK and the customer sees a short message.

### Search (Algolia)

`search-adapter.ts` indexes products with the SKU as `objectID` and answers searches in the shop's own format. `GET /api/search` supports free text and pagination, validates parameters with Zod (invalid values give 400, with a maximum page size) and tolerates typos. The database is saved first, and Algolia is updated afterwards when products are imported, created, changed or deleted. If Algolia is down, the product is still saved and the admin is told that the search index is out of date. The admin key stays on the server.

### Payment (Stripe)

`payment-adapter.ts` creates a hosted Stripe Checkout Session. React only sends the shipping address, and the server reads the cart and the prices from the database and checks the stock. The order is saved as unpaid before the customer is sent to Stripe, and its id follows the payment as `client_reference_id`. The webhook verifies Stripe's signature and marks the order as paid only once. It lowers the stock in the same database transaction, and `checkout.session.expired` cancels the order. The confirmation page only shows the order's status and never changes it.

Image storage (Supabase Storage)

`storage-adapter.ts` uploads product images to a public Supabase bucket

## Reflection

### 1. Integration model and why

Product data import: File (CSV and XML).
The supplier publishes an export file, so we fetch it and handle encoding, decimal commas and structure ourselves.

Search (Algolia):
REST through an SDK. We push products in after saving them to the database, and each search is one request and one answer.

Payment (Stripe): Redirect & webhook. The customer pays on Stripe's page, and Stripe tells our server when the payment is done, so we never depend on the customer returning.
-Product images (Supabase):\*\* REST through an SDK, file upload. The data is a binary file, and the image is shown straight from the storage URL.

Shipping (PostNord):
REST. We ask for the nearest service points and the delivery time once the customer has entered a postal code.

### 2. Why calls go through Express and not React

Security Reasons
The API keys from our integrations must stay secret, and the server validates the files before anything is saved through our backend code. Example zod and other functions. With a express backend we can safely secure keys, read & modify data the way we want it before it reaches the client (user). We only want the client to see whats necessary.

Examples:

Search (Algolia) - Admin key can change or delete the index, so only our express server sees it. The browser only uses our own `/api/search` url.
-Payment (Stripe) - the secret key can create payments, the price is calculated from the database so it cannot be changed in the browser, and Stripe's webhook needs a server to call.
Without this a user could for example change the price directly through the frontend and that data would be sent back to our database which would be a security risk.

-

### 3. Why integrate instead of building it ourselves

Product data import: Building it ourselves would mean agreeing a data format with every supplier and keeping it in sync. We can easily fetch a huge amount of products for our page with all information needed like description, categories etc without filling it ourselves. We only create our own model that formats the supplier data into our own.

Search (Algolia): It would need a lot of code which would be time consuming. While it’s not hard to create a simple search index function, Agolia handles typos, relevans, and searches very fast which is complex.

Payment (Stripe): it would require card network agreements, PCI compliance, fraud checks and 3D Secure.

Product images (Supabase): Images can be big in size. For us to have our own images we would need a fil

Shipping (PostNord): We would need data about service points and transit times, which only the carrier has. Secondly if we would be able to get this information ourselves and wanted to code it, it would probably be very costly.

### 4. What happens when the service is down

Product data import: The import fails with an error to the admin and nothing in the database changes.
Search (Algolia): Search shows a clear message. Products are still saved in the database and the admin is told that the search index is out of date.
Payment (Stripe): Customer gets a message that the order is unpaid and it doesnt update.. .nothing is marked as paid.
Product images (Supabase): Admin gets a message and the product keeps its old image.
Since products have two image_url rows in database.
Shipping (PostNord): Customer gets a clear message and the order is not created without a valid shipping choice.

### 5. Risks of depending on a service

Payment (Stripe): If Stripe is down, our customers will not be able to purchase any items which would be very costly, and in worst case could also ruin our reputation when stuff doesnt work. GDPR is very strict with how we are allowed to handle personal data. We would need to trust Stripe that they store our customer data safely and that it is not hosted anywhere outside of EU.

## Features

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

## Project Structure

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

## Database

The application uses MySQL with tables for the main e-commerce entities:

- `users`
- `products`
- `carts`
- `cart_items`
- `orders`
- `order_items`

The backend uses a MySQL connection pool through `mysql2/promise` to efficiently handle database connections.

---

## Running the Project Locally

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

### 5. Start the project from

From root folder:

```bash
npm run dev
```

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

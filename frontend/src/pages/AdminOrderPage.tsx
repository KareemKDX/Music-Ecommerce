import { Link } from "react-router-dom";
import Orders from "../components/Orders";

import "../css/AdminPage.css";
import "../css/Products.css";

function AdminOrderPage() {
  return (
    <div className="admin-page">
      <div className="admin-header-content">
        <div>
          <h1>Admin Dashboard</h1>

          <p className="admin-subtitle">
            Overview and status of customer orders
          </p>
          <Link to="/admin" className="back-link">
            <span className="back-link-arrow">←</span>
            Back to dashboard
          </Link>
        </div>
      </div>
      <div className="orders-content-area">
        <Orders />
      </div>
    </div>
  );
}

export default AdminOrderPage;

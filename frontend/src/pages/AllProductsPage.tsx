import Products from "../components/Products";
import "../css/HomePage.css";

function HomePage() {
  return (
    <div className="homepage-container">
      <div className="homepage-header-content-box">
        <div className="homepage-box">
          <h1>MUSIC CREATION AT IT'S FINEST</h1>
          <br></br>
          <p>Samples. Instruments. Equipment. We got it all.</p>
        </div>
        <div className="homepage-box">
          <img src="/Images/musicplate.jpg" alt="Music plate" />
        </div>
      </div>

      <div className="products-header-info-area">
        <div className="products-header-info-left">
          <p className="products-subtitle"></p>
        </div>

        <div className="products-header-info-right">
          <ul className="products-perks">
            <li>Secure payment with Stripe</li>
            <li>Prices in SEK, EUR and USD</li>
            <li>Fast delivery</li>
          </ul>
        </div>
      </div>

      <div>
        <Products />
      </div>
    </div>
  );
}

export default HomePage;

import FeaturedProducts from "../components/FeaturedProducts";
import { useNavigate } from "react-router-dom";
import "../css/HomePage.css";

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home">
      {/* HERO */}
      <section className="home-hero">
        <div className="home-hero-text">
          <p className="home-label">Spexah music store</p>
          <h1>
            Music creation <span>at its finest.</span>
          </h1>
          <p className="home-hero-subtitle">
            Samples, instruments and studio gear. Everything you need to make
            your next track.
          </p>
          <div className="home-hero-buttons">
            <button
              className="home-button-gold"
              onClick={() => navigate("/products")}
            >
              Shop now
            </button>
            <button
              className="home-button-outline"
              onClick={() => navigate("/about")}
            >
              About us
            </button>
          </div>
        </div>

        <div className="home-hero-image">
          <img src="/Images/musicplate.jpg" alt="Music plate" />
        </div>
      </section>

      {/* PERKS */}
      <section className="home-perks">
        <div className="home-perk">
          <h4>Secure payment</h4>
          <p>Checkout with Stripe</p>
        </div>
        <div className="home-perk">
          <h4>Your currency</h4>
          <p>Prices in SEK, EUR and USD</p>
        </div>
        <div className="home-perk">
          <h4>Fast delivery</h4>
          <p>Shipped within a few days</p>
        </div>
      </section>

      {/* FEATURED */}
      <FeaturedProducts />

      {/* LEVELS */}
      <section className="home-levels">
        <div className="home-levels-image">
          <img src="/Images/homebg.webp" alt="Music studio" />
        </div>
        <div className="home-levels-text">
          <p className="home-label">For every level</p>
          <h2>Beginner, intermediate or professional.</h2>
          <p>
            Whether you are making your first beat or mixing your next
            release, we have the gear that suits your needs.
          </p>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="home-categories">
        <div className="home-category">
          <h3>Samples</h3>
          <p>Drum kits, loops and one-shots.</p>
        </div>
        <div className="home-category">
          <h3>Instruments</h3>
          <p>Keys, guitars and synths.</p>
        </div>
        <div className="home-category">
          <h3>Equipment</h3>
          <p>Headphones, mics and studio gear.</p>
        </div>
      </section>
    </div>
  );
}

export default HomePage;

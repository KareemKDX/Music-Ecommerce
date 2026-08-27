import Products from "../components/Products";
import "../css/HomePage.css";

function HomePage() {
  return (
    <div className="homepage-container">
      <div className="homepage-header-content-box">
        <div className="homepage-box">
          <h1>MUSIC CREATION AT IT'S FINEST</h1>
          <br></br>
          <p>Samples. Instruments. Producer. We got it all.</p>
        </div>
        <div className="homepage-box">
          <img src="/Images/musicplate.jpg" alt="Music plate" />
        </div>
      </div>
      <div>
        <Products />
      </div>
    </div>
  );
}

export default HomePage;

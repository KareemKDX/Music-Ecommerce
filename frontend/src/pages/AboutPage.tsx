import "../css/AboutPage.css";

const categories = [
  {
    title: "Samples",
    text: "Royalty-free sample packs, loops and one-shots that spark ideas and get your tracks moving faster.",
  },
  {
    title: "Instruments",
    text: "Guitars, keys, drums and more, chosen for sound and playability so you can focus on performing.",
  },
  {
    title: "Electronics",
    text: "Audio interfaces, synths, controllers and studio gear that capture your sound with clarity.",
  },
  {
    title: "Software",
    text: "Plugins, DAWs and virtual instruments to record, mix and produce from anywhere.",
  },
];

const promises = [
  "Hand-picked products tested by musicians",
  "Secure payment with Stripe",
  "Prices in SEK, EUR and USD",
  "Fast delivery with PostNord",
];

function AboutPage() {
  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="about-hero-text">
          <span className="about-eyebrow">About Spexah</span>
          <h1>
            Built by musicians, <span>for musicians.</span>
          </h1>
          <p>
            We are a small team of musicians and producers building the store we
            always wanted: one place for everything you need to create music.
          </p>
          <div className="about-stats">
            <div>
              <strong>4</strong>
              <span>Categories</span>
            </div>
            <div>
              <strong>3</strong>
              <span>Currencies</span>
            </div>
            <div>
              <strong>100%</strong>
              <span>Passion</span>
            </div>
          </div>
        </div>
        <img
          className="about-hero-image"
          src="/Images/about3.jpg"
          alt="Producer in a studio"
        />
      </section>

      <section className="about-offer">
        <span className="about-eyebrow">What we offer</span>
        <h2>Everything for your sound</h2>
        <div className="about-grid">
          {categories.map((category, index) => (
            <div className="about-card" key={category.title}>
              <span className="about-card-number">0{index + 1}</span>
              <h3>{category.title}</h3>
              <p>{category.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="about-why">
        <div className="about-images">
          <img src="/Images/about1.jpg" alt="Synthesizer in a studio" />
          <img src="/Images/about2.jpg" alt="Mixing desk faders" />
        </div>
        <div>
          <span className="about-eyebrow">Why choose us</span>
          <h2>Gear you can trust</h2>
          <ul className="about-promises">
            {promises.map((promise) => (
              <li key={promise}>{promise}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

export default AboutPage;

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
        <h1>About Spexah</h1>
        <p>
          We are a small team of musicians and producers building the store we
          always wanted: one place for everything you need to create music.
        </p>
      </section>

      <section className="about-section">
        <h2>What we offer</h2>
        <div className="about-grid">
          {categories.map((category) => (
            <div className="about-card" key={category.title}>
              <h3>{category.title}</h3>
              <p>{category.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="about-section">
        <h2>Why choose us</h2>
        <ul className="about-promises">
          {promises.map((promise) => (
            <li key={promise}>{promise}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default AboutPage;

import "../css/AccountPage.css";

const upcomingFeatures = [
  {
    icon: "📦",
    title: "Order history",
    text: "Track deliveries and see everything you have bought.",
  },
  {
    icon: "📍",
    title: "Saved addresses",
    text: "Check out faster with your shipping details stored.",
  },
  {
    icon: "⬇️",
    title: "Downloads",
    text: "Access your samples and software whenever you need them.",
  },
];

function AccountPage() {
  return (
    <div className="account-page">
      <div className="account-header">
        <h1>My account</h1>
        <span className="account-badge">Coming soon</span>
        <p>
          We are building a place for your orders, details and downloads. Stay
          tuned!
        </p>
      </div>

      {/* Preview only: inert makes everything inside non-interactive */}
      <div className="account-container" inert>
        <section className="account-card account-profile">
          <div className="account-avatar">S</div>
          <h2>Your profile</h2>

          <div className="account-step">
            <span>1</span>Personal details
          </div>
          <input type="text" placeholder="Full name" disabled />
          <input type="email" placeholder="Email" disabled />

          <div className="account-step">
            <span>2</span>Shipping address
          </div>
          <input type="text" placeholder="Street address" disabled />
          <div className="account-row">
            <input type="text" placeholder="Postal code" disabled />
            <input type="text" placeholder="City" disabled />
          </div>

          <button className="account-save-button" disabled>
            Save changes
          </button>
        </section>

        <section className="account-card account-features">
          <h2>What's coming</h2>
          {upcomingFeatures.map((feature) => (
            <div className="account-feature" key={feature.title}>
              <div className="account-feature-icon">{feature.icon}</div>
              <div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

export default AccountPage;

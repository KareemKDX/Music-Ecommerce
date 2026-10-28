import { useContext, useEffect, useState } from "react";
import CartContext from "../context/CartContext";
import "../css/OrderPage.css";

import api from "../axios/api";
import { formatDeliveryDate } from "../utils/formatDeliveryDate";

type ShippingMethod = "service_point" | "home";

type ServicePoint = {
  id: string;
  name: string;
  address: string;
};

// Everything about the price comes from the server – React only shows it
type ShippingQuote = {
  subtotal: number;
  shippingPrice: number;
  total: number;
  freeShippingFrom: number;
  estimatedDelivery: string | null;
};

function OrderPage() {
  const context = useContext(CartContext);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");

  const [postalCode, setPostalCode] = useState("");
  const [shippingMethod, setShippingMethod] =
    useState<ShippingMethod>("service_point");
  const [servicePointId, setServicePointId] = useState("");
  // The answers are saved with the request they belong to (key), so an old answer is never shown
  const [pointsResult, setPointsResult] = useState<{
    key: string;
    points: ServicePoint[];
    error: string;
  } | null>(null);
  const [quoteResult, setQuoteResult] = useState<{
    key: string;
    quote: ShippingQuote | null;
    error: string;
  } | null>(null);

  const [checkoutError, setCheckoutError] = useState("");
  const [paying, setPaying] = useState(false);

  if (!context) {
    throw new Error("Context error in OrderPage.tsx");
  }

  const { cart } = context;

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  // "111 52" → "11152". Empty until the customer has typed 5 digits.
  const cleanedPostalCode = postalCode.replace(/\s/g, "");
  const validPostalCode = /^\d{5}$/.test(cleanedPostalCode)
    ? cleanedPostalCode
    : "";

  const wantsServicePoint = shippingMethod === "service_point";
  const quoteKey = validPostalCode
    ? validPostalCode + "-" + shippingMethod
    : "";

  // FETCH SHIPPING PRICE + ESTIMATED DELIVERY FROM OUR SERVER
  // Works for home delivery even if PostNord's service points are down.
  useEffect(() => {
    if (!validPostalCode) {
      return;
    }

    let cancelled = false;
    api
      .post("/shipping/quote", {
        method: shippingMethod,
        postalCode: validPostalCode,
      })
      .then((response) => {
        if (!cancelled) {
          setQuoteResult({ key: quoteKey, quote: response.data, error: "" });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setQuoteResult({
            key: quoteKey,
            quote: null,
            error:
              error.response?.data?.error ?? "Could not calculate shipping.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [validPostalCode, shippingMethod, quoteKey, cart]);

  // FETCH SERVICE POINTS – only when the customer wants a service point
  useEffect(() => {
    if (!validPostalCode || !wantsServicePoint) {
      return;
    }

    let cancelled = false;
    api
      .get("/shipping/service-points", {
        params: { postalCode: validPostalCode },
      })
      .then((response) => {
        if (!cancelled) {
          setPointsResult({
            key: validPostalCode,
            points: response.data,
            error: "",
          });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setPointsResult({
            key: validPostalCode,
            points: [],
            error:
              error.response?.data?.error ??
              "Could not fetch service points. You can still choose home delivery.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [validPostalCode, wantsServicePoint]);

  // Only use answers that belong to what the customer has entered NOW
  const quote = quoteResult?.key === quoteKey ? quoteResult.quote : null;
  const currentPoints =
    wantsServicePoint &&
    validPostalCode &&
    pointsResult?.key === validPostalCode
      ? pointsResult
      : null;
  const servicePoints = currentPoints?.points ?? [];
  const searchingPoints =
    wantsServicePoint && validPostalCode !== "" && currentPoints === null;
  const shippingError =
    currentPoints?.error ||
    (quoteResult?.key === quoteKey ? quoteResult.error : "");
  // The first service point is chosen until the customer picks another one
  const selectedPointId = servicePoints.some((sp) => sp.id === servicePointId)
    ? servicePointId
    : (servicePoints[0]?.id ?? "");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setCheckoutError("");

    if (!validPostalCode) {
      setCheckoutError("Postal code must be 5 digits");
      return;
    }
    if (shippingMethod === "service_point" && !selectedPointId) {
      setCheckoutError("Choose a service point");
      return;
    }

    setPaying(true);

    try {
      // NO PRICE IS SENT – THE SERVER CALCULATES IT
      const response = await api.post("/checkout/hosted", {
        shippingAddress,
        postalCode: validPostalCode,
        shippingMethod,
        servicePointId:
          shippingMethod === "service_point" ? selectedPointId : undefined,
      });

      // SEND CUSTOMER TO STRIPE
      window.location.href = response.data.url;
    } catch (error: any) {
      const message = error.response?.data?.error;
      setCheckoutError(
        message ?? "Could not start the payment. Try again later.",
      );
      setPaying(false);
    }
  }

  // How close the customer is to free shipping (0–100)
  const freeShippingProgress = quote
    ? Math.min(100, (quote.subtotal / quote.freeShippingFrom) * 100)
    : 0;

  return (
    <div className="order-page">
      <header className="order-header">
        <h1>Checkout</h1>
        <p>🔒 Secure payment with Stripe</p>
      </header>

      <div className="order-container">
        <section className="order-summary">
          <h2>Your order</h2>

          {cart.length === 0 ? (
            <p className="order-empty">Cart is empty</p>
          ) : (
            <>
              {cart.map((item) => (
                <div className="order-item" key={item.id}>
                  <div className="order-item-thumb">
                    {item.name.charAt(0).toUpperCase()}
                    <span className="order-item-qty">{item.quantity}</span>
                  </div>

                  <div className="order-item-info">
                    <h3>{item.name}</h3>

                    <p>
                      {item.price} kr × {item.quantity}
                    </p>
                  </div>

                  <strong>{item.price * item.quantity} kr</strong>
                </div>
              ))}

              <div className="order-shipping-row">
                <span>Shipping fee:</span>
                <span>
                  {quote === null
                    ? "Ange postnummer"
                    : quote.shippingPrice === 0
                      ? "Fri frakt"
                      : quote.shippingPrice + " kr"}
                </span>
              </div>

              {quote && quote.shippingPrice > 0 && (
                <div className="order-free-shipping">
                  <p>
                    Fri frakt vid köp över {quote.freeShippingFrom} kr
                  </p>
                  <div className="free-shipping-bar">
                    <div
                      className="free-shipping-bar-fill"
                      style={{ width: freeShippingProgress + "%" }}
                    />
                  </div>
                </div>
              )}

              {quote && quote.shippingPrice === 0 && (
                <p className="order-free-shipping-unlocked">
                  🎉 You've unlocked free shipping!
                </p>
              )}

              <div className="order-total">
                <span>Total:</span>
                <strong>{quote ? quote.total : cartTotal} kr</strong>
              </div>

              {quote?.estimatedDelivery && (
                <p className="order-delivery">
                  🚚 Estimated delivery:{" "}
                  <strong>{formatDeliveryDate(quote.estimatedDelivery)}</strong>
                </p>
              )}
            </>
          )}
        </section>

        <section className="shipping-section">
          <h2>Order Information</h2>

          <form onSubmit={handleSubmit}>
            <h3 className="form-step">
              <span>1</span> Contact & address
            </h3>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              required
            />

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              required
            />

            <input
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Delivery address"
              required
            />

            <input
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="Postal number (5 digits)"
              inputMode="numeric"
              maxLength={6}
              required
            />

            <h3 className="form-step">
              <span>2</span> Delivery
            </h3>

            <fieldset className="shipping-methods">
              <legend className="visually-hidden">Delivery options</legend>
              <label>
                <input
                  type="radio"
                  name="shippingMethod"
                  checked={shippingMethod === "service_point"}
                  onChange={() => setShippingMethod("service_point")}
                />
                <span className="shipping-method-icon">📦</span>
                PostNord ombud
              </label>
              <label>
                <input
                  type="radio"
                  name="shippingMethod"
                  checked={shippingMethod === "home"}
                  onChange={() => setShippingMethod("home")}
                />
                <span className="shipping-method-icon">🏠</span>
                Home delivery
              </label>
            </fieldset>

            {shippingMethod === "service_point" && servicePoints.length > 0 && (
              <fieldset className="service-points">
                <legend>Välj ombud</legend>
                {servicePoints.map((sp) => (
                  <label key={sp.id}>
                    <input
                      type="radio"
                      name="servicePoint"
                      checked={selectedPointId === sp.id}
                      onChange={() => setServicePointId(sp.id)}
                    />
                    <span>
                      <strong>{sp.name}</strong>
                      <br />
                      {sp.address}
                    </span>
                  </label>
                ))}
              </fieldset>
            )}

            {shippingMethod === "service_point" && searchingPoints && (
              <p className="order-searching">Searching delivery...</p>
            )}

            {shippingMethod === "service_point" &&
              validPostalCode &&
              !searchingPoints &&
              !shippingError &&
              servicePoints.length === 0 && (
                <p className="error-text">
                  No delivery options found for this address.
                </p>
              )}

            {shippingError && <p className="error-text">{shippingError}</p>}
            {checkoutError && <p className="error-text">{checkoutError}</p>}

            <button
              type="submit"
              className="pay-button"
              disabled={paying || cart.length === 0 || quote === null}
            >
              {paying
                ? "Redirecting to payment..."
                : quote
                  ? `Pay ${quote.total} kr`
                  : "Pay with card"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default OrderPage;

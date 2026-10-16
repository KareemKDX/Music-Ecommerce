import { useContext } from "react";
import CurrencyContext from "../context/CurrencyContext";

function CurrencySelector() {
  const context = useContext(CurrencyContext);

  if (!context) {
    throw new Error("Hittar ej CurrencyContext i CurrencySelector");
  }

  const { chosenCurrency, setChosenCurrency, ratesError } = context;

  return (
    <div className="currency-selector">
      <select
        value={chosenCurrency}
        onChange={(e) => setChosenCurrency(e.target.value)}
      >
        <option value="KR">SEK</option>
        <option value="EUR">EUR</option>
        <option value="USD">USD</option>
      </select>
      {ratesError && (
        <p className="error-text">Exchange rates unavailable. Showing SEK.</p>
      )}
    </div>
  );
}

export default CurrencySelector;

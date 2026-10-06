import { useContext } from "react";
import CurrencyContext from "../context/CurrencyContext";

function CurrencySelector() {
  const context = useContext(CurrencyContext);

  if (!context) {
    throw new Error("Hittar ej CurrencyContext i CurrencySelector");
  }

  const { chosenCurrency, setChosenCurrency } = context;

  return (
    <div className="currency-selector">
      <label>Select currency:</label>
      <select
        value={chosenCurrency}
        onChange={(e) => setChosenCurrency(e.target.value)}
      >
        <option value="KR">SEK</option>
        <option value="EUR">EUR</option>
        <option value="USD">USD</option>
      </select>
    </div>
  );
}

export default CurrencySelector;

import { createContext, useState, useEffect } from "react";
import api from "../axios/api";

type Rates = {
  base: string;
  date: string;
  rates: Record<string, number>;
};

type CurrencyContextType = {
  chosenCurrency: string;
  setChosenCurrency: (currency: string) => void;
  rates: Rates | null;
  ratesError: boolean;
};

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [chosenCurrency, setChosenCurrency] = useState("KR");
  const [rates, setRates] = useState<Rates | null>(null);
  const [ratesError, setRatesError] = useState(false);

  useEffect(() => {
    async function loadRates() {
      try {
        const response = await api.get("/currency/rates?base=SEK");
        const data = response.data;

        setRates(data);
        setRatesError(false);
      } catch (error) {
        console.error("Could not fetch rates, showing SEK", error);
        setRates(null);
        setChosenCurrency("KR");
        setRatesError(true);
      }
    }

    loadRates();
  }, []);
  return (
    <CurrencyContext.Provider
      value={{ chosenCurrency, setChosenCurrency, rates, ratesError }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export default CurrencyContext;

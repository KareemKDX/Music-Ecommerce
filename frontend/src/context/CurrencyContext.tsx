import { createContext, useState, useEffect } from "react";

type Rates = {
  base: string;
  date: string;
  rates: Record<string, number>;
};

type CurrencyContextType = {
  chosenCurrency: string;
  setChosenCurrency: (currency: string) => void;
  rates: Rates | null;
};

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [chosenCurrency, setChosenCurrency] = useState("KR");
  const [rates, setRates] = useState<Rates | null>(null);

  useEffect(() => {
    fetch("/api/currency/rates?base=SEK")
      .then((response) => response.json())
      .then((data) => {
        console.log("Rates:", data);
        setRates(data);
      });
  }, []);

  return (
    <CurrencyContext.Provider
      value={{ chosenCurrency, setChosenCurrency, rates }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export default CurrencyContext;

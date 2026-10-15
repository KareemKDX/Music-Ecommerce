import { fetchJson } from "../lib/fetchJson";
import { z } from "zod";

const BASE_URL = "https://api.frankfurter.dev/v1";

type Rates = {
  base: string;
  date: string;
  rates: Record<string, number>; // E.g <EUR: 1.1234>
};

const FrankfurterRates = z.object({
  amount: z.number(),
  base: z.string(),
  date: z.string(),
  rates: z.record(z.string(), z.number().positive()),
});

type FrankfurterRates = z.infer<typeof FrankfurterRates>;

// https://api.frankfurter.dev/v1/latest?base=SEK&symbols=SEK,USD,EUR
export async function getRates(
  base = "SEK",
  symbols = ["SEK", "EUR", "USD"],
): Promise<Rates> {
  const url = new URL(`${BASE_URL}/latest`);
  url.searchParams.set("base", base);
  url.searchParams.set("symbols", symbols.join(","));

  try {
    const data = await fetchJson(url.toString());

    const result = FrankfurterRates.safeParse(data);

    if (!result.success) {
      throw new Error(
        "Invalid response from Frankfurter: " + result.error.message,
      );
    }

    const parsedData = result.data;

    return {
      base: parsedData.base,
      date: parsedData.date,
      rates: parsedData.rates,
    };
  } catch (err) {
    throw new Error("Something went wrong fetching rates", { cause: err });
  }
}

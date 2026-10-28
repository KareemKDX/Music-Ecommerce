// Adapter for PostNord. The ONLY file that knows PostNord: host, apikey, serviceCodes and their JSON.
// The rest of the shop only sees OUR model: ServicePoint and an ISO date for the delivery.
//
// Endpoints (sandbox host atapi2, production api2):
//   1. Service points: GET /rest/businesslocation/v5/servicepoints/nearest/byaddress
//   2. Transit time:   GET /rest/transport/v2/transittime/addresstoaddress
// The key is sent as the query parameter `apikey`. Wrong key → 403, too many calls → 429.

import { z } from "zod";

const BASE_URL = process.env.POSTNORD_API_URL ?? "https://atapi2.postnord.com";
const API_KEY = process.env.POSTNORD_API_KEY ?? "";
const TIMEOUT_MS = 5000;

// Set POSTNORD_DEBUG=true to log PostNord's raw answers (lab step 2: "what does PostNord answer?")
const DEBUG = process.env.POSTNORD_DEBUG === "true";

export type ShippingMethod = "service_point" | "home";

// OUR model of a service point – only what the shop uses, e.g.
// { id: "376062", name: "ICA KVANTUM GISLAVED", address: "Stinsgatan 2, GISLAVED" }
export type ServicePoint = {
  id: string;
  name: string;
  address: string;
};

// basicServiceCode: 19 = PostNord Service Point, 17 = PostNord Home
const SERVICE_CODES: Record<ShippingMethod, string> = {
  service_point: "19",
  home: "17",
};

// Like fetchJson, but the URL holds our apikey – so it must never end up in an error message or log.
async function fetchFromPostNord(
  path: string,
  params: Record<string, string>,
): Promise<unknown> {
  if (!API_KEY) {
    throw new Error("POSTNORD_API_KEY is missing in .env");
  }

  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("apikey", API_KEY);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      throw new Error(`No response from PostNord ${path} within ${TIMEOUT_MS} ms (timeout)`);
    }
    throw new Error(`Could not reach PostNord ${path} (network error)`, { cause: err });
  }

  if (response.status === 403) {
    throw new Error(`PostNord ${path} answered 403 – wrong API key, or the API is not in your plan`);
  }
  if (response.status === 429) {
    throw new Error(`PostNord ${path} answered 429 – rate limit reached`);
  }
  if (!response.ok) {
    throw new Error(`PostNord ${path} responded with status ${response.status}`);
  }

  const data = await response.json();
  if (DEBUG) {
    console.log(`[POSTNORD] ${path}:`, JSON.stringify(data, null, 2));
  }
  return data;
}

/* --- 1. SERVICE POINTS --- */

// Only the fields we use. PostNord sends much more (openingHours, coordinates, …) – Zod ignores it.
const PostNordAddress = z.object({
  streetName: z.string().optional(),
  streetNumber: z.string().optional(),
  city: z.string().optional(),
});

const PostNordServicePoint = z.object({
  servicePointId: z.string().min(1),
  name: z.string().min(1),
  visitingAddress: PostNordAddress,
});

const PostNordServicePointResponse = z.object({
  servicePointInformationResponse: z.object({
    servicePoints: z.array(PostNordServicePoint).default([]),
  }),
});

export async function getNearestServicePoints(
  postalCode: string,
  count = 5,
): Promise<ServicePoint[]> {
  const data = await fetchFromPostNord(
    "/rest/businesslocation/v5/servicepoints/nearest/byaddress",
    {
      returnType: "json",
      countryCode: "SE",
      postalCode,
      numberOfServicePoints: String(count),
    },
  );

  // VALIDATE POSTNORD'S ANSWER BEFORE USE
  const result = PostNordServicePointResponse.safeParse(data);
  if (!result.success) {
    throw new Error("Unexpected response from PostNord service points: " + result.error.message);
  }

  // MAP POSTNORD MODEL -> OUR MODEL
  const servicePoints: ServicePoint[] = [];
  for (const sp of result.data.servicePointInformationResponse.servicePoints) {
    const { streetName, streetNumber, city } = sp.visitingAddress;
    const street = [streetName, streetNumber].filter(Boolean).join(" ");
    servicePoints.push({
      id: sp.servicePointId,
      name: sp.name,
      address: [street, city].filter(Boolean).join(", "), // "Stinsgatan 2, GISLAVED"
    });
  }
  return servicePoints;
}

/* --- 2. TRANSIT TIME --- */

// PostNord answers with ALL its services – we pick the one that matches the customer's choice.
// Only the fields we use; everything else (latestTimeOfBooking, deliveryPoint, …) is ignored.
const PostNordTransitTime = z.object({
  isBookable: z.boolean(),
  estimatedTimeOfArrival: z
    .object({
      dateOfDeparture: z.string(), // "2024-12-02"
      timeOfArrival: z.string(), // "2024-12-03T18:00:00"
    })
    .optional(), // missing when the service isn't offered (then errorMessage is set)
  service: z.object({
    basicServiceCode: z.string(),
    additionalServices: z.array(z.object({ additionalServiceCode: z.string() })).optional(),
  }),
});

const PostNordTransitTimeResponse = z.array(PostNordTransitTime);

// Today's date in Sweden, "2026-10-28". The server (Vercel) runs in UTC, so we can't use toISOString().
function todayInSweden(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Stockholm" });
}

// The time right now in Sweden, "14:05" – PostNord's startTime is "2026-10-28T14:05"
function timeNowInSweden(): string {
  return new Date().toLocaleTimeString("sv-SE", {
    timeZone: "Europe/Stockholm",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Days between two "YYYY-MM-DD" dates, without time zones messing it up
function daysBetween(from: string, to: string): number {
  const ms = Date.parse(to.slice(0, 10)) - Date.parse(from.slice(0, 10));
  return Math.round(ms / 86_400_000);
}

function addDays(date: string, days: number): string {
  const d = new Date(date.slice(0, 10) + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function getEstimatedDelivery(
  fromPostalCode: string,
  toPostalCode: string,
  method: ShippingMethod,
): Promise<string | null> {
  const today = todayInSweden();

  // Parameters checked against the "Request URL" on PostNord's try-it page
  const data = await fetchFromPostNord("/rest/transport/v2/transittime/addresstoaddress", {
    startTime: `${today}T${timeNowInSweden()}`, // when we hand over the parcel – now
    originPostalCode: fromPostalCode,
    originCountryCode: "SE",
    destinationPostalCode: toPostalCode,
    destinationCountryCode: "SE",
    showInternalAdditionalServiceCode: "false",
  });

  // VALIDATE POSTNORD'S ANSWER BEFORE USE
  const result = PostNordTransitTimeResponse.safeParse(data);
  if (!result.success) {
    throw new Error("Unexpected response from PostNord transit time: " + result.error.message);
  }

  // The plain service: 19 = PostNord Service Point, 17 = PostNord Home.
  // Without additional services – "19 + H1" is Parcel Locker, "18 + D6" is Before 9, etc.
  const match = result.data.find(
    (t) =>
      t.isBookable &&
      t.estimatedTimeOfArrival &&
      t.service.basicServiceCode === SERVICE_CODES[method] &&
      !t.service.additionalServices?.length,
  );
  if (!match?.estimatedTimeOfArrival) {
    return null;
  }

  const { dateOfDeparture, timeOfArrival } = match.estimatedTimeOfArrival;
  const arrival = timeOfArrival.slice(0, 10);

  // The sandbox can answer with an old fixed date (e.g. 2024-12-03). Then we keep PostNord's
  // transit time (arrival − departure) but count it from today instead.
  if (arrival < today) {
    return addDays(today, Math.max(1, daysBetween(dateOfDeparture, timeOfArrival)));
  }
  return arrival;
}

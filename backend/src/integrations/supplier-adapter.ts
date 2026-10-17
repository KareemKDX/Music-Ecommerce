// Fetches the supplier's product file and converts it to OUR model.
// Compare with a normal JSON request:
//   const products = await (await fetch(url)).json()
// Here we have to do every step ourselves.

import { parse } from "csv-parse/sync";
import { XMLParser } from "fast-xml-parser";
import { z } from "zod";

const BASE_URL = process.env.SUPPLIER_API_URL;

const API_KEY = process.env.SUPPLIER_API_KEY;

async function fetchFromSupplier(path: string): Promise<Response> {
  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: { "X-Api-Key": API_KEY ?? "" },
      signal: AbortSignal.timeout(5000), // chaos-servern kan ta 8 sekunder
    });
    console.log(BASE_URL);
  } catch (err) {
    console.log("Fetch failed:", err);
    if (err instanceof Error) {
      console.log("Cause:", err.cause);
    }
    throw new Error("Could not reach the supplier (timeout or network error)", {
      cause: err,
    });
  }
  if (response.status === 429) {
    const wait = response.headers.get("retry-after");
    throw new Error(
      "Supplier rate limit reached. Try again in " + wait + " seconds",
    );
  }

  if (response.ok === false) {
    throw new Error("Supplier responded with status " + response.status);
  }

  return response;
}

export const ProductSchema = z.object({
  sku: z.string("Invalid/missing sku").min(1),
  name: z.string("Invalid/missing name").min(1),
  description: z.string("Invalid/missing description"),
  price: z.number("Invalid/missing price").positive(),
  image: z.string("Invalid/missing image url"),
});

export type Product = z.infer<typeof ProductSchema>;

export type SkippedProduct = {
  sku: string;
  reason: string;
};

// "599,00" → 599. The Swedish decimal comma must become a dot before Number().
function toNumber(text: string): number {
  return Number(text.replace(",", "."));
}

// An empty stock value means "unknown". We count it as 0 in stock.
function toStock(text: string): number {
  return text === "" ? 0 : Number(text);
}

/* --- CSV --- */
type CsvRow = {
  artNr: string;
  ean: string;
  benamning: string;
  pris: string;
  lagersaldo: string;
  varianter: string;
};

export async function getCsvProducts() {
  // 1. Fetch – exactly like with JSON
  const response = await fetchFromSupplier(
    `/v1/export/products.csv?bransch=elektronik`,
  );
  console.log("\n[CSV] 1. Content-Type:", response.headers.get("content-type"));

  // 2. Raw bytes. NOT .json() (it isn't JSON) and NOT .text().
  // The server sends "charset=windows-1252" in Content-Type, but fetch ignores it:
  // .text() ALWAYS decodes as UTF-8. Then "Tröja" → "Tr�ja", because ö is one byte (0xF6)
  // in Windows-1252 but must be two bytes in UTF-8. So we take the bytes and decode them ourselves.
  const buffer = await response.arrayBuffer();
  console.log("[CSV] 2. Number of bytes:", buffer.byteLength);

  // 3. Bytes → text, using the supplier's character encoding.
  // We hardcode 'windows-1252' because we know what this supplier sends. We could read it from
  // Content-Type, but not every supplier sets charset, and some set the wrong one.
  const text = new TextDecoder("windows-1252").decode(buffer);
  console.log("[CSV] 3. Raw text:\n" + text);

  // 4. Text → objects. Every value is still text, which is what we want for ean.
  const rows = parse<CsvRow>(text, {
    columns: true, // the first line holds the headers → each row becomes an object
    delimiter: ";", // without it, "599,00" is split into two columns at the comma
    skip_empty_lines: true, // without it, the empty line in the file is an error
    trim: true, // " Jacka " → "Jacka"
  });
  console.log("[CSV] 4. After parse:", rows);

  const products: Product[] = [];
  const skipped: SkippedProduct[] = [];

  for (const row of rows) {
    const candidate = {
      sku: row.artNr,
      name: row.benamning,
      description: "Imported from supplier",
      price: toNumber(row.pris),
      image: "product-placeholder.jpg",
    };

    const result = ProductSchema.safeParse(candidate);

    if (result.success) {
      products.push(result.data);
    } else {
      skipped.push({
        sku: row.artNr,
        reason: result.error.issues[0].message,
      });
    }
  }

  console.log("[CSV] 5. Our model:", products);

  return { text, rows, products, skipped };
}
/* --- XML --- */
type XmlProduct = {
  "@_artNr": string;
  ean: string;
  benamning: string;
  pris: { "#text": string }; // the tag has an attribute, so its text ends up in '#text'
  lagersaldo: string;
  varianter?: { variant: string[] }; // LEV-1003 has no <varianter>
};

const xmlParser = new XMLParser({
  ignoreAttributes: false, // without it, artNr="LEV-1001" disappears
  // attributeNamePrefix: '@_', // attributes get a prefix so they can't clash with tag names. This is already default, its only added to explain further why attributes have prefixes
  parseTagValue: false, // keep every value as text. Otherwise ean 0735100197975 → 735100197975

  // Without it, a tag that occurs only once becomes an object instead of a list.
  // LEV-1002 has one <variant>, and a file with one <produkt> would break the same way.
  isArray: (name) => name === "produkt" || name === "variant",
});

export async function getXmlProducts() {
  // 1. Fetch
  const response = await fetchFromSupplier(
    `/v1/export/products.xml?bransch=elektronik`,
  );
  console.log("\n[XML] 1. Content-Type:", response.headers.get("content-type"));

  // 2. This file is UTF-8, so .text() works. It's the file's encoding that matters, not the format:
  // if this XML file had been Windows-1252, we would use arrayBuffer() + TextDecoder like with CSV.
  const text = await response.text();
  console.log("[XML] 2. Raw text:\n" + text);

  // 3. Text → objects. The structure follows the tags in the file.
  const doc: { katalog: { produkt: XmlProduct[] } } = xmlParser.parse(text);
  console.log("[XML] 3. After parse:", JSON.stringify(doc, null, 2));

  // 4. Supplier's fields → our fields, text → number
  const products: Product[] = [];
  const skipped: SkippedProduct[] = [];

  for (const p of doc.katalog.produkt) {
    const candidate = {
      sku: p["@_artNr"],
      name: p.benamning,
      description: "Imported from supplier",
      price: toNumber(p.pris["#text"]),
      image: "product-placeholder.jpg",
    };

    const result = ProductSchema.safeParse(candidate);

    if (result.success) {
      products.push(result.data);
    } else {
      skipped.push({
        sku: p["@_artNr"],
        reason: result.error.issues[0].message,
      });
    }
  }

  return { text, parsed: doc, products, skipped };
}

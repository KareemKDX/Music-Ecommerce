import { algoliasearch } from "algoliasearch";
import { Product } from "../types/Product";

const APP_ID = process.env.ALGOLIA_APP_ID ?? "";
const ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY ?? "";
const SEARCH_KEY = process.env.ALGOLIA_SEARCH_KEY ?? "";
const INDEX_NAME = process.env.ALGOLIA_INDEX ?? "products";

/**
 *  --- 1. INDEX ---
 */

const adminClient = algoliasearch(APP_ID, ADMIN_KEY);
// How a product looks in Algolia: the same fields, but the id must be called objectID.
type AlgoliaRecord = {
  objectID: string;
  id?: number;
  name: string;
  description: string;
  price: number;
  image: string;
};

export async function indexProducts(products: Product[]) {
  // 1. Our model → Algolia's model. sku becomes objectID.
  const records: AlgoliaRecord[] = [];
  for (const product of products) {
    records.push({
      objectID: product.sku,
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
    });
  }

  // 2. Send them to Algolia. Same objectID again → the product is updated, not duplicated (upsert).
  // waitForTasks: wait until Algolia is done, so a search right after finds the products.
  await adminClient.saveObjects({
    indexName: INDEX_NAME,
    objects: records,
    waitForTasks: true,
  });

  return records.length;
}

// Removes products from Algolia, e.g. when they are deleted in the shop.

export async function removeProducts(skus: string[]) {
  await adminClient.deleteObjects({
    indexName: INDEX_NAME,
    objectIDs: skus,
  });

  return skus.length;
}

/**
 *  --- 2. SEARCH ---
 */
// The search key may only SEARCH. If it leaks, nobody can change our products.
const searchClient = algoliasearch(APP_ID, SEARCH_KEY);

type SearchParams = {
  query: string;
  page: number;
  pageSize: number;
};
export async function searchProducts(searchText: string) {
  // We are only sending in the searchText through ?q=
  // But we can send in lots of params through querystring to make the searchresult much more functional with filters and pagination
  const params: SearchParams = {
    query: searchText,
    page: 5,
    pageSize: 2,
  };

  // 1. Ask Algolia. Typos are forgiven: "hodie" finds "Hoodie".
  const response = await searchClient.searchSingleIndex<AlgoliaRecord>({
    indexName: INDEX_NAME,
    searchParams: {
      query: params.query,
      page: params.page - 1, // Algolia counts from 0, and we count from 1
      hitsPerPage: params.pageSize,
    },
  });

  // 2. Algolia's model → our model. objectID becomes sku again.
  const products: Product[] = [];
  for (const hit of response.hits) {
    products.push({
      sku: hit.objectID,
      name: hit.name,
      description: hit.description,
      price: hit.price,
      image: hit.image,
    });
  }

  const total = response.nbHits ?? 0;
  return {
    data: products,
    meta: {
      page: params.page,
      pageSize: params.pageSize,
      total: total,
      totalPages: Math.ceil(total / params.pageSize),
    },
  };
}

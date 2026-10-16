export type ImportedProduct = {
  sku: string;
  name: string;
  description: string;
  price: number;
  image: string;
};

export type SkippedProduct = {
  sku: string;
  reason: string;
};

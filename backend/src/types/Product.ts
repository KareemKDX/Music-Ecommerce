export type Product = {
  id?: number; // saknas innan databasen har skapat raden
  sku: string;
  name: string;
  description: string;
  price: number;
  image: string;
};

import type { OrderItem } from "./OrderItem";

export interface Order {
  id: number;
  user_id: number;
  status: string;
  created_at: string;
  shipping_address: string;
  items: OrderItem[];
}

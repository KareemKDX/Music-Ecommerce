import type { OrderItem } from "./OrderItem";

export interface Order {
  id: number;
  user_id: number;
  status: string;
  created_at: string;
  shipping_address: string;
  shipping_method: "service_point" | "home" | null;
  shipping_price: number;
  postal_code: string | null;
  service_point_name: string | null;
  service_point_address: string | null;
  estimated_delivery: string | null;
  items: OrderItem[];
}

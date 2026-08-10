export type HardCopyOrderStatus =
  | "pending"
  | "contacted"
  | "confirmed"
  | "delivered"
  | "cancelled";

export interface HardCopyOrder {
  id: string;
  story_id: string;
  user_id: string | null;
  customer_name: string;
  whatsapp_number: string;
  quantity: number;
  unit_price_mwk: number;
  total_price_mwk: number;
  status: HardCopyOrderStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateHardCopyOrderResponse {
  id: string;
  story_id: string;
  quantity: number;
  unit_price_mwk: number;
  total_price_mwk: number;
  status: HardCopyOrderStatus;
}
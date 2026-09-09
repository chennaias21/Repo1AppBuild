export type AccessStatus = "free" | "pending" | "paid";

export interface Profile {
  id: string;
  full_name: string | null;
  mobile: string | null;
  access_status: AccessStatus;
  access_granted_at: string | null;
  created_at: string;
}

export interface PaymentRow {
  id: string;
  user_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  amount_paise: number;
  currency: string;
  status: "created" | "paid" | "failed";
  created_at: string;
  verified_at: string | null;
}

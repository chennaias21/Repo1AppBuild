import { redirect } from "next/navigation";

/** Checkout now lives on the pricing page, where the learner chooses a plan. */
export default function CheckoutPage() {
  redirect("/pricing");
}

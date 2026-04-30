import { redirect } from "next/navigation";

export default function PaymentSuccessPage() {
  // Redirect to the main thank-you page since Stripe is no longer used
  redirect("/thank-you");
}

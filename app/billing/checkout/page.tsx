import type {
  Metadata,
} from "next";

import JCSEmbeddedCheckoutView from
  "@/features/billing/JCSEmbeddedCheckoutView";


export const metadata: Metadata = {
  title:
    "Secure Billing | JCS Business Suite",

  description:
    "Complete JCS Business Suite subscription billing securely with Stripe.",
};


export default function BillingCheckoutPage() {

  return (
    <JCSEmbeddedCheckoutView />
  );
}

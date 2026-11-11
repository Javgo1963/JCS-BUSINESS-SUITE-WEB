import type {
  Metadata,
} from "next";

import JCSBillingReturnView from
  "@/features/billing/JCSBillingReturnView";


export const metadata: Metadata = {
  title:
    "Subscription Verification | JCS Business Suite",

  description:
    "Verify the canonical JCS Business Suite subscription after Stripe Checkout.",
};


export default function BillingReturnPage() {

  return (
    <JCSBillingReturnView />
  );
}

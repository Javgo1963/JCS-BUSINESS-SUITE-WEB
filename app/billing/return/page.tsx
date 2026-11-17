import type {
  Metadata,
} from "next";

import JCSBillingReturnView from
  "@/features/billing/JCSBillingReturnView";


export const metadata: Metadata = {
  title:
    "Preparing Your Workspace | JCS Business Suite",

  description:
    "Prepare secure JCS Business Suite access after subscription checkout.",
};


export default function BillingReturnPage() {

  return (
    <JCSBillingReturnView />
  );
}

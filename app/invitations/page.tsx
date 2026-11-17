"use client";

import BusinessInvitationsView from "@/features/business-invitations/BusinessInvitationsView";

import {
  JCSBusinessContextProvider,
} from "@/core/business-context/JCSBusinessContext";

export default function BusinessInvitationsPage() {
  return (
    <JCSBusinessContextProvider>
      <BusinessInvitationsView />
    </JCSBusinessContextProvider>
  );
}

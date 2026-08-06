"use client";

import AppUsersView from "@/features/app-users/AppUsersView";

import {
  JCSBusinessContextProvider,
} from "@/core/business-context/JCSBusinessContext";

export default function AppUsersPage() {
  return (
    <JCSBusinessContextProvider>
      <AppUsersView />
    </JCSBusinessContextProvider>
  );
}
"use client";

import PlatformExecutiveCenterView from "@/features/platform-executive-center/PlatformExecutiveCenterView";

import {
  JCSBusinessContextProvider,
} from "@/core/business-context/JCSBusinessContext";

export default function PlatformExecutiveCenterPage() {
  return (
    <JCSBusinessContextProvider>
      <PlatformExecutiveCenterView />
    </JCSBusinessContextProvider>
  );
}
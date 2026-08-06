"use client";

import type {
  ReactNode,
} from "react";

import {
  AuthProvider,
} from "@/core/providers/AuthProvider";

import {
  JCSBusinessContextProvider,
} from "@/core/business-context/JCSBusinessContext";

import {
  PlatformSettingsContextProvider,
} from "@/features/platform-settings/PlatformSettingsContext";

interface AppProvidersProps {
  children:
    ReactNode;
}

export function AppProviders({
  children,
}: AppProvidersProps) {
  return (
    <AuthProvider>
      <JCSBusinessContextProvider>
        <PlatformSettingsContextProvider>
          {children}
        </PlatformSettingsContextProvider>
      </JCSBusinessContextProvider>
    </AuthProvider>
  );
}
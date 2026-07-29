"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "@/core/providers/AuthProvider";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({
  children,
}: AppProvidersProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
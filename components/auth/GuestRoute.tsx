"use client";

import {
  useEffect,
  type ReactNode,
} from "react";

import { useRouter } from "next/navigation";

import { LoadingScreen } from "@/components/auth/LoadingScreen";
import { useAuth } from "@/core/hooks/useAuth";

interface GuestRouteProps {
  children: ReactNode;
  redirectTo?: string;
  allowAuthenticated?: boolean;
}

export function GuestRoute({
  children,
  redirectTo = "/dashboard",
  allowAuthenticated = false,
}: GuestRouteProps) {
  const router = useRouter();

  const {
    isAuthenticated,
    isLoading,
  } = useAuth();

  useEffect(() => {
    if (
      !allowAuthenticated &&
      !isLoading &&
      isAuthenticated
    ) {
      router.replace(redirectTo);
    }
  }, [
    allowAuthenticated,
    isAuthenticated,
    isLoading,
    redirectTo,
    router,
  ]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (
    isAuthenticated &&
    !allowAuthenticated
  ) {
    return (
      <LoadingScreen message="Opening your dashboard..." />
    );
  }

  return <>{children}</>;
}
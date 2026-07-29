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
}

export function GuestRoute({
  children,
  redirectTo = "/dashboard",
}: GuestRouteProps) {
  const router = useRouter();

  const {
    isAuthenticated,
    isLoading,
  } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [
    isAuthenticated,
    isLoading,
    redirectTo,
    router,
  ]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return (
      <LoadingScreen message="Opening your dashboard..." />
    );
  }

  return <>{children}</>;
}
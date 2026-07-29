"use client";

import {
  useEffect,
  type ReactNode,
} from "react";

import { useRouter } from "next/navigation";

import { LoadingScreen } from "@/components/auth/LoadingScreen";
import { useAuth } from "@/core/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const router = useRouter();

  const {
    isAuthenticated,
    isLoading,
  } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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

  if (!isAuthenticated) {
    return <LoadingScreen message="Redirecting to login..." />;
  }

  return <>{children}</>;
}
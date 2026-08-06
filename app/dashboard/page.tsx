"use client";

import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import DashboardView from
  "@/features/dashboard/DashboardView";

// MARK: - Dashboard Page

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardView />
    </ProtectedRoute>
  );
}
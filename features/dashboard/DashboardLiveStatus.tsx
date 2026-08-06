//
// JCS Business Suite
// DashboardLiveStatus.tsx
//
// Displays the synchronization state of the Dashboard.
// Keeps loading, error and refresh controls outside DashboardView.
//

"use client";

import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  LoaderCircle,
  RefreshCw,
  WifiOff,
} from "lucide-react";

import {
  useCallback,
  useMemo,
  useState,
} from "react";

import "./DashboardLiveStatus.css";

// MARK: - Types

export type DashboardConnectionStatus =
  | "syncing"
  | "connected"
  | "offline"
  | "error";

export interface DashboardLiveStatusProps {
  isLoading: boolean;
  errorMessage?: string | null;
  refreshedAt?: Date | null;
  onRefresh: () => Promise<void> | void;
  compact?: boolean;
  languageCode?: string | null;
}

// MARK: - Helpers

function normalizedLanguageCode(
  value?: string | null
): "en" | "es" {
  const normalized =
    value
      ?.trim()
      .toLowerCase() || "en";

  return normalized.startsWith("es")
    ? "es"
    : "en";
}

function formatRefreshTime(
  value: Date | null | undefined,
  language: "en" | "es"
): string {
  if (!value) {
    return language === "es"
      ? "Todavía no se ha sincronizado"
      : "Not synchronized yet";
  }

  const now = new Date();

  const differenceInSeconds = Math.max(
    0,
    Math.floor(
      (now.getTime() - value.getTime()) /
        1000
    )
  );

  if (differenceInSeconds < 10) {
    return language === "es"
      ? "Actualizado ahora"
      : "Updated now";
  }

  if (differenceInSeconds < 60) {
    return language === "es"
      ? `Actualizado hace ${differenceInSeconds} segundos`
      : `Updated ${differenceInSeconds} seconds ago`;
  }

  const differenceInMinutes = Math.floor(
    differenceInSeconds / 60
  );

  if (differenceInMinutes < 60) {
    if (language === "es") {
      return differenceInMinutes === 1
        ? "Actualizado hace 1 minuto"
        : `Actualizado hace ${differenceInMinutes} minutos`;
    }

    return differenceInMinutes === 1
      ? "Updated 1 minute ago"
      : `Updated ${differenceInMinutes} minutes ago`;
  }

  return value.toLocaleTimeString(
    language === "es"
      ? "es-US"
      : "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

// MARK: - Component

export default function DashboardLiveStatus({
  isLoading,
  errorMessage,
  refreshedAt,
  onRefresh,
  compact = false,
  languageCode,
}: DashboardLiveStatusProps) {
  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const language =
    normalizedLanguageCode(
      languageCode
    );

  const connectionStatus =
    useMemo<DashboardConnectionStatus>(
      () => {
        if (errorMessage) {
          if (
            typeof navigator !==
              "undefined" &&
            !navigator.onLine
          ) {
            return "offline";
          }

          return "error";
        }

        if (
          isLoading ||
          isRefreshing
        ) {
          return "syncing";
        }

        return "connected";
      },
      [
        errorMessage,
        isLoading,
        isRefreshing,
      ]
    );

  const labels = useMemo(
    () => {
      if (language === "es") {
        return {
          syncing: "Actualizando",
          connected: "Sincronizado",
          offline: "Sin conexión",
          error: "Error de sincronización",
          refresh: "Actualizar",
          refreshing: "Actualizando…",
          liveData: "Datos en vivo",
          retry: "Intentar nuevamente",
        };
      }

      return {
        syncing: "Updating",
        connected: "Synchronized",
        offline: "Offline",
        error: "Synchronization error",
        refresh: "Refresh",
        refreshing: "Refreshing…",
        liveData: "Live data",
        retry: "Try again",
      };
    },
    [
      language,
    ]
  );

  const handleRefresh =
    useCallback(async () => {
      if (
        isRefreshing ||
        isLoading
      ) {
        return;
      }

      try {
        setIsRefreshing(true);
        await onRefresh();
      } catch (error) {
        console.error(
          "Unable to refresh Dashboard:",
          error
        );
      } finally {
        setIsRefreshing(false);
      }
    }, [
      isLoading,
      isRefreshing,
      onRefresh,
    ]);

  const icon = useMemo(() => {
    switch (connectionStatus) {
      case "syncing":
        return (
          <LoaderCircle
            size={compact ? 15 : 17}
            strokeWidth={1.9}
            className="jcs-live-status__spinner"
          />
        );

      case "offline":
        return (
          <WifiOff
            size={compact ? 15 : 17}
            strokeWidth={1.9}
          />
        );

      case "error":
        return (
          <AlertCircle
            size={compact ? 15 : 17}
            strokeWidth={1.9}
          />
        );

      case "connected":
      default:
        return (
          <CheckCircle2
            size={compact ? 15 : 17}
            strokeWidth={1.9}
          />
        );
    }
  }, [
    compact,
    connectionStatus,
  ]);

  const statusLabel =
    labels[connectionStatus];

  const detailLabel =
    connectionStatus === "error"
      ? errorMessage ||
        labels.error
      : connectionStatus === "offline"
        ? labels.offline
        : connectionStatus ===
            "syncing"
          ? labels.liveData
          : formatRefreshTime(
              refreshedAt,
              language
            );

  return (
    <div
      className={[
        "jcs-live-status",
        compact
          ? "jcs-live-status--compact"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-status={
        connectionStatus
      }
      role={
        connectionStatus === "error"
          ? "alert"
          : "status"
      }
      aria-live="polite"
    >
      <div className="jcs-live-status__icon">
        {icon}
      </div>

      <div className="jcs-live-status__copy">
        <div className="jcs-live-status__title">
          <Cloud
            size={compact ? 12 : 13}
            strokeWidth={1.9}
          />

          <strong>{statusLabel}</strong>
        </div>

        {!compact && (
          <span>{detailLabel}</span>
        )}
      </div>

      <button
        type="button"
        className="jcs-live-status__refresh"
        disabled={
          isLoading ||
          isRefreshing
        }
        aria-label={
          connectionStatus === "error"
            ? labels.retry
            : labels.refresh
        }
        title={
          connectionStatus === "error"
            ? labels.retry
            : labels.refresh
        }
        onClick={() => {
          void handleRefresh();
        }}
      >
        <RefreshCw
          size={compact ? 15 : 16}
          strokeWidth={1.9}
          className={
            isLoading ||
            isRefreshing
              ? "jcs-live-status__refresh-icon--rotating"
              : undefined
          }
        />

        {!compact && (
          <span>
            {isRefreshing
              ? labels.refreshing
              : connectionStatus ===
                  "error"
                ? labels.retry
                : labels.refresh}
          </span>
        )}
      </button>
    </div>
  );
}
"use client";

import {
  CalendarDays,
  Clock3,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

// =======================================================
// MARK: - Types
// =======================================================

interface JCSRealtimeClockProps {
  locale?: string;
  timeZone?: string;

  showSeconds?: boolean;
  compact?: boolean;

  className?: string;
}

// =======================================================
// MARK: - Helpers
// =======================================================

function cleanText(
  value:
    | string
    | null
    | undefined
): string {
  return value?.trim() ?? "";
}

function resolveLocale(
  locale?: string
): string {
  return (
    cleanText(locale) ||
    "en-US"
  );
}

function resolveTimeZone(
  timeZone?: string
): string | undefined {
  const normalized =
    cleanText(timeZone);

  return normalized || undefined;
}

// =======================================================
// MARK: - Component
// =======================================================

export default function JCSRealtimeClock({
  locale = "en-US",
  timeZone,
  showSeconds = true,
  compact = false,
  className = "",
}: JCSRealtimeClockProps) {
  const [
    currentDate,
    setCurrentDate,
  ] = useState<Date | null>(
    null
  );

  const resolvedLocale =
    resolveLocale(locale);

  const resolvedTimeZone =
    resolveTimeZone(
      timeZone
    );

  // =====================================================
  // MARK: - Realtime Timer
  // =====================================================

  useEffect(() => {
    setCurrentDate(
      new Date()
    );

    const intervalMilliseconds =
      showSeconds
        ? 1000
        : 30_000;

    const timer =
      window.setInterval(
        () => {
          setCurrentDate(
            new Date()
          );
        },
        intervalMilliseconds
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [
    showSeconds,
  ]);

  // =====================================================
  // MARK: - Formatters
  // =====================================================

  const dateFormatter =
    useMemo(
      () =>
        new Intl.DateTimeFormat(
          resolvedLocale,
          {
            weekday:
              compact
                ? "short"
                : "long",

            month:
              compact
                ? "short"
                : "long",

            day:
              "numeric",

            year:
              compact
                ? undefined
                : "numeric",

            timeZone:
              resolvedTimeZone,
          }
        ),
      [
        compact,
        resolvedLocale,
        resolvedTimeZone,
      ]
    );

  const timeFormatter =
    useMemo(
      () =>
        new Intl.DateTimeFormat(
          resolvedLocale,
          {
            hour:
              "numeric",

            minute:
              "2-digit",

            second:
              showSeconds
                ? "2-digit"
                : undefined,

            timeZone:
              resolvedTimeZone,
          }
        ),
      [
        resolvedLocale,
        resolvedTimeZone,
        showSeconds,
      ]
    );

  // =====================================================
  // MARK: - Presentation Values
  // =====================================================

  const dateText =
    currentDate
      ? dateFormatter.format(
          currentDate
        )
      : "Loading date…";

  const timeText =
    currentDate
      ? timeFormatter.format(
          currentDate
        )
      : "--:--";

  const combinedClassName = [
    "jcs-realtime-clock",

    compact
      ? "jcs-realtime-clock--compact"
      : "",

    className,
  ]
    .filter(Boolean)
    .join(" ");

  // =====================================================
  // MARK: - View
  // =====================================================

  return (
    <section
      className={
        combinedClassName
      }
      aria-label="Current date and time"
      aria-live="off"
    >
      <div className="jcs-realtime-clock__date">
        <span className="jcs-realtime-clock__icon">
          <CalendarDays
            size={16}
            strokeWidth={1.8}
          />
        </span>

        <span>
          {dateText}
        </span>
      </div>

      <div className="jcs-realtime-clock__time">
        <span className="jcs-realtime-clock__icon">
          <Clock3
            size={17}
            strokeWidth={1.8}
          />
        </span>

        <time
          dateTime={
            currentDate
              ?.toISOString()
          }
        >
          {timeText}
        </time>
      </div>
    </section>
  );
}
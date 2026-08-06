"use client";

/*
 * JCS Business Suite Web
 * JCSWeatherCard.tsx
 *
 * Premium local weather card for the official
 * JCS Business Suite application shell.
 *
 * Responsibilities:
 *
 * - Request browser location permission.
 * - Resolve the current city and region.
 * - Load current weather conditions.
 * - Support Fahrenheit and Celsius automatically.
 * - Provide loading, denied and error states.
 * - Remain independent from business and platform logic.
 */

import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  LocateFixed,
  MapPin,
  RefreshCw,
  Sun,
  Wind,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";

import "./JCSWeatherCard.css";

// =======================================================
// MARK: - Types
// =======================================================

type WeatherCardStatus =
  | "idle"
  | "locating"
  | "loading"
  | "ready"
  | "permission-denied"
  | "unsupported"
  | "error";

type TemperatureUnit =
  | "fahrenheit"
  | "celsius";

interface WeatherCoordinates {
  latitude:
    number;

  longitude:
    number;
}

interface WeatherLocation {
  locality:
    string;

  region:
    string;

  country:
    string;
}

interface CurrentWeather {
  temperature:
    number;

  apparentTemperature:
    number;

  relativeHumidity:
    number;

  windSpeed:
    number;

  weatherCode:
    number;

  isDay:
    boolean;

  time:
    string;
}

interface OpenMeteoResponse {
  current?: {
    temperature_2m?:
      number;

    apparent_temperature?:
      number;

    relative_humidity_2m?:
      number;

    wind_speed_10m?:
      number;

    weather_code?:
      number;

    is_day?:
      number;

    time?:
      string;
  };

  current_units?: {
    temperature_2m?:
      string;

    apparent_temperature?:
      string;

    relative_humidity_2m?:
      string;

    wind_speed_10m?:
      string;
  };

  timezone?:
    string;
}

interface ReverseGeocodingResponse {
  locality?:
    string;

  city?:
    string;

  principalSubdivision?:
    string;

  countryName?:
    string;
}

export interface JCSWeatherCardProps {
  languageCode?:
    string;

  temperatureUnit?:
    TemperatureUnit;

  autoLoad?:
    boolean;

  compact?:
    boolean;

  className?:
    string;
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

function normalizedLanguageCode(
  value?:
    string
    | null
): string {
  const normalized =
    cleanText(
      value
    )
      .toLowerCase()
      .replace(
        "_",
        "-"
      );

  return normalized.startsWith(
    "es"
  )
    ? "es"
    : "en";
}

function resolveDefaultTemperatureUnit():
  TemperatureUnit {
  if (
    typeof navigator ===
    "undefined"
  ) {
    return "fahrenheit";
  }

  const locale =
    navigator.language
      .toLowerCase();

  /*
   * Fahrenheit is customary in the United States.
   * Other locales default to Celsius.
   */
  return locale ===
      "en-us" ||
    locale.endsWith(
      "-us"
    )
    ? "fahrenheit"
    : "celsius";
}

function weatherDescription(
  weatherCode:
    number,
  languageCode:
    string
): string {
  const spanish =
    languageCode ===
    "es";

  if (
    weatherCode ===
    0
  ) {
    return spanish
      ? "Despejado"
      : "Clear sky";
  }

  if (
    weatherCode ===
      1 ||
    weatherCode ===
      2
  ) {
    return spanish
      ? "Parcialmente nublado"
      : "Partly cloudy";
  }

  if (
    weatherCode ===
    3
  ) {
    return spanish
      ? "Nublado"
      : "Overcast";
  }

  if (
    weatherCode ===
      45 ||
    weatherCode ===
      48
  ) {
    return spanish
      ? "Neblina"
      : "Fog";
  }

  if (
    weatherCode >=
      51 &&
    weatherCode <=
      57
  ) {
    return spanish
      ? "Llovizna"
      : "Drizzle";
  }

  if (
    weatherCode >=
      61 &&
    weatherCode <=
      67
  ) {
    return spanish
      ? "Lluvia"
      : "Rain";
  }

  if (
    weatherCode >=
      71 &&
    weatherCode <=
      77
  ) {
    return spanish
      ? "Nieve"
      : "Snow";
  }

  if (
    weatherCode >=
      80 &&
    weatherCode <=
      82
  ) {
    return spanish
      ? "Chubascos"
      : "Rain showers";
  }

  if (
    weatherCode >=
      85 &&
    weatherCode <=
      86
  ) {
    return spanish
      ? "Chubascos de nieve"
      : "Snow showers";
  }

  if (
    weatherCode >=
      95 &&
    weatherCode <=
      99
  ) {
    return spanish
      ? "Tormentas"
      : "Thunderstorms";
  }

  return spanish
    ? "Condiciones actuales"
    : "Current conditions";
}

function weatherIcon(
  weatherCode:
    number,
  isDay:
    boolean
): ComponentType<{
  size?: number;
  strokeWidth?: number;
}> {
  if (
    weatherCode ===
    0
  ) {
    return isDay
      ? Sun
      : Cloud;
  }

  if (
    weatherCode >=
      1 &&
    weatherCode <=
      3
  ) {
    return Cloud;
  }

  if (
    weatherCode ===
      45 ||
    weatherCode ===
      48
  ) {
    return CloudFog;
  }

  if (
    weatherCode >=
      51 &&
    weatherCode <=
      57
  ) {
    return CloudDrizzle;
  }

  if (
    (
      weatherCode >=
        61 &&
      weatherCode <=
        67
    ) ||
    (
      weatherCode >=
        80 &&
      weatherCode <=
        82
    )
  ) {
    return CloudRain;
  }

  if (
    (
      weatherCode >=
        71 &&
      weatherCode <=
        77
    ) ||
    (
      weatherCode >=
        85 &&
      weatherCode <=
        86
    )
  ) {
    return CloudSnow;
  }

  if (
    weatherCode >=
      95 &&
    weatherCode <=
      99
  ) {
    return CloudLightning;
  }

  return Cloud;
}

function formatLocation(
  location:
    WeatherLocation
): string {
  const locality =
    cleanText(
      location.locality
    );

  const region =
    cleanText(
      location.region
    );

  if (
    locality &&
    region &&
    locality.toLowerCase() !==
      region.toLowerCase()
  ) {
    return `${locality}, ${region}`;
  }

  return (
    locality ||
    region ||
    cleanText(
      location.country
    ) ||
    "Current location"
  );
}

function getCurrentCoordinates():
  Promise<WeatherCoordinates> {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      if (
        typeof navigator ===
          "undefined" ||
        !navigator.geolocation
      ) {
        reject(
          new Error(
            "Geolocation is not supported by this browser."
          )
        );

        return;
      }

      navigator.geolocation
        .getCurrentPosition(
          (
            position
          ) => {
            resolve({
              latitude:
                position
                  .coords
                  .latitude,

              longitude:
                position
                  .coords
                  .longitude,
            });
          },
          (
            error
          ) => {
            reject(
              error
            );
          },
          {
            enableHighAccuracy:
              false,

            timeout:
              12_000,

            maximumAge:
              10 * 60 * 1000,
          }
        );
    }
  );
}

// =======================================================
// MARK: - Data Services
// =======================================================

async function fetchCurrentWeather(
  coordinates:
    WeatherCoordinates,
  temperatureUnit:
    TemperatureUnit,
  signal:
    AbortSignal
): Promise<CurrentWeather> {
  const weatherURL =
    new URL(
      "https://api.open-meteo.com/v1/forecast"
    );

  weatherURL.searchParams.set(
    "latitude",
    String(
      coordinates.latitude
    )
  );

  weatherURL.searchParams.set(
    "longitude",
    String(
      coordinates.longitude
    )
  );

  weatherURL.searchParams.set(
    "current",
    [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "weather_code",
      "wind_speed_10m",
      "is_day",
    ].join(",")
  );

  weatherURL.searchParams.set(
    "temperature_unit",
    temperatureUnit
  );

  weatherURL.searchParams.set(
    "wind_speed_unit",
    temperatureUnit ===
      "fahrenheit"
      ? "mph"
      : "kmh"
  );

  weatherURL.searchParams.set(
    "timezone",
    "auto"
  );

  weatherURL.searchParams.set(
    "forecast_days",
    "1"
  );

  const response =
    await fetch(
      weatherURL.toString(),
      {
        method:
          "GET",

        signal,

        cache:
          "no-store",
      }
    );

  if (
    !response.ok
  ) {
    throw new Error(
      `Weather request failed with status ${response.status}.`
    );
  }

  const result =
    await response
      .json() as OpenMeteoResponse;

  const current =
    result.current;

  if (
    !current ||
    typeof current
      .temperature_2m !==
      "number" ||
    typeof current
      .weather_code !==
      "number"
  ) {
    throw new Error(
      "Current weather information is unavailable."
    );
  }

  return {
    temperature:
      current.temperature_2m,

    apparentTemperature:
      typeof current
        .apparent_temperature ===
        "number"
        ? current
            .apparent_temperature
        : current
            .temperature_2m,

    relativeHumidity:
      typeof current
        .relative_humidity_2m ===
        "number"
        ? current
            .relative_humidity_2m
        : 0,

    windSpeed:
      typeof current
        .wind_speed_10m ===
        "number"
        ? current
            .wind_speed_10m
        : 0,

    weatherCode:
      current.weather_code,

    isDay:
      current.is_day !==
      0,

    time:
      cleanText(
        current.time
      ),
  };
}

async function fetchCurrentLocation(
  coordinates:
    WeatherCoordinates,
  languageCode:
    string,
  signal:
    AbortSignal
): Promise<WeatherLocation> {
  const locationURL =
    new URL(
      "https://api.bigdatacloud.net/data/reverse-geocode-client"
    );

  locationURL.searchParams.set(
    "latitude",
    String(
      coordinates.latitude
    )
  );

  locationURL.searchParams.set(
    "longitude",
    String(
      coordinates.longitude
    )
  );

  locationURL.searchParams.set(
    "localityLanguage",
    languageCode
  );

  const response =
    await fetch(
      locationURL.toString(),
      {
        method:
          "GET",

        signal,

        cache:
          "no-store",
      }
    );

  if (
    !response.ok
  ) {
    throw new Error(
      `Location request failed with status ${response.status}.`
    );
  }

  const result =
    await response
      .json() as ReverseGeocodingResponse;

  return {
    locality:
      cleanText(
        result.locality
      ) ||
      cleanText(
        result.city
      ),

    region:
      cleanText(
        result
          .principalSubdivision
      ),

    country:
      cleanText(
        result.countryName
      ),
  };
}

// =======================================================
// MARK: - Component
// =======================================================

export default function JCSWeatherCard({
  languageCode:
    providedLanguageCode =
      "en",

  temperatureUnit:
    providedTemperatureUnit,

  autoLoad =
    true,

  compact =
    false,

  className =
    "",
}: JCSWeatherCardProps) {
  const languageCode =
    normalizedLanguageCode(
      providedLanguageCode
    );

  const temperatureUnit =
    providedTemperatureUnit ??
    resolveDefaultTemperatureUnit();

  const [
    status,
    setStatus,
  ] =
    useState<WeatherCardStatus>(
      "idle"
    );

  const [
    weather,
    setWeather,
  ] =
    useState<CurrentWeather | null>(
      null
    );

  const [
    location,
    setLocation,
  ] =
    useState<WeatherLocation>({
      locality:
        "",

      region:
        "",

      country:
        "",
    });

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const [
    refreshedAt,
    setRefreshedAt,
  ] =
    useState<Date | null>(
      null
    );

  const activeRequestID =
    useRef(
      0
    );

  const abortControllerReference =
    useRef<AbortController | null>(
      null
    );

  const mountedReference =
    useRef(
      true
    );

  useEffect(() => {
    mountedReference.current =
      true;

    return () => {
      mountedReference.current =
        false;

      abortControllerReference
        .current
        ?.abort();
    };
  }, []);

  const loadWeather =
    useCallback(
      async (): Promise<void> => {
        const requestID =
          activeRequestID.current +
          1;

        activeRequestID.current =
          requestID;

        abortControllerReference
          .current
          ?.abort();

        const controller =
          new AbortController();

        abortControllerReference.current =
          controller;

        setErrorMessage(
          ""
        );

        setStatus(
          "locating"
        );

        try {
          const coordinates =
            await getCurrentCoordinates();

          if (
            !mountedReference.current ||
            activeRequestID.current !==
              requestID
          ) {
            return;
          }

          setStatus(
            "loading"
          );

          const [
            loadedWeather,
            loadedLocation,
          ] =
            await Promise.all([
              fetchCurrentWeather(
                coordinates,
                temperatureUnit,
                controller.signal
              ),

              fetchCurrentLocation(
                coordinates,
                languageCode,
                controller.signal
              ).catch(
                () => ({
                  locality:
                    "",

                  region:
                    "",

                  country:
                    "",
                })
              ),
            ]);

          if (
            !mountedReference.current ||
            activeRequestID.current !==
              requestID
          ) {
            return;
          }

          setWeather(
            loadedWeather
          );

          setLocation(
            loadedLocation
          );

          setRefreshedAt(
            new Date()
          );

          setStatus(
            "ready"
          );
        } catch (
          error: unknown
        ) {
          if (
            !mountedReference.current ||
            activeRequestID.current !==
              requestID
          ) {
            return;
          }

          if (
            error instanceof
              DOMException &&
            error.name ===
              "AbortError"
          ) {
            return;
          }

          if (
            typeof GeolocationPositionError !==
              "undefined" &&
            error instanceof
              GeolocationPositionError
          ) {
            if (
              error.code ===
              error.PERMISSION_DENIED
            ) {
              setStatus(
                "permission-denied"
              );

              setErrorMessage(
                languageCode ===
                  "es"
                  ? "Permite el acceso a tu ubicación para mostrar el clima local."
                  : "Allow location access to display your local weather."
              );

              return;
            }

            setStatus(
              "error"
            );

            setErrorMessage(
              languageCode ===
                "es"
                ? "No pudimos determinar tu ubicación actual."
                : "We could not determine your current location."
            );

            return;
          }

          if (
            error instanceof Error &&
            error.message.includes(
              "not supported"
            )
          ) {
            setStatus(
              "unsupported"
            );

            setErrorMessage(
              languageCode ===
                "es"
                ? "Este navegador no admite ubicación."
                : "This browser does not support location services."
            );

            return;
          }

          console.error(
            "Unable to load local weather:",
            error
          );

          setStatus(
            "error"
          );

          setErrorMessage(
            languageCode ===
              "es"
              ? "El clima local no está disponible en este momento."
              : "Local weather is currently unavailable."
          );
        }
      },
      [
        languageCode,
        temperatureUnit,
      ]
    );

  useEffect(() => {
    if (
      !autoLoad
    ) {
      return;
    }

    void loadWeather();
  }, [
    autoLoad,
    loadWeather,
  ]);

  const WeatherIcon =
    useMemo(
      () =>
        weatherIcon(
          weather?.weatherCode ??
            0,

          weather?.isDay ??
            true
        ),
      [
        weather?.isDay,
        weather?.weatherCode,
      ]
    );

  const description =
    weatherDescription(
      weather?.weatherCode ??
        0,

      languageCode
    );

  const locationText =
    formatLocation(
      location
    );

  const temperatureSymbol =
    temperatureUnit ===
      "fahrenheit"
      ? "°F"
      : "°C";

  const windUnit =
    temperatureUnit ===
      "fahrenheit"
      ? "mph"
      : "km/h";

  const isBusy =
    status ===
      "locating" ||
    status ===
      "loading";

  const updatedText =
    refreshedAt
      ? refreshedAt
          .toLocaleTimeString(
            languageCode ===
              "es"
              ? "es-US"
              : "en-US",
            {
              hour:
                "numeric",

              minute:
                "2-digit",
            }
          )
      : "";

  // =====================================================
  // MARK: - Render
  // =====================================================

  return (
    <section
      className={[
        "jcs-weather-card",

        compact
          ? "jcs-weather-card--compact"
          : "",

        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-status={
        status
      }
      aria-label={
        languageCode ===
          "es"
          ? "Clima local"
          : "Local weather"
      }
    >
      <div
        className="jcs-weather-card__ambient"
        aria-hidden="true"
      />

      {status ===
        "ready" &&
      weather ? (
        <>
          <div className="jcs-weather-card__top">
            <div className="jcs-weather-card__condition-icon">
              <WeatherIcon
                size={28}
                strokeWidth={1.7}
              />
            </div>

            <button
              type="button"
              className="jcs-weather-card__refresh"
              aria-label={
                languageCode ===
                  "es"
                  ? "Actualizar clima"
                  : "Refresh weather"
              }
              title={
                languageCode ===
                  "es"
                  ? "Actualizar clima"
                  : "Refresh weather"
              }
              onClick={() => {
                void loadWeather();
              }}
            >
              <RefreshCw
                size={16}
                strokeWidth={1.8}
              />
            </button>
          </div>

          <div className="jcs-weather-card__main">
            <div className="jcs-weather-card__temperature">
              <strong>
                {Math.round(
                  weather.temperature
                )}
              </strong>

              <span>
                {temperatureSymbol}
              </span>
            </div>

            <div className="jcs-weather-card__condition">
              <strong>
                {description}
              </strong>

              <span>
                {languageCode ===
                  "es"
                  ? "Sensación"
                  : "Feels like"}
                {" "}
                {Math.round(
                  weather
                    .apparentTemperature
                )}
                {temperatureSymbol}
              </span>
            </div>
          </div>

          <div className="jcs-weather-card__location">
            <MapPin
              size={15}
              strokeWidth={1.8}
            />

            <span>
              {locationText}
            </span>
          </div>

          <div className="jcs-weather-card__details">
            <div>
              <CloudDrizzle
                size={15}
                strokeWidth={1.8}
              />

              <span>
                {weather.relativeHumidity}%
              </span>

              <small>
                {languageCode ===
                  "es"
                  ? "Humedad"
                  : "Humidity"}
              </small>
            </div>

            <div>
              <Wind
                size={15}
                strokeWidth={1.8}
              />

              <span>
                {Math.round(
                  weather.windSpeed
                )}
                {" "}
                {windUnit}
              </span>

              <small>
                {languageCode ===
                  "es"
                  ? "Viento"
                  : "Wind"}
              </small>
            </div>
          </div>

          {updatedText && (
            <span className="jcs-weather-card__updated">
              {languageCode ===
                "es"
                ? "Actualizado"
                : "Updated"}
              {" "}
              {updatedText}
            </span>
          )}
        </>
      ) : (
        <div className="jcs-weather-card__state">
          <div className="jcs-weather-card__state-icon">
            {isBusy ? (
              <RefreshCw
                className="jcs-weather-card__spinner"
                size={25}
                strokeWidth={1.7}
              />
            ) : (
              <LocateFixed
                size={25}
                strokeWidth={1.7}
              />
            )}
          </div>

          <div className="jcs-weather-card__state-copy">
            <span>
              {languageCode ===
                "es"
                ? "Clima local"
                : "Local weather"}
            </span>

            <strong>
              {status ===
                "locating"
                ? (
                    languageCode ===
                      "es"
                      ? "Buscando tu ubicación…"
                      : "Finding your location…"
                  )
                : status ===
                    "loading"
                  ? (
                      languageCode ===
                        "es"
                        ? "Cargando condiciones…"
                        : "Loading conditions…"
                    )
                  : status ===
                      "permission-denied"
                    ? (
                        languageCode ===
                          "es"
                          ? "Ubicación desactivada"
                          : "Location is disabled"
                      )
                    : status ===
                        "unsupported"
                      ? (
                          languageCode ===
                            "es"
                            ? "Ubicación no disponible"
                            : "Location unavailable"
                        )
                      : status ===
                          "error"
                        ? (
                            languageCode ===
                              "es"
                              ? "Clima no disponible"
                              : "Weather unavailable"
                          )
                        : (
                            languageCode ===
                              "es"
                              ? "Ver clima actual"
                              : "View current weather"
                          )}
            </strong>

            <small>
              {errorMessage ||
                (
                  languageCode ===
                    "es"
                    ? "Usaremos tu ubicación únicamente para consultar el clima."
                    : "Your location is used only to retrieve local weather."
                )}
            </small>
          </div>

          {!isBusy && (
            <button
              type="button"
              className="jcs-weather-card__location-button"
              onClick={() => {
                void loadWeather();
              }}
            >
              <LocateFixed
                size={15}
                strokeWidth={1.8}
              />

              <span>
                {languageCode ===
                  "es"
                  ? "Usar mi ubicación"
                  : "Use my location"}
              </span>
            </button>
          )}
        </div>
      )}
    </section>
  );
}
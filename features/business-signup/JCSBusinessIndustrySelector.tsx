"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  allCategories,
  type BusinessModeCategory,
  type BusinessModeOption,
} from "@/core/business-mode/BusinessModeLibrary";

import "./JCSBusinessIndustrySelector.css";

export interface JCSBusinessIndustrySelection {
  businessModeKey: string;
  businessModeName: string;

  industryCategoryKey: string;
  industryCategoryTitle: string;

  icon?: string;
  emoji?: string;

  recommendedModules: string[];
}

export interface JCSBusinessIndustrySelectorProps {
  selected:
    JCSBusinessIndustrySelection | null;

  onChange: (
    selection:
      JCSBusinessIndustrySelection | null,
  ) => void;

  disabled?: boolean;
  errorMessage?: string;
}

function clean(
  value: string,
): string {
  return value.trim();
}

function emojiForIndustry(
  title: string,
): string {
  const value =
    title.toLowerCase();

  if (
    value.includes("technology") ||
    value.includes("digital")
  ) {
    return "💻";
  }

  if (
    value.includes("retail") ||
    value.includes("commerce")
  ) {
    return "🛍️";
  }

  if (
    value.includes("food") ||
    value.includes("restaurant") ||
    value.includes("hospitality")
  ) {
    return "🍽️";
  }

  if (
    value.includes("health") ||
    value.includes("medical")
  ) {
    return "🏥";
  }

  if (
    value.includes("construction")
  ) {
    return "🏗️";
  }

  if (
    value.includes("transport") ||
    value.includes("logistics")
  ) {
    return "🚚";
  }

  if (
    value.includes("automotive")
  ) {
    return "🚗";
  }

  if (
    value.includes("professional")
  ) {
    return "💼";
  }

  if (
    value.includes("beauty")
  ) {
    return "✨";
  }

  if (
    value.includes("education")
  ) {
    return "🎓";
  }

  if (
    value.includes("real estate")
  ) {
    return "🏠";
  }

  if (
    value.includes("financial") ||
    value.includes("finance")
  ) {
    return "💳";
  }

  if (
    value.includes("manufactur")
  ) {
    return "🏭";
  }

  return "🏢";
}

/*
 * Apple parity:
 *
 * BusinessModeLibrary.categories
 * → Search category.title OR mode.name
 * → category accordion
 * → adaptive mode chips
 * → selected business type card
 * → Change clears selection/search/category state
 */
export default function
JCSBusinessIndustrySelector({
  selected,
  onChange,
  disabled = false,
  errorMessage = "",
}: JCSBusinessIndustrySelectorProps) {

  const [
    industrySearchText,
    setIndustrySearchText,
  ] = useState("");

  const [
    selectedCategoryKey,
    setSelectedCategoryKey,
  ] = useState<string | null>(
    selected?.industryCategoryKey ??
      null,
  );

  const filteredCategories =
    useMemo<BusinessModeCategory[]>(
      () => {
        const search =
          clean(
            industrySearchText,
          ).toLowerCase();

        /*
         * Exact Apple behavior:
         * empty search → complete library.
         */
        if (!search) {
          return allCategories;
        }

        return allCategories
          .map((category) => {
            const categoryMatches =
              category.title
                .toLowerCase()
                .includes(search);

            const matchingModes =
              category.modes.filter(
                (mode) =>
                  mode.name
                    .toLowerCase()
                    .includes(search),
              );

            if (
              !categoryMatches &&
              matchingModes.length === 0
            ) {
              return null;
            }

            /*
             * Exact Apple behavior:
             *
             * Category title match
             * → preserve every mode.
             *
             * Mode-name match
             * → show matching modes only.
             */
            return {
              ...category,

              modes:
                categoryMatches
                  ? category.modes
                  : matchingModes,
            };
          })
          .filter(
            (
              category,
            ): category is BusinessModeCategory =>
              category !== null,
          );
      },
      [
        industrySearchText,
      ],
    );

  function selectMode(
    category:
      BusinessModeCategory,
    mode:
      BusinessModeOption,
  ) {
    if (disabled) {
      return;
    }

    const selection:
      JCSBusinessIndustrySelection = {
        businessModeKey:
          mode.id,

        businessModeName:
          mode.name,

        industryCategoryKey:
          category.id,

        industryCategoryTitle:
          category.title,

        icon:
          mode.icon ||
          category.icon,

        emoji:
          emojiForIndustry(
            category.title,
          ),

        recommendedModules:
          [
            ...(
              mode.recommendedModules ??
              []
            ),
          ],
      };

    onChange(selection);

    setIndustrySearchText("");

    setSelectedCategoryKey(
      category.id,
    );
  }

  function clearSelection() {
    if (disabled) {
      return;
    }

    onChange(null);

    setIndustrySearchText("");

    setSelectedCategoryKey(null);
  }

  return (
    <section
      className="jcs-industry-selector"
      aria-label={
        selected
          ? "Industry and Business Type"
          : "Choose Industry"
      }
    >
      <div className="jcs-industry-selector__heading">
        <div>
          <p className="jcs-industry-selector__eyebrow">
            Business configuration
          </p>

          <h2>
            {selected
              ? "Industry & Business Type"
              : "Choose Industry"}
          </h2>
        </div>

        <span
          className="jcs-industry-selector__heading-icon"
          aria-hidden="true"
        >
          🧩
        </span>
      </div>

      {selected ? (
        <article className="jcs-industry-selector__selected">
          <span
            className="jcs-industry-selector__selected-icon"
            aria-hidden="true"
          >
            ✓
          </span>

          <div className="jcs-industry-selector__selected-copy">
            <small>
              Selected Business Type
            </small>

            <strong>
              {selected.businessModeName}
            </strong>

            <span>
              {
                selected
                  .industryCategoryTitle
              }
            </span>
          </div>

          <button
            type="button"
            className="jcs-industry-selector__change"
            onClick={
              clearSelection
            }
            disabled={
              disabled
            }
          >
            Change
          </button>
        </article>
      ) : (
        <>
          <div className="jcs-industry-selector__search">
            <span aria-hidden="true">
              🔎
            </span>

            <input
              type="search"
              value={
                industrySearchText
              }
              onChange={
                (event) =>
                  setIndustrySearchText(
                    event.target.value,
                  )
              }
              placeholder="Search Industry"
              aria-label="Search Industry"
              disabled={
                disabled
              }
            />

            {industrySearchText ? (
              <button
                type="button"
                onClick={() =>
                  setIndustrySearchText(
                    "",
                  )
                }
                aria-label="Clear industry search"
                disabled={
                  disabled
                }
              >
                ×
              </button>
            ) : null}
          </div>

          {errorMessage ? (
            <p
              className="jcs-industry-selector__error"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}

          <div className="jcs-industry-selector__list">
            {filteredCategories.length >
            0 ? (
              filteredCategories.map(
                (category) => {
                  const expanded =
                    selectedCategoryKey ===
                      category.id ||
                    Boolean(
                      clean(
                        industrySearchText,
                      ),
                    );

                  return (
                    <article
                      key={
                        category.id
                      }
                      className="jcs-industry-selector__category"
                    >
                      <button
                        type="button"
                        className="jcs-industry-selector__category-header"
                        onClick={() => {
                          if (
                            disabled
                          ) {
                            return;
                          }

                          setSelectedCategoryKey(
                            expanded
                              ? null
                              : category.id,
                          );
                        }}
                        aria-expanded={
                          expanded
                        }
                        disabled={
                          disabled
                        }
                      >
                        <span
                          className="jcs-industry-selector__emoji"
                          aria-hidden="true"
                        >
                          {
                            emojiForIndustry(
                              category.title,
                            )
                          }
                        </span>

                        <span className="jcs-industry-selector__category-copy">
                          <strong>
                            {
                              category.title
                            }
                          </strong>

                          <small>
                            {
                              category
                                .modes
                                .length
                            }{" "}
                            business{" "}
                            {
                              category
                                .modes
                                .length ===
                              1
                                ? "type"
                                : "types"
                            }
                          </small>
                        </span>

                        <span
                          className={[
                            "jcs-industry-selector__chevron",
                            expanded
                              ? "jcs-industry-selector__chevron--expanded"
                              : "",
                          ]
                            .filter(
                              Boolean,
                            )
                            .join(" ")}
                          aria-hidden="true"
                        >
                          ⌄
                        </span>
                      </button>

                      {expanded ? (
                        <div className="jcs-industry-selector__mode-grid">
                          {
                            category
                              .modes
                              .map(
                                (
                                  mode,
                                ) => (
                                  <button
                                    key={
                                      mode.id
                                    }
                                    type="button"
                                    className="jcs-industry-selector__mode"
                                    onClick={() =>
                                      selectMode(
                                        category,
                                        mode,
                                      )
                                    }
                                    disabled={
                                      disabled
                                    }
                                  >
                                    {
                                      mode.name
                                    }
                                  </button>
                                ),
                              )
                          }
                        </div>
                      ) : null}
                    </article>
                  );
                },
              )
            ) : (
              <div className="jcs-industry-selector__empty">
                <span aria-hidden="true">
                  🔍
                </span>

                <strong>
                  No matching business type
                </strong>

                <p>
                  Try another search term or
                  clear the search to see every
                  available category.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setIndustrySearchText(
                      "",
                    )
                  }
                >
                  Show all industries
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

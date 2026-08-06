"use client";

import {
  JCSBusinessRegistrationManager,
} from "@/core/business-core/registration/JCSBusinessRegistrationManager";
import "./BusinessSignUpView.css";

import "@/core/business-core/creation/BusinessCreationEngine";

import {
  type CSSProperties,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// MARK: - Signup Steps

export type BusinessSignUpStep =
  | "welcome"
  | "business"
  | "industry"
  | "owner"
  | "success";

// MARK: - Incoming Platform Invitation

export interface JCSIncomingBusinessInvitation {
  invitationID?: string;
  platformClientID?: string;

  invitationCode?: string;
  normalizedInvitationCode?: string;

  prospectFullName?: string;
  prospectEmail?: string;
  prospectPhone?: string;
  prospectiveBusinessName?: string;

  status?: string;
}

// MARK: - Business Mode Library Types

export interface BusinessSignUpIndustryMode {
  /**
   * Stable identifier stored in Firebase.
   *
   * Example:
   * "restaurant"
   * "auto-repair-shop"
   * "trucking-company"
   */
  key: string;

  /**
   * Human-readable title shown in the interface.
   *
   * Example:
   * "Restaurant"
   * "Auto Repair Shop"
   * "Trucking Company"
   */
  name: string;

  description?: string;
  icon?: string;

  recommendedModules: string[],
}

export interface BusinessSignUpIndustryCategory {
  /**
   * Stable category identifier.
   *
   * Example:
   * "restaurants-food-service"
   * "automotive"
   * "transportation-logistics"
   */
  key: string;

  title: string;
  icon?: string;
  emoji?: string;

  modes: BusinessSignUpIndustryMode[];
}

// MARK: - Selected Business Mode

export interface BusinessSignUpModeSelection {
  businessModeKey: string;
  businessModeName: string;

  industryCategoryKey: string;
  industryCategoryTitle: string;

  icon?: string;
  emoji?: string;

  recommendedModules: string[],
}

// MARK: - Registration Progress

export type BusinessRegistrationStage =
  | "idle"
  | "validating"
  | "resolvingConfiguration"
  | "creatingAuthentication"
  | "creatingBusiness"
  | "creatingBusinessOwner"
  | "creatingAppSettings"
  | "creatingPlatformClient"
  | "creatingBusinessDNA"
  | "provisioningWorkspace"
  | "generatingLogo"
  | "completingInvitation"
  | "finalizing"
  | "completed"
  | "failed"
  | "cancelled";

export interface BusinessRegistrationProgress {
  stage: BusinessRegistrationStage;
  percentage: number;
  message: string;
}

// MARK: - Registration Success Result

export interface BusinessSignUpSuccessResult {
  businessID: string;
  ownerUID: string;
  firebaseUID: string;

  businessName: string;

  industryCategoryKey: string;
  industryCategoryTitle: string;

  businessModeKey: string;
  businessModeName: string;

  businessInviteCode?: string;
  platformInvitationCode?: string;

  planName: string;
  trialLengthDays: number;

  generatedLogoFileName?: string;

  logoStatus?:
    | "pending"
    | "ready"
    | "fallback"
    | "failed";

  nextRoute?: string;
}

// MARK: - Form State

export interface BusinessSignUpFormState {
  businessName: string;
  businessPhone: string;
  website: string;

  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;

  selectedMode: BusinessSignUpModeSelection | null;
}

// MARK: - Field Errors

export type BusinessSignUpFieldName =
  | "businessName"
  | "businessPhone"
  | "website"
  | "industry"
  | "fullName"
  | "email"
  | "password"
  | "confirmPassword";

export type BusinessSignUpFieldErrors = Partial<
  Record<BusinessSignUpFieldName, string>
>;

// MARK: - Component Properties

export interface BusinessSignUpViewProps {
  incomingInvitation?: JCSIncomingBusinessInvitation | null;
  

  /**
   * These categories will come from BusinessModeLibrary.ts.
   *
   * BusinessSignUpView must never maintain its own duplicate
   * industry library.
   */
  industryCategories: BusinessSignUpIndustryCategory[];

  onInvitationOpened?: (
    invitation: JCSIncomingBusinessInvitation
  ) => void | Promise<void>;

  onSignUpSuccess?: (
    result: BusinessSignUpSuccessResult
  ) => void | Promise<void>;

  onBackToLogin?: () => void;
  onClose?: () => void;
  onOpenMigrationWizard?: () => void;

  dashboardRoute?: string;
}

// MARK: - Initial State

const INITIAL_FORM_STATE: BusinessSignUpFormState = {
  businessName: "",
  businessPhone: "",
  website: "",

  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",

  selectedMode: null,
};

const INITIAL_REGISTRATION_PROGRESS: BusinessRegistrationProgress = {
  stage: "idle",
  percentage: 0,
  message: "",
};

// MARK: - Step Configuration

const BUSINESS_SIGNUP_STEPS: readonly BusinessSignUpStep[] = [
  "welcome",
  "business",
  "industry",
  "owner",
  "success",
];

const STEP_PROGRESS: Readonly<
  Record<BusinessSignUpStep, number>
> = {
  welcome: 10,
  business: 30,
  industry: 55,
  owner: 80,
  success: 100,
};

const STEP_TITLES: Readonly<
  Record<BusinessSignUpStep, string>
> = {
  welcome: "Welcome to JCS",
  business: "Business Setup",
  industry: "Choose Industry",
  owner: "Owner Account",
  success: "Business Created",
};

const STEP_SUBTITLES: Readonly<
  Record<BusinessSignUpStep, string>
> = {
  welcome:
    "Create your workspace in a few simple steps.",

  business:
    "Tell us the basic information about your business.",

  industry:
    "Pick the workflow that best matches your company.",

  owner:
    "Create the main owner account for this business.",

  success:
    "Your trial is active and your dashboard is ready.",
};

const STEP_LABELS: Readonly<
  Record<BusinessSignUpStep, string>
> = {
  welcome: "Step 1 of 5",
  business: "Step 2 of 5",
  industry: "Step 3 of 5",
  owner: "Step 4 of 5",
  success: "Step 5 of 5",
};

const PRIMARY_BUTTON_TITLES: Readonly<
  Record<BusinessSignUpStep, string>
> = {
  welcome: "Get Started",
  business: "Continue",
  industry: "Continue",
  owner: "Create Business",
  success: "Go to Dashboard",
};

// MARK: - Text Normalization

function cleanText(
  value: string | null | undefined
): string {
  return value?.trim() ?? "";
}

function normalizeEmail(value: string): string {
  return cleanText(value).toLowerCase();
}

function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

function normalizeInvitationCode(
  value: string | null | undefined
): string {
  return cleanText(value).toUpperCase();
}

function normalizeWebsite(value: string): string {
  const website = cleanText(value);

  if (!website) {
    return "";
  }

  if (
    website.startsWith("https://") ||
    website.startsWith("http://")
  ) {
    return website;
  }

  return `https://${website}`;
}

// MARK: - Validation Helpers

function isValidEmail(value: string): boolean {
  const email = normalizeEmail(value);

  if (!email) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidWebsite(value: string): boolean {
  const website = cleanText(value);

  if (!website) {
    return true;
  }

  try {
    const normalized = normalizeWebsite(website);
    const url = new URL(normalized);

    return Boolean(url.hostname);
  } catch {
    return false;
  }
}

// MARK: - Invitation Helpers

function invitationCodeFrom(
  invitation?: JCSIncomingBusinessInvitation | null
): string {
  return normalizeInvitationCode(
    invitation?.normalizedInvitationCode ||
      invitation?.invitationCode
  );
}

function invitationFullNameFrom(
  invitation?: JCSIncomingBusinessInvitation | null
): string {
  return cleanText(invitation?.prospectFullName);
}

function invitationEmailFrom(
  invitation?: JCSIncomingBusinessInvitation | null
): string {
  return normalizeEmail(
    invitation?.prospectEmail ?? ""
  );
}

function invitationPhoneFrom(
  invitation?: JCSIncomingBusinessInvitation | null
): string {
  return normalizePhone(
    invitation?.prospectPhone ?? ""
  );
}

function invitationBusinessNameFrom(
  invitation?: JCSIncomingBusinessInvitation | null
): string {
  return cleanText(
    invitation?.prospectiveBusinessName
  );
}

// MARK: - Industry Helpers

function slugFromTitle(value: string): string {
  return cleanText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function emojiForIndustry(title: string): string {
  const clean = title.toLowerCase();

  if (clean.includes("retail")) {
    return "🏪";
  }

  if (
    clean.includes("restaurant") ||
    clean.includes("food")
  ) {
    return "🍔";
  }

  if (
    clean.includes("beauty") ||
    clean.includes("personal care")
  ) {
    return "💇";
  }

  if (
    clean.includes("medical") ||
    clean.includes("health")
  ) {
    return "🩺";
  }

  if (
    clean.includes("construction") ||
    clean.includes("trade")
  ) {
    return "🏗️";
  }

  if (
    clean.includes("transportation") ||
    clean.includes("logistics")
  ) {
    return "🚚";
  }

  if (clean.includes("automotive")) {
    return "🚗";
  }

  if (
    clean.includes("professional") ||
    clean.includes("consulting")
  ) {
    return "💼";
  }

  if (clean.includes("engineering")) {
    return "📐";
  }

  if (
    clean.includes("real estate") ||
    clean.includes("property")
  ) {
    return "🏠";
  }

  if (
    clean.includes("technology") ||
    clean.includes("digital")
  ) {
    return "💻";
  }

  if (clean.includes("education")) {
    return "🎓";
  }

  if (
    clean.includes("fitness") ||
    clean.includes("sports")
  ) {
    return "🏋️";
  }

  if (
    clean.includes("creative") ||
    clean.includes("media")
  ) {
    return "🎥";
  }

  if (
    clean.includes("event") ||
    clean.includes("entertainment")
  ) {
    return "🎉";
  }

  if (
    clean.includes("hospitality") ||
    clean.includes("travel")
  ) {
    return "🏨";
  }

  if (
    clean.includes("industrial") ||
    clean.includes("manufacturing")
  ) {
    return "🏭";
  }

  if (
    clean.includes("agriculture") ||
    clean.includes("farming")
  ) {
    return "🌱";
  }

  if (
    clean.includes("nonprofit") ||
    clean.includes("community")
  ) {
    return "❤️";
  }

  if (
    clean.includes("online") ||
    clean.includes("e-commerce")
  ) {
    return "🌐";
  }

  return "✨";
}

// MARK: - Step Navigation Helpers

function stepIndex(
  step: BusinessSignUpStep
): number {
  return BUSINESS_SIGNUP_STEPS.indexOf(step);
}

function previousStepFrom(
  currentStep: BusinessSignUpStep
): BusinessSignUpStep {
  const currentIndex = stepIndex(currentStep);

  if (currentIndex <= 0) {
    return "welcome";
  }

  return BUSINESS_SIGNUP_STEPS[
    currentIndex - 1
  ];
}

function nextStepFrom(
  currentStep: BusinessSignUpStep
): BusinessSignUpStep {
  const currentIndex = stepIndex(currentStep);

  if (
    currentIndex < 0 ||
    currentIndex >=
      BUSINESS_SIGNUP_STEPS.length - 1
  ) {
    return currentStep;
  }

  return BUSINESS_SIGNUP_STEPS[
    currentIndex + 1
  ];
}

// MARK: - Main View

export default function BusinessSignUpView({
  incomingInvitation = null,
  industryCategories,

  onInvitationOpened,
  onSignUpSuccess,

  onBackToLogin,
  onClose,
  onOpenMigrationWizard,

  dashboardRoute = "/dashboard",
}: BusinessSignUpViewProps) {
  // MARK: Current Step

  const [step, setStep] =
    useState<BusinessSignUpStep>("welcome");

  // MARK: Form State

  const [form, setForm] =
    useState<BusinessSignUpFormState>(
      INITIAL_FORM_STATE
    );

  const [fieldErrors, setFieldErrors] =
    useState<BusinessSignUpFieldErrors>({});

  // MARK: Industry State

  const [
    industrySearchText,
    setIndustrySearchText,
  ] = useState("");

  const [
    expandedCategoryKey,
    setExpandedCategoryKey,
  ] = useState<string | null>(null);

  // MARK: Invitation State

  const [
    activePlatformInvitationCode,
    setActivePlatformInvitationCode,
  ] = useState("");

  const hasAppliedIncomingInvitationRef =
  useRef(false);

  // MARK: Registration State

  const [
    isCreatingBusiness,
    setIsCreatingBusiness,
  ] = useState(false);

  const [
    registrationProgress,
    setRegistrationProgress,
  ] = useState<BusinessRegistrationProgress>(
    INITIAL_REGISTRATION_PROGRESS
  );

  const [
    registrationResult,
    setRegistrationResult,
  ] = useState<BusinessSignUpSuccessResult | null>(
    null
  );

  const [
    registrationError,
    setRegistrationError,
  ] = useState("");

  

  // MARK: Notice State

  const [noticeMessage, setNoticeMessage] =
    useState("");

  const [isNoticeVisible, setIsNoticeVisible] =
    useState(false);

  const noticeTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const registrationAbortControllerRef =
    useRef<AbortController | null>(null);

  // MARK: Derived Step Values

  const progressValue = STEP_PROGRESS[step];

  const currentStepTitle =
    STEP_TITLES[step];

  const currentStepSubtitle =
    STEP_SUBTITLES[step];

  const currentStepLabel =
    STEP_LABELS[step];

  const primaryButtonTitle =
    PRIMARY_BUTTON_TITLES[step];

  // MARK: Derived Selection Values

  const selectedMode = form.selectedMode;

  const selectedBusinessModeKey =
    selectedMode?.businessModeKey ?? "";

  const selectedBusinessModeName =
    selectedMode?.businessModeName ?? "";

  const selectedIndustryCategoryKey =
    selectedMode?.industryCategoryKey ?? "";

  const selectedIndustryCategoryTitle =
    selectedMode?.industryCategoryTitle ?? "";

  // MARK: Normalize Business Mode Library

  const normalizedIndustryCategories =
    useMemo<BusinessSignUpIndustryCategory[]>(
      () => {
        return industryCategories.map(
          (category) => {
            const categoryKey =
              cleanText(category.key) ||
              slugFromTitle(category.title);

            return {
              ...category,

              key: categoryKey,

              emoji:
                category.emoji ||
                emojiForIndustry(
                  category.title
                ),

              modes: category.modes.map(
                (mode) => ({
                  ...mode,

                  key:
                    cleanText(mode.key) ||
                    slugFromTitle(mode.name),

                  recommendedModules:
                    mode.recommendedModules ?? [],
                })
              ),
            };
          }
        );
      },
      [industryCategories]
    );

  // MARK: Search Filtering

  const filteredIndustryCategories =
    useMemo<BusinessSignUpIndustryCategory[]>(
      () => {
        const search = industrySearchText
          .trim()
          .toLowerCase();

        if (!search) {
          return normalizedIndustryCategories;
        }

        return normalizedIndustryCategories
          .map((category) => {
            const categoryMatches =
              category.title
                .toLowerCase()
                .includes(search);

            const matchingModes =
              category.modes.filter((mode) => {
                const nameMatches =
                  mode.name
                    .toLowerCase()
                    .includes(search);

                const descriptionMatches =
                  mode.description
                    ?.toLowerCase()
                    .includes(search) ??
                  false;

                return (
                  nameMatches ||
                  descriptionMatches
                );
              });

            if (
              !categoryMatches &&
              matchingModes.length === 0
            ) {
              return null;
            }

            return {
              ...category,

              modes: categoryMatches
                ? category.modes
                : matchingModes,
            };
          })
          .filter(
            (
              category
            ): category is BusinessSignUpIndustryCategory =>
              category !== null
          );
      },
      [
        industrySearchText,
        normalizedIndustryCategories,
      ]
    );

  // MARK: Busy State

  const isBusy =
    isCreatingBusiness ||
    registrationProgress.stage ===
      "finalizing";

  const canGoBack =
    step !== "welcome" &&
    step !== "success" &&
    !isBusy;

  // MARK: Generic Field Update

  const updateField = useCallback(
    <
      Field extends Exclude<
        keyof BusinessSignUpFormState,
        "selectedMode"
      >
    >(
      field: Field,
      value: BusinessSignUpFormState[Field]
    ) => {
      setForm((current) => ({
        ...current,
        [field]: value,
      }));

      setFieldErrors((current) => {
        const errorField =
          field as BusinessSignUpFieldName;

        if (!current[errorField]) {
          return current;
        }

        const nextErrors = {
          ...current,
        };

        delete nextErrors[errorField];

        return nextErrors;
      });
    },
    []
  );

  // MARK: Warning Notice

  const showNotice = useCallback(
    (message: string) => {
      if (noticeTimerRef.current) {
        clearTimeout(
          noticeTimerRef.current
        );
      }

      setNoticeMessage(message);
      setIsNoticeVisible(true);

      noticeTimerRef.current =
        setTimeout(() => {
          setIsNoticeVisible(false);
        }, 2_800);
    },
    []
  );

// MARK: Apply Incoming Invitation

useEffect(() => {
  if (
    hasAppliedIncomingInvitationRef.current ||
    !incomingInvitation
  ) {
    return;
  }

  const invitationCode =
    invitationCodeFrom(
      incomingInvitation
    );

  if (!invitationCode) {
    return;
  }

  hasAppliedIncomingInvitationRef.current = true;

  let isCancelled = false;

  queueMicrotask(() => {
    if (isCancelled) {
      return;
    }

    setActivePlatformInvitationCode(
      invitationCode
    );

    setForm((current) => ({
      ...current,

      fullName:
        cleanText(current.fullName) ||
        invitationFullNameFrom(
          incomingInvitation
        ),

      email:
        normalizeEmail(current.email) ||
        invitationEmailFrom(
          incomingInvitation
        ),

      businessPhone:
        normalizePhone(
          current.businessPhone
        ) ||
        invitationPhoneFrom(
          incomingInvitation
        ),

      businessName:
        cleanText(current.businessName) ||
        invitationBusinessNameFrom(
          incomingInvitation
        ),
    }));

    if (onInvitationOpened) {
      void Promise.resolve(
        onInvitationOpened(
          incomingInvitation
        )
      ).catch((error: unknown) => {
        console.error(
          "❌ Business invitation open error:",
          error
        );
      });
    }
  });

  return () => {
    isCancelled = true;
  };
}, [
  incomingInvitation,
  onInvitationOpened,
]);

  // MARK: Cleanup

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) {
        clearTimeout(
          noticeTimerRef.current
        );
      }

      registrationAbortControllerRef
        .current
        ?.abort();
    };
  }, []);

  // MARK: Business Step Validation

  const validateBusinessStep =
    useCallback((): boolean => {
      const businessName = cleanText(
        form.businessName
      );

      const website = cleanText(
        form.website
      );

      const nextErrors: BusinessSignUpFieldErrors =
        {};

      if (!businessName) {
        nextErrors.businessName =
          "Business name is required.";
      }

      if (
        website &&
        !isValidWebsite(website)
      ) {
        nextErrors.website =
          "Enter a valid website.";
      }

      setFieldErrors((current) => ({
        ...current,
        ...nextErrors,
      }));

      const firstError =
        nextErrors.businessName ||
        nextErrors.website;

      if (firstError) {
        showNotice(firstError);
        return false;
      }

      return true;
    }, [
      form.businessName,
      form.website,
      showNotice,
    ]);

  // MARK: Industry Step Validation

  const validateIndustryStep =
    useCallback((): boolean => {
      if (
        !selectedBusinessModeKey ||
        !selectedIndustryCategoryTitle
      ) {
        setFieldErrors((current) => ({
          ...current,

          industry:
            "Please select a business type.",
        }));

        showNotice(
          "Please select a business type."
        );

        return false;
      }

      return true;
    }, [
      selectedBusinessModeKey,
      selectedIndustryCategoryTitle,
      showNotice,
    ]);

  // MARK: Owner Step Validation

  const validateOwnerStep =
    useCallback((): boolean => {
      const fullName = cleanText(
        form.fullName
      );

      const email = normalizeEmail(
        form.email
      );

      const nextErrors: BusinessSignUpFieldErrors =
        {};

      if (!fullName) {
        nextErrors.fullName =
          "Full name is required.";
      }

      if (!isValidEmail(email)) {
        nextErrors.email =
          "Enter a valid email address.";
      }

      if (form.password.length < 6) {
        nextErrors.password =
          "Password must be at least 6 characters.";
      }

      if (
        form.password !==
        form.confirmPassword
      ) {
        nextErrors.confirmPassword =
          "Passwords do not match.";
      }

      setFieldErrors((current) => ({
        ...current,
        ...nextErrors,
      }));

      const firstError =
        nextErrors.fullName ||
        nextErrors.email ||
        nextErrors.password ||
        nextErrors.confirmPassword;

      if (firstError) {
        showNotice(firstError);
        return false;
      }

      return true;
    }, [
      form.confirmPassword,
      form.email,
      form.fullName,
      form.password,
      showNotice,
    ]);

  // MARK: Complete Validation

  const validateAllSteps =
    useCallback((): boolean => {
      return (
        validateBusinessStep() &&
        validateIndustryStep() &&
        validateOwnerStep()
      );
    }, [
      validateBusinessStep,
      validateIndustryStep,
      validateOwnerStep,
    ]);

  // MARK: Select Business Mode

  const selectBusinessMode =
    useCallback(
      (
        category:
          BusinessSignUpIndustryCategory,

        mode:
          BusinessSignUpIndustryMode
      ) => {
        setForm((current) => ({
          ...current,

          selectedMode: {
            businessModeKey: mode.key,
            businessModeName: mode.name,

            industryCategoryKey:
              category.key,

            industryCategoryTitle:
              category.title,

            icon:
              mode.icon ||
              category.icon,

            emoji:
              category.emoji ||
              emojiForIndustry(
                category.title
              ),

            recommendedModules:
              mode.recommendedModules ??
              [],
          },
        }));

        setIndustrySearchText("");
        setExpandedCategoryKey(null);

        setFieldErrors((current) => {
          if (!current.industry) {
            return current;
          }

          const nextErrors = {
            ...current,
          };

          delete nextErrors.industry;

          return nextErrors;
        });
      },
      []
    );

  // MARK: Clear Business Mode

  const clearBusinessModeSelection =
    useCallback(() => {
      setForm((current) => ({
        ...current,
        selectedMode: null,
      }));

      setIndustrySearchText("");
      setExpandedCategoryKey(null);
    }, []);

  // MARK: Previous Step

  const goToPreviousStep =
    useCallback(() => {
      if (!canGoBack) {
        return;
      }

      setStep((current) =>
        previousStepFrom(current)
      );
    }, [canGoBack]);

  // MARK: Close

  const handleClose =
    useCallback(() => {
      if (isBusy) {
        showNotice(
          "Please wait while your workspace is being prepared."
        );

        return;
      }

      onClose?.();
    }, [
      isBusy,
      onClose,
      showNotice,
    ]);

  // MARK: Back to Login

  const handleBackToLogin =
    useCallback(() => {
      if (isBusy) {
        showNotice(
          "Please wait while your workspace is being prepared."
        );

        return;
      }

      onBackToLogin?.();
    }, [
      isBusy,
      onBackToLogin,
      showNotice,
    ]);

  // MARK: Create Business Placeholder

  const createBusiness =
    useCallback(async (): Promise<void> => {
      if (!validateAllSteps()) {
        return;
      }

      setRegistrationError("");
      setIsCreatingBusiness(true);

      setRegistrationProgress({
        stage: "validating",
        percentage: 5,
        message:
          "Validating your business information...",
      });

      try {
        registrationAbortControllerRef
          .current
          ?.abort();

        const abortController =
          new AbortController();

        registrationAbortControllerRef.current =
          abortController;

        const result =
  await JCSBusinessRegistrationManager.registerBusiness(
    {
      businessName:
        form.businessName,

      businessPhone:
        form.businessPhone,

      website:
        form.website,

      ownerFullName:
        form.fullName,

      ownerEmail:
        form.email,

      password:
        form.password,

      ownerPhone:
      normalizePhone(
        form.businessPhone
      ),

      industryCategoryKey:
        selectedIndustryCategoryKey,

      industryCategoryTitle:
        selectedIndustryCategoryTitle,

      businessModeKey:
        selectedBusinessModeKey,

      businessModeName:
        selectedBusinessModeName,

      recommendedModules:
        selectedMode?.recommendedModules ?? [],

      platformInvitationCode:
        activePlatformInvitationCode ||
        undefined,

      localeIdentifier:
        navigator.language ||
        "en-US",

      timeZoneIdentifier:
        Intl.DateTimeFormat()
          .resolvedOptions()
          .timeZone ||
        "America/New_York",

      signal:
        abortController.signal,
    },
    (progress) => {
      setRegistrationProgress(
        progress
      );
    }
  );

setRegistrationResult(result);

setRegistrationProgress({
  stage: "completed",
  percentage: 100,
  message:
    "Your business workspace is ready.",
});

setStep("success");

showNotice(
  `${result.businessName} was created successfully.`
);
      } catch (error: unknown) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          setRegistrationProgress({
            stage: "cancelled",
            percentage: 0,
            message:
              "Business registration was cancelled.",
          });

          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Could not create the business.";

        setRegistrationError(message);

        setRegistrationProgress({
          stage: "failed",
          percentage: 0,
          message,
        });

        showNotice(message);
      } finally {
        setIsCreatingBusiness(false);
      }
    }, [
      activePlatformInvitationCode,
      form.businessName,
      form.businessPhone,
      form.email,
      form.fullName,
      form.password,
      form.website,
      selectedBusinessModeKey,
      selectedBusinessModeName,
      selectedIndustryCategoryKey,
      selectedIndustryCategoryTitle,
      selectedMode,
      showNotice,
      validateAllSteps,
    ]);

  // MARK: Primary Action

  const handlePrimaryAction =
    useCallback(async (): Promise<void> => {
      switch (step) {
        case "welcome":
          setStep("business");
          return;

        case "business":
          if (validateBusinessStep()) {
            setStep("industry");
          }
          return;

        case "industry":
          if (validateIndustryStep()) {
            setStep("owner");
          }
          return;

        case "owner":
          await createBusiness();
          return;

        case "success":
          if (
            registrationResult &&
            onSignUpSuccess
          ) {
            await onSignUpSuccess(
              registrationResult
            );

            return;
          }

          if (
            typeof window !==
            "undefined"
          ) {
            window.location.assign(
              registrationResult
                ?.nextRoute ||
                dashboardRoute
            );
          }

          return;
      }
    }, [
      createBusiness,
      dashboardRoute,
      onSignUpSuccess,
      registrationResult,
      step,
      validateBusinessStep,
      validateIndustryStep,
    ]);

      // MARK: - Form Submission

  const handleFormSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      void handlePrimaryAction();
    },
    [handlePrimaryAction]
  );

  // MARK: - Step Content

  const stepContent = useMemo(() => {
    switch (step) {
      case "welcome":
        return (
          <section
            className="jcs-business-signup__step jcs-business-signup__welcome-step"
            aria-labelledby="business-signup-welcome-title"
          >
    
            <div className="jcs-business-signup__welcome-icon">
              <span aria-hidden="true">✦</span>
            </div>

            <div className="jcs-business-signup__welcome-copy">
              <p className="jcs-business-signup__eyebrow">
                JCS Business Suite
              </p>

              <h2 id="business-signup-welcome-title">
                Build your business workspace
              </h2>

              <p>
                Create your secure business account, configure the
                correct tools for your industry, and prepare your
                workspace for customers, employees, inventory,
                payments, reports, and daily operations.
              </p>
            </div>

            <div className="jcs-business-signup__feature-grid">
              <article className="jcs-business-signup__feature-card">
                <span
                  className="jcs-business-signup__feature-icon"
                  aria-hidden="true"
                >
                  🏢
                </span>

                <div>
                  <h3>One business workspace</h3>

                  <p>
                    Manage your business from a unified and secure
                    platform.
                  </p>
                </div>
              </article>

              <article className="jcs-business-signup__feature-card">
                <span
                  className="jcs-business-signup__feature-icon"
                  aria-hidden="true"
                >
                  ⚙️
                </span>

                <div>
                  <h3>Configured for your industry</h3>

                  <p>
                    Your modules and operational tools are prepared
                    according to the business mode you select.
                  </p>
                </div>
              </article>

              <article className="jcs-business-signup__feature-card">
                <span
                  className="jcs-business-signup__feature-icon"
                  aria-hidden="true"
                >
                  🔐
                </span>

                <div>
                  <h3>Professional access control</h3>

                  <p>
                    Keep owners, managers, employees, and customers
                    inside the correct business context.
                  </p>
                </div>
              </article>

              <article className="jcs-business-signup__feature-card">
                <span
                  className="jcs-business-signup__feature-icon"
                  aria-hidden="true"
                >
                  🌐
                </span>

                <div>
                  <h3>Available everywhere</h3>

                  <p>
                    Use JCS Business Suite from desktop, tablet,
                    mobile, or any modern browser.
                  </p>
                </div>
              </article>
            </div>

            {activePlatformInvitationCode && (
              <aside className="jcs-business-signup__invitation-card">
                <div className="jcs-business-signup__invitation-icon">
                  <span aria-hidden="true">✉️</span>
                </div>

                <div>
                  <p className="jcs-business-signup__invitation-label">
                    Platform invitation detected
                  </p>

                  <strong>
                    {activePlatformInvitationCode}
                  </strong>

                  <p>
                    Your invitation information has been applied to
                    this registration.
                  </p>
                </div>
              </aside>
            )}

            {onOpenMigrationWizard && (
              <button
                type="button"
                className="jcs-business-signup__migration-button"
                onClick={onOpenMigrationWizard}
                disabled={isBusy}
              >
                <span aria-hidden="true">↗</span>

                <span>
                  Move an existing business to JCS Business Suite
                </span>
              </button>
            )}
          </section>
        );

      case "business":
        return (
          <section
            className="jcs-business-signup__step"
            aria-labelledby="business-signup-business-title"
          >
            <div className="jcs-business-signup__section-heading">
              <div>
                <p className="jcs-business-signup__eyebrow">
                  Business information
                </p>

                <h2 id="business-signup-business-title">
                  Tell us about your company
                </h2>

                <p>
                  This information identifies the business workspace
                  that will be created.
                </p>
              </div>

              <div
                className="jcs-business-signup__section-icon"
                aria-hidden="true"
              >
                🏢
              </div>
            </div>

            <div className="jcs-business-signup__field-grid">
              <div className="jcs-business-signup__field jcs-business-signup__field--wide">
                <label htmlFor="business-signup-business-name">
                  Business name
                  <span aria-hidden="true"> *</span>
                </label>

                <div
                  className={[
                    "jcs-business-signup__input-shell",
                    fieldErrors.businessName
                      ? "jcs-business-signup__input-shell--error"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span aria-hidden="true">🏢</span>

                  <input
                    id="business-signup-business-name"
                    name="businessName"
                    type="text"
                    autoComplete="organization"
                    placeholder="Example: Javier's Custom Software Design"
                    value={form.businessName}
                    onChange={(event) =>
                      updateField(
                        "businessName",
                        event.target.value
                      )
                    }
                    disabled={isBusy}
                    aria-invalid={Boolean(
                      fieldErrors.businessName
                    )}
                    aria-describedby={
                      fieldErrors.businessName
                        ? "business-name-error"
                        : undefined
                    }
                  />
                </div>

                {fieldErrors.businessName && (
                  <p
                    id="business-name-error"
                    className="jcs-business-signup__field-error"
                    role="alert"
                  >
                    {fieldErrors.businessName}
                  </p>
                )}
              </div>

              <div className="jcs-business-signup__field">
                <label htmlFor="business-signup-phone">
                  Business phone
                </label>

                <div className="jcs-business-signup__input-shell">
                  <span aria-hidden="true">☎️</span>

                  <input
                    id="business-signup-phone"
                    name="businessPhone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="Business phone number"
                    value={form.businessPhone}
                    onChange={(event) =>
                      updateField(
                        "businessPhone",
                        event.target.value
                      )
                    }
                    disabled={isBusy}
                  />
                </div>
              </div>

              <div className="jcs-business-signup__field">
                <label htmlFor="business-signup-website">
                  Website
                </label>

                <div
                  className={[
                    "jcs-business-signup__input-shell",
                    fieldErrors.website
                      ? "jcs-business-signup__input-shell--error"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span aria-hidden="true">🌐</span>

                  <input
                    id="business-signup-website"
                    name="website"
                    type="text"
                    autoComplete="url"
                    inputMode="url"
                    placeholder="www.yourbusiness.com"
                    value={form.website}
                    onChange={(event) =>
                      updateField(
                        "website",
                        event.target.value
                      )
                    }
                    disabled={isBusy}
                    aria-invalid={Boolean(fieldErrors.website)}
                    aria-describedby={
                      fieldErrors.website
                        ? "business-website-error"
                        : undefined
                    }
                  />
                </div>

                {fieldErrors.website && (
                  <p
                    id="business-website-error"
                    className="jcs-business-signup__field-error"
                    role="alert"
                  >
                    {fieldErrors.website}
                  </p>
                )}
              </div>
            </div>

            <aside className="jcs-business-signup__information-card">
              <span aria-hidden="true">💡</span>

              <div>
                <strong>Your business is not created yet</strong>

                <p>
                  The information remains only in this form until you
                  reach the Owner Account step and press Create
                  Business.
                </p>
              </div>
            </aside>
          </section>
        );

      case "industry":
        return (
          <section
            className="jcs-business-signup__step"
            aria-labelledby="business-signup-industry-title"
          >
            <div className="jcs-business-signup__section-heading">
              <div>
                <p className="jcs-business-signup__eyebrow">
                  Business configuration
                </p>

                <h2 id="business-signup-industry-title">
                  Select your business type
                </h2>

                <p>
                  JCS Business Suite will use this selection to
                  determine the correct configuration and recommended
                  modules.
                </p>
              </div>

              <div
                className="jcs-business-signup__section-icon"
                aria-hidden="true"
              >
                🧩
              </div>
            </div>

            {selectedMode ? (
              <article className="jcs-business-signup__selected-mode-card">
                <div className="jcs-business-signup__selected-mode-icon">
                  <span aria-hidden="true">
                    {selectedMode.emoji || "✨"}
                  </span>
                </div>

                <div className="jcs-business-signup__selected-mode-copy">
                  <p>Selected business type</p>

                  <h3>{selectedMode.businessModeName}</h3>

                  <span>
                    {selectedMode.industryCategoryTitle}
                  </span>
                </div>

                <button
                  type="button"
                  className="jcs-business-signup__change-mode-button"
                  onClick={clearBusinessModeSelection}
                  disabled={isBusy}
                >
                  Change
                </button>
              </article>
            ) : (
              <>
                <div className="jcs-business-signup__industry-search">
                  <span aria-hidden="true">🔎</span>

                  <input
                    type="search"
                    value={industrySearchText}
                    onChange={(event) =>
                      setIndustrySearchText(event.target.value)
                    }
                    placeholder="Search industries or business types"
                    aria-label="Search industries or business types"
                    disabled={isBusy}
                  />

                  {industrySearchText && (
                    <button
                      type="button"
                      onClick={() =>
                        setIndustrySearchText("")
                      }
                      aria-label="Clear industry search"
                      disabled={isBusy}
                    >
                      ×
                    </button>
                  )}
                </div>

                {fieldErrors.industry && (
                  <p
                    className="jcs-business-signup__field-error"
                    role="alert"
                  >
                    {fieldErrors.industry}
                  </p>
                )}

                <div className="jcs-business-signup__industry-list">
                  {filteredIndustryCategories.length > 0 ? (
                    filteredIndustryCategories.map((category) => {
                      const isExpanded =
                        expandedCategoryKey === category.key ||
                        Boolean(industrySearchText.trim());

                      return (
                        <article
                          key={category.key}
                          className="jcs-business-signup__industry-category"
                        >
                          <button
                            type="button"
                            className="jcs-business-signup__industry-category-header"
                            onClick={() =>
                              setExpandedCategoryKey((current) =>
                                current === category.key
                                  ? null
                                  : category.key
                              )
                            }
                            aria-expanded={isExpanded}
                            disabled={isBusy}
                          >
                            <span className="jcs-business-signup__industry-category-icon">
                              {category.emoji ||
                                emojiForIndustry(
                                  category.title
                                )}
                            </span>

                            <span className="jcs-business-signup__industry-category-copy">
                              <strong>{category.title}</strong>

                              <small>
                                {category.modes.length} business{" "}
                                {category.modes.length === 1
                                  ? "type"
                                  : "types"}
                              </small>
                            </span>

                            <span
                              className={[
                                "jcs-business-signup__industry-chevron",
                                isExpanded
                                  ? "jcs-business-signup__industry-chevron--expanded"
                                  : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                              aria-hidden="true"
                            >
                             ⌄
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="jcs-business-signup__mode-grid">
                              {category.modes.map((mode) => (
                                <button
                                  key={mode.key}
                                  type="button"
                                  className="jcs-business-signup__mode-card"
                                  onClick={() =>
                                    selectBusinessMode(
                                      category,
                                      mode
                                    )
                                  }
                                  disabled={isBusy}
                                >
                                  <span className="jcs-business-signup__mode-icon">
                                    {mode.icon ||
                                      category.emoji ||
                                      "✨"}
                                  </span>

                                  <span className="jcs-business-signup__mode-copy">
                                    <strong>{mode.name}</strong>

                                    {mode.description && (
                                      <small>
                                        {mode.description}
                                      </small>
                                    )}
                                  </span>

                                  <span
                                    className="jcs-business-signup__mode-select-indicator"
                                    aria-hidden="true"
                                  >
                                    →
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </article>
                      );
                    })
                  ) : (
                    <div className="jcs-business-signup__empty-state">
                      <span aria-hidden="true">🔍</span>

                      <h3>No matching business type</h3>

                      <p>
                        Try another search term or clear the search to
                        see every available category.
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          setIndustrySearchText("")
                        }
                      >
                        Show all industries
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {selectedMode && (
              <aside className="jcs-business-signup__module-preview">
                <div className="jcs-business-signup__module-preview-heading">
                  <div>
                    <p className="jcs-business-signup__eyebrow">
                      Workspace preview
                    </p>

                    <h3>Recommended modules</h3>
                  </div>

                  <span aria-hidden="true">⚙️</span>
                </div>

                <div className="jcs-business-signup__module-chip-list">
                  {selectedMode.recommendedModules.length > 0 ? (
                    selectedMode.recommendedModules.map((module) => (
                      <span
                        key={module}
                        className="jcs-business-signup__module-chip"
                      >
                        {module}
                      </span>
                    ))
                  ) : (
                    <>
                      <span className="jcs-business-signup__module-chip">
                        Dashboard
                      </span>

                      <span className="jcs-business-signup__module-chip">
                        Customers
                      </span>

                      <span className="jcs-business-signup__module-chip">
                        Orders
                      </span>

                      <span className="jcs-business-signup__module-chip">
                        Reports
                      </span>

                      <span className="jcs-business-signup__module-chip">
                        Settings
                      </span>
                    </>
                  )}
                </div>
              </aside>
            )}
          </section>
        );

      case "owner":
        return (
          <section
            className="jcs-business-signup__step"
            aria-labelledby="business-signup-owner-title"
          >
            <div className="jcs-business-signup__section-heading">
              <div>
                <p className="jcs-business-signup__eyebrow">
                  Business owner
                </p>

                <h2 id="business-signup-owner-title">
                  Create the owner account
                </h2>

                <p>
                  This will be the primary administrator account for{" "}
                  <strong>
                    {cleanText(form.businessName) ||
                      "your business"}
                  </strong>
                  .
                </p>
              </div>

              <div
                className="jcs-business-signup__section-icon"
                aria-hidden="true"
              >
                👤
              </div>
            </div>

            <div className="jcs-business-signup__owner-summary">
              <div>
                <span aria-hidden="true">
                  {selectedMode?.emoji || "🏢"}
                </span>

                <div>
                  <small>Business</small>

                  <strong>
                    {cleanText(form.businessName) ||
                      "Business name"}
                  </strong>
                </div>
              </div>

              <div>
                <small>Business type</small>

                <strong>
                  {selectedBusinessModeName ||
                    "Not selected"}
                </strong>
              </div>
            </div>

            <div className="jcs-business-signup__field-grid">
              <div className="jcs-business-signup__field jcs-business-signup__field--wide">
                <label htmlFor="business-signup-owner-name">
                  Full name
                  <span aria-hidden="true"> *</span>
                </label>

                <div
                  className={[
                    "jcs-business-signup__input-shell",
                    fieldErrors.fullName
                      ? "jcs-business-signup__input-shell--error"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span aria-hidden="true">👤</span>

                  <input
                    id="business-signup-owner-name"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="Owner's full name"
                    value={form.fullName}
                    onChange={(event) =>
                      updateField(
                        "fullName",
                        event.target.value
                      )
                    }
                    disabled={isBusy}
                    aria-invalid={Boolean(
                      fieldErrors.fullName
                    )}
                    aria-describedby={
                      fieldErrors.fullName
                        ? "owner-name-error"
                        : undefined
                    }
                  />
                </div>

                {fieldErrors.fullName && (
                  <p
                    id="owner-name-error"
                    className="jcs-business-signup__field-error"
                    role="alert"
                  >
                    {fieldErrors.fullName}
                  </p>
                )}
              </div>

              <div className="jcs-business-signup__field jcs-business-signup__field--wide">
                <label htmlFor="business-signup-owner-email">
                  Email address
                  <span aria-hidden="true"> *</span>
                </label>

                <div
                  className={[
                    "jcs-business-signup__input-shell",
                    fieldErrors.email
                      ? "jcs-business-signup__input-shell--error"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span aria-hidden="true">✉️</span>

                  <input
                    id="business-signup-owner-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="owner@business.com"
                    value={form.email}
                    onChange={(event) =>
                      updateField(
                        "email",
                        event.target.value
                      )
                    }
                    disabled={isBusy}
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={
                      fieldErrors.email
                        ? "owner-email-error"
                        : undefined
                    }
                  />
                </div>

                {fieldErrors.email && (
                  <p
                    id="owner-email-error"
                    className="jcs-business-signup__field-error"
                    role="alert"
                  >
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div className="jcs-business-signup__field">
                <label htmlFor="business-signup-password">
                  Password
                  <span aria-hidden="true"> *</span>
                </label>

                <div
                  className={[
                    "jcs-business-signup__input-shell",
                    fieldErrors.password
                      ? "jcs-business-signup__input-shell--error"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span aria-hidden="true">🔒</span>

                  <input
                    id="business-signup-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Minimum 6 characters"
                    value={form.password}
                    onChange={(event) =>
                      updateField(
                        "password",
                        event.target.value
                      )
                    }
                    disabled={isBusy}
                    aria-invalid={Boolean(
                      fieldErrors.password
                    )}
                    aria-describedby={
                      fieldErrors.password
                        ? "owner-password-error"
                        : undefined
                    }
                  />
                </div>

                {fieldErrors.password && (
                  <p
                    id="owner-password-error"
                    className="jcs-business-signup__field-error"
                    role="alert"
                  >
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <div className="jcs-business-signup__field">
                <label htmlFor="business-signup-confirm-password">
                  Confirm password
                  <span aria-hidden="true"> *</span>
                </label>

                <div
                  className={[
                    "jcs-business-signup__input-shell",
                    fieldErrors.confirmPassword
                      ? "jcs-business-signup__input-shell--error"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span aria-hidden="true">🔐</span>

                  <input
                    id="business-signup-confirm-password"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Repeat your password"
                    value={form.confirmPassword}
                    onChange={(event) =>
                      updateField(
                        "confirmPassword",
                        event.target.value
                      )
                    }
                    disabled={isBusy}
                    aria-invalid={Boolean(
                      fieldErrors.confirmPassword
                    )}
                    aria-describedby={
                      fieldErrors.confirmPassword
                        ? "confirm-password-error"
                        : undefined
                    }
                  />
                </div>

                {fieldErrors.confirmPassword && (
                  <p
                    id="confirm-password-error"
                    className="jcs-business-signup__field-error"
                    role="alert"
                  >
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <aside className="jcs-business-signup__review-card">
              <div className="jcs-business-signup__review-heading">
                <div>
                  <p className="jcs-business-signup__eyebrow">
                    Final review
                  </p>

                  <h3>Ready to create your workspace</h3>
                </div>

                <span aria-hidden="true">✅</span>
              </div>

              <dl className="jcs-business-signup__review-list">
                <div>
                  <dt>Business</dt>
                  <dd>{form.businessName}</dd>
                </div>

                <div>
                  <dt>Industry</dt>
                  <dd>
                    {selectedIndustryCategoryTitle}
                  </dd>
                </div>

                <div>
                  <dt>Business type</dt>
                  <dd>{selectedBusinessModeName}</dd>
                </div>

                <div>
                  <dt>Owner</dt>
                  <dd>
                    {cleanText(form.fullName) ||
                      "Complete owner information"}
                  </dd>
                </div>

                {activePlatformInvitationCode && (
                  <div>
                    <dt>Invitation</dt>
                    <dd>
                      {activePlatformInvitationCode}
                    </dd>
                  </div>
                )}
              </dl>
            </aside>
          </section>
        );

      case "success":
        return (
          <section
            className="jcs-business-signup__step jcs-business-signup__success-step"
            aria-labelledby="business-signup-success-title"
          >
            <div className="jcs-business-signup__success-mark">
              <span aria-hidden="true">✓</span>
            </div>

            <div className="jcs-business-signup__success-copy">
              <p className="jcs-business-signup__eyebrow">
                Registration completed
              </p>

              <h2 id="business-signup-success-title">
                Your business is ready
              </h2>

              <p>
                Welcome to JCS Business Suite. Your secure workspace
                has been created and configured.
              </p>
            </div>

            <article className="jcs-business-signup__success-business-card">
              <div className="jcs-business-signup__success-business-icon">
                <span aria-hidden="true">
                  {selectedMode?.emoji || "🏢"}
                </span>
              </div>

              <div>
                <small>Business workspace</small>

                <h3>
                  {registrationResult?.businessName ||
                    form.businessName}
                </h3>

                <p>
                  {registrationResult?.businessModeName ||
                    selectedBusinessModeName}
                </p>
              </div>
            </article>

            <div className="jcs-business-signup__success-grid">
              <article>
                <span aria-hidden="true">🔐</span>

                <div>
                  <strong>Owner account</strong>

                  <p>
                    Your primary administrator account is active.
                  </p>
                </div>
              </article>

              <article>
                <span aria-hidden="true">⚙️</span>

                <div>
                  <strong>Workspace configured</strong>

                  <p>
                    Your business modules are prepared for your
                    selected mode.
                  </p>
                </div>
              </article>

              <article>
                <span aria-hidden="true">🧠</span>

                <div>
                  <strong>Business DNA</strong>

                  <p>
                    The operational identity of your business has been
                    initialized.
                  </p>
                </div>
              </article>

              <article>
                <span aria-hidden="true">✨</span>

                <div>
                  <strong>Ready for customization</strong>

                  <p>
                    Add your logo, colors, employees, products, and
                    services from App Settings.
                  </p>
                </div>
              </article>
            </div>

            {registrationResult && (
              <dl className="jcs-business-signup__success-details">
                <div>
                  <dt>Business ID</dt>

                  <dd>
                    {registrationResult.businessID}
                  </dd>
                </div>

                <div>
                  <dt>Plan</dt>

                  <dd>
                    {registrationResult.planName}
                  </dd>
                </div>

                <div>
                  <dt>Trial</dt>

                  <dd>
                    {registrationResult.trialLengthDays} days
                  </dd>
                </div>
              </dl>
            )}
          </section>
        );
    }
  }, [

    activePlatformInvitationCode,
    clearBusinessModeSelection,
    expandedCategoryKey,
    fieldErrors.businessName,
    fieldErrors.confirmPassword,
    fieldErrors.email,
    fieldErrors.fullName,
    fieldErrors.industry,
    fieldErrors.password,
    fieldErrors.website,
    filteredIndustryCategories,
    form.businessName,
    form.businessPhone,
    form.confirmPassword,
    form.email,
    form.fullName,
    form.password,
    form.website,
    industrySearchText,
    isBusy,
    onOpenMigrationWizard,
    registrationResult,
    selectBusinessMode,
    selectedBusinessModeName,
    selectedIndustryCategoryTitle,
    selectedMode,
    step,
    updateField,
]);

  // MARK: - Render

  return (
    <main
      className="jcs-business-signup"
      data-step={step}
      data-registration-stage={registrationProgress.stage}
    >
      <div
        className="jcs-business-signup__background"
        aria-hidden="true"
      >
        <div className="jcs-business-signup__background-orb jcs-business-signup__background-orb--one" />

        <div className="jcs-business-signup__background-orb jcs-business-signup__background-orb--two" />

        <div className="jcs-business-signup__background-grid" />
      </div>

      <form
        className="jcs-business-signup__form"
        noValidate
        onSubmit={handleFormSubmit}
      >
        <header className="jcs-business-signup__top-bar">
          <button
            type="button"
            className="jcs-business-signup__brand"
            onClick={handleBackToLogin}
            disabled={isBusy}
            aria-label="Return to sign in"
          >
            <span className="jcs-business-signup__brand-mark">
              JCS
            </span>

            <span className="jcs-business-signup__brand-copy">
              <strong>JCS Business Suite</strong>

              <small>
                Professional business platform
              </small>
            </span>
          </button>

          {onClose && (
            <button
              type="button"
              className="jcs-business-signup__close-button"
              onClick={handleClose}
              disabled={isBusy}
              aria-label="Close business registration"
            >
              <span aria-hidden="true">×</span>
            </button>
          )}
        </header>

        <div className="jcs-business-signup__container">
          <section className="jcs-business-signup__hero">
            <div className="jcs-business-signup__hero-copy">
              <div className="jcs-business-signup__step-badge">
                {currentStepLabel}
              </div>

              <h1>{currentStepTitle}</h1>

              <p>{currentStepSubtitle}</p>
            </div>

            <div
              className="jcs-business-signup__hero-progress"
              style={
                {
                  "--jcs-progress-value":
                    progressValue,
                } as CSSProperties
              }
            >
              <div className="jcs-business-signup__hero-progress-value">
                <strong>{progressValue}%</strong>

                <span>Complete</span>
              </div>
            </div>
          </section>

          <section
            className="jcs-business-signup__progress-card"
            aria-label="Business registration progress"
          >
            <div className="jcs-business-signup__progress-track">
              <div
                className="jcs-business-signup__progress-fill"
                style={{
                  width: `${progressValue}%`,
                }}
              />
            </div>

            <ol className="jcs-business-signup__progress-steps">
              {BUSINESS_SIGNUP_STEPS.map(
                (progressStep, index) => {
                  const currentIndex =
                    stepIndex(step);

                  const progressStepIndex =
                    stepIndex(progressStep);

                  const isCurrent =
                    progressStep === step;

                  const isCompleted =
                    progressStepIndex <
                    currentIndex;

                  return (
                    <li
                      key={progressStep}
                      className={[
                        "jcs-business-signup__progress-step",

                        isCurrent
                          ? "jcs-business-signup__progress-step--current"
                          : "",

                        isCompleted
                          ? "jcs-business-signup__progress-step--completed"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      aria-current={
                        isCurrent
                          ? "step"
                          : undefined
                      }
                    >
                      <span className="jcs-business-signup__progress-step-number">
                        {isCompleted
                          ? "✓"
                          : index + 1}
                      </span>

                      <span className="jcs-business-signup__progress-step-title">
                        {STEP_TITLES[
                          progressStep
                        ]}
                      </span>
                    </li>
                  );
                }
              )}
            </ol>
          </section>
   

          {activePlatformInvitationCode &&
            step !== "welcome" &&
            step !== "success" && (
              <aside className="jcs-business-signup__compact-invitation">
                <span aria-hidden="true">✉️</span>

                <div>
                  <small>Platform invitation</small>

                  <strong>
                    {activePlatformInvitationCode}
                  </strong>
                </div>
              </aside>
            )}

          <div className="jcs-business-signup__content-card">
            {stepContent}
          </div>

          {registrationError && (
            <aside
              className="jcs-business-signup__registration-error"
              role="alert"
            >
              <span aria-hidden="true">⚠️</span>

              <div>
                <strong>
                  We could not complete the registration
                </strong>

                <p>{registrationError}</p>
              </div>
            </aside>
          )}

          <nav
            className="jcs-business-signup__bottom-bar"
            aria-label="Business registration controls"
          >
            <div className="jcs-business-signup__bottom-secondary">
              {canGoBack ? (
                <button
                  type="button"
                  className="jcs-business-signup__secondary-button"
                  onClick={goToPreviousStep}
                  disabled={isBusy}
                >
                  <span aria-hidden="true">←</span>

                  <span>Back</span>
                </button>
              ) : step === "welcome" ? (
                <button
                  type="button"
                  className="jcs-business-signup__sign-in-button"
                  onClick={handleBackToLogin}
                  disabled={isBusy}
                >
                  Already have an account?{" "}
                  <strong>Sign In</strong>
                </button>
              ) : (
                <div />
              )}
            </div>

            <button
              type="submit"
              className="jcs-business-signup__primary-button"
              disabled={isBusy}
            >
              {isCreatingBusiness ? (
                <>
                  <span
                    className="jcs-business-signup__button-spinner"
                    aria-hidden="true"
                  />

                  <span>Creating Business...</span>
                </>
              ) : (
                <>
                  <span>{primaryButtonTitle}</span>

                  <span aria-hidden="true">
                    {step === "success" ? "→" : "›"}
                  </span>
                </>
              )}
            </button>
          </nav>
        </div>

        {isNoticeVisible && (
          <div
            className="jcs-business-signup__notice"
            role="status"
            aria-live="polite"
          >
            <span aria-hidden="true">ℹ️</span>

            <p>{noticeMessage}</p>
          </div>
        )}

        {isCreatingBusiness && (
          <div
            className="jcs-business-signup__registration-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="registration-progress-title"
          >
            <div className="jcs-business-signup__registration-modal">
              <div className="jcs-business-signup__registration-logo">
                <span aria-hidden="true">JCS</span>
              </div>

              <div className="jcs-business-signup__registration-spinner">
                <span />
              </div>

              <p className="jcs-business-signup__eyebrow">
                JCS Business Suite
              </p>

              <h2 id="registration-progress-title">
                Preparing your workspace
              </h2>

              <p>
                {registrationProgress.message ||
                  "Creating your secure business workspace..."}
              </p>

              <div className="jcs-business-signup__registration-progress">
                <div className="jcs-business-signup__registration-progress-track">
                  <div
                    className="jcs-business-signup__registration-progress-fill"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(
                          registrationProgress.percentage,
                          100
                        )
                      )}%`,
                    }}
                  />
                </div>

                <strong>
                  {Math.max(
                    0,
                    Math.min(
                      registrationProgress.percentage,
                      100
                    )
                  )}
                  %
                </strong>
              </div>

              <small>
                Please do not close this page while your account is
                being created.
              </small>
            </div>
          </div>
        )}
      </form>
    </main>
  );
}
import BusinessSignUpView from
  "@/features/business-signup/BusinessSignUpView";

import {
  allCategories,
} from "@/core/business-mode/BusinessModeLibrary";

const industryCategories = allCategories.map(
  (category) => ({
    key: category.id,
    title: category.title,
    icon: category.icon,

    modes: category.modes.map((mode) => ({
      key: mode.id,
      name: mode.name,
      icon: mode.icon,

      recommendedModules:
        mode.recommendedModules ?? [],
    })),
  })
);

export default function CreateBusinessPage() {
  return (
    <BusinessSignUpView
      industryCategories={industryCategories}
    />
  );
}
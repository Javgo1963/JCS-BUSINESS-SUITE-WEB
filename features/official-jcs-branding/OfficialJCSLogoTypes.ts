/*
 * JCS Business Suite Web
 * OfficialJCSLogoTypes.ts
 *
 * Global official JCS Business Suite logo library.
 *
 * IMPORTANT:
 *
 * - These logos do NOT belong to an individual business.
 * - There are exactly 8 permanent official slots.
 * - PlatformAdmin manages the physical logo assigned to each slot.
 * - Business Owners may select an official logo but may not replace it.
 * - Sofia AI and customer uploads do NOT use these slots.
 */

export type OfficialJCSLogoSlot =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8;

export type OfficialJCSLogoID =
  | "official-jcs-logo-1"
  | "official-jcs-logo-2"
  | "official-jcs-logo-3"
  | "official-jcs-logo-4"
  | "official-jcs-logo-5"
  | "official-jcs-logo-6"
  | "official-jcs-logo-7"
  | "official-jcs-logo-8";

export interface OfficialJCSLogoDefinition {
  id:
    OfficialJCSLogoID;

  slot:
    OfficialJCSLogoSlot;

  title:
    string;

  storagePath:
    string;

  /**
   * The public Firebase download URL is resolved later.
   *
   * Keeping the URL out of the permanent definition means
   * PlatformAdmin can replace the physical file without
   * changing the slot identity used by businesses.
   */
  downloadURL?:
    string;

  isAvailable:
    boolean;
}

export interface OfficialJCSLogoSelection {
  source:
    "official-jcs";

  officialLogoID:
    OfficialJCSLogoID;

  officialLogoSlot:
    OfficialJCSLogoSlot;
}

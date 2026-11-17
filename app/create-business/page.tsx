import BusinessSignUpView, {
  type JCSIncomingBusinessInvitation,
} from "@/features/business-signup/BusinessSignUpView";

interface CreateBusinessPageProps {
  searchParams?: Promise<{
    invitation?: string | string[];
    code?: string | string[];
    source?: string | string[];
  }>;
}

function firstSearchValue(
  value:
    | string
    | string[]
    | undefined
): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function normalizeInvitationCode(
  value: string
): string {
  return value
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase()
    .slice(0, 128);
}

export default async function CreateBusinessPage({
  searchParams,
}: CreateBusinessPageProps) {
  const params =
    searchParams
      ? await searchParams
      : {};

  /*
   * Xcode contract:
   *
   * /create-business
   *   ?invitation=<CODE>
   *   &source=platform
   *
   * "code" is also accepted for compatibility
   * with previously issued Web invitations.
   */
  const invitationCode =
    normalizeInvitationCode(
      firstSearchValue(
        params.invitation ??
        params.code
      )
    );

  const incomingInvitation:
    JCSIncomingBusinessInvitation | null =
      invitationCode
        ? {
            invitationCode,
            normalizedInvitationCode:
              invitationCode,
            status:
              "pending",
          }
        : null;

  return (
    <BusinessSignUpView
      incomingInvitation={
        incomingInvitation
      }
    />
  );
}

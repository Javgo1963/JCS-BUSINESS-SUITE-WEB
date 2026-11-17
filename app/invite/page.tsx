import {
  Suspense,
} from "react";

import InvitationGatewayView from
  "@/features/invitation-gateway/InvitationGatewayView";

function InvitationGatewayFallback() {
  return (
    <main
      style={{
        minHeight: "100svh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        color: "#f8fafc",
        background:
          "linear-gradient(145deg, #020617 0%, #07152f 48%, #0b2144 100%)",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          width: "min(440px, 100%)",
          padding: "28px",
          textAlign: "center",
          borderRadius: "24px",
          border:
            "1px solid rgba(255,255,255,0.16)",
          background:
            "rgba(255,255,255,0.08)",
          boxShadow:
            "0 28px 80px rgba(2,6,23,0.45)",
          backdropFilter:
            "blur(24px)",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "#7dd3fc",
            fontSize: "0.75rem",
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          JCS Business Suite
        </p>

        <h1
          style={{
            margin: "12px 0 8px",
            fontSize: "1.65rem",
          }}
        >
          Preparing your invitation
        </h1>

        <p
          style={{
            margin: 0,
            color: "#cbd5e1",
            lineHeight: 1.6,
          }}
        >
          Loading the secure Universal Access Gateway.
        </p>
      </div>
    </main>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <InvitationGatewayFallback />
      }
    >
      <InvitationGatewayView />
    </Suspense>
  );
}

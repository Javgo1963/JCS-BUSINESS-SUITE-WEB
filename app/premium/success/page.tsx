export const metadata = {
  title:
    "Premium Subscription | JCS Business Suite",
  description:
    "Return from JCS Premium subscription checkout.",
};


export default function PremiumSuccessPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "32px",
        background:
          "linear-gradient(145deg, #07101f, #111827)",
        color: "#ffffff",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <section
        style={{
          width: "min(680px, 100%)",
          padding: "40px",
          borderRadius: "28px",
          background:
            "rgba(255,255,255,0.08)",
          border:
            "1px solid rgba(255,255,255,0.16)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "54px",
            marginBottom: "18px",
          }}
        >
          ✓
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "34px",
          }}
        >
          Premium checkout completed
        </h1>

        <p
          style={{
            marginTop: "18px",
            lineHeight: 1.7,
            opacity: 0.86,
          }}
        >
          JCS Business Suite is verifying your
          subscription with Stripe.
        </p>

        <p
          style={{
            lineHeight: 1.7,
            opacity: 0.76,
          }}
        >
          Returning from checkout does not activate
          Premium by itself. Premium becomes active
          only after Stripe confirms the subscription
          through the secure JCS billing backend.
        </p>

        <a
          href="/"
          style={{
            display: "inline-block",
            marginTop: "18px",
            padding: "14px 22px",
            borderRadius: "999px",
            background: "#ffffff",
            color: "#07101f",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          JCS Business Suite
        </a>
      </section>
    </main>
  );
}

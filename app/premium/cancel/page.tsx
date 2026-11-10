export const metadata = {
  title:
    "Premium Checkout Canceled | JCS Business Suite",
  description:
    "JCS Premium subscription checkout was canceled.",
};


export default function PremiumCancelPage() {
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
            fontSize: "48px",
            marginBottom: "18px",
          }}
        >
          ×
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "34px",
          }}
        >
          Premium checkout canceled
        </h1>

        <p
          style={{
            marginTop: "18px",
            lineHeight: 1.7,
            opacity: 0.86,
          }}
        >
          No Premium subscription was activated by
          this return.
        </p>

        <p
          style={{
            lineHeight: 1.7,
            opacity: 0.76,
          }}
        >
          Your current JCS plan remains unchanged.
          You can subscribe to Premium later from
          JCS Business Suite.
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

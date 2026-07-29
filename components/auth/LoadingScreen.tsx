"use client";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({
  message = "Loading JCS Business Suite...",
}: LoadingScreenProps) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
      }}
    >
      <section
        style={{
          textAlign: "center",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: "42px",
            height: "42px",
            margin: "0 auto 16px",
            border: "4px solid currentColor",
            borderRightColor: "transparent",
            borderRadius: "50%",
            animation:
              "jcs-auth-spin 0.8s linear infinite",
          }}
        />

        <p>{message}</p>

        <style jsx>{`
          @keyframes jcs-auth-spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </section>
    </main>
  );
}
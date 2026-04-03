import { useEffect, useState } from "react";

export default function Splash({ onFinish }) {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // Start fading out after 1.5s (to total 1.8s with transition)
    const fadeTimer = setTimeout(() => {
      setFade(true);
    }, 1500);

    const finishTimer = setTimeout(() => {
      onFinish();
    }, 1800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "var(--bg-base)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        opacity: fade ? 0 : 1,
        transition: "opacity 0.3s ease-out",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: "var(--accent)",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
      <h1
        style={{
          marginTop: 24,
          fontSize: 24,
          fontWeight: 600,
          color: "var(--text-primary)",
          letterSpacing: "-0.02em",
        }}
      >
        Product App
      </h1>
      <p
        style={{
          marginTop: 8,
          fontSize: 14,
          color: "var(--text-muted)",
        }}
      >
        AI for product discovery
      </p>
    </div>
  );
}

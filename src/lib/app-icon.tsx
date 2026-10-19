import { ImageResponse } from "next/og";

// The lightning-bolt mark used in the sidebar, drawn at ~50% of the canvas so
// it stays inside the safe zone when a phone crops the icon to a circle/squircle.
export function appIcon(size: number) {
  const bolt = Math.round(size * 0.5);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
          background: "#071017",
        }}
      >
        <svg width={bolt} height={bolt} viewBox="0 0 24 24" fill="none" stroke="#55D6C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
        </svg>
      </div>
    ),
    { width: size, height: size }
  );
}

import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#1c2a4a",
          color: "#f0e6cc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          fontFamily: "serif",
          fontWeight: 700,
          fontStyle: "italic",
          letterSpacing: "-0.04em",
        }}
      >
        m
      </div>
    ),
    { ...size },
  );
}

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
          background: "#0a0a0a",
          color: "#fbfaf7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          fontFamily: "serif",
          fontWeight: 700,
          fontStyle: "italic",
          letterSpacing: "-0.05em",
          borderRadius: 6,
        }}
      >
        ♚
      </div>
    ),
    { ...size },
  );
}

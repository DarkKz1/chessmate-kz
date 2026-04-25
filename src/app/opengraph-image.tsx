import { ImageResponse } from "next/og";

export const alt = "ChessMate — You vs You";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0a0a0a",
          color: "#fbfaf7",
          padding: "80px 90px",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 22,
            color: "#8a857c",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontFamily: "sans-serif",
            fontWeight: 600,
          }}
        >
          <span style={{ color: "#d4a017" }}>✦</span>
          You vs You
        </div>

        <div
          style={{
            marginTop: 38,
            fontSize: 140,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            fontWeight: 600,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
            Шахматы,
            <span
              style={{
                fontStyle: "italic",
                color: "#8a857c",
                fontWeight: 500,
              }}
            >
              учат
            </span>
          </div>
          <div>тебя из ошибок</div>
        </div>

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontFamily: "sans-serif",
          }}
        >
          <div
            style={{
              fontSize: 28,
              color: "#8a857c",
              maxWidth: 720,
              lineHeight: 1.4,
              display: "flex",
            }}
          >
            ИИ подстраивается под тебя. После партии — один точный ход.
          </div>
          <div
            style={{
              fontSize: 22,
              color: "#fbfaf7",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            chessmate-kz
            <span style={{ color: "#d4a017" }}>→</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

import { ImageResponse } from "next/og";

export const alt = "Mimic — chess that remembers your mistakes";
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
          background: "#f0e6cc",
          color: "#1c2a4a",
          padding: "70px 80px",
          fontFamily: "serif",
          position: "relative",
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0, transparent 47px, #b8c8e0 47px, #b8c8e0 49px)",
        }}
      >
        {/* Red margin line */}
        <div
          style={{
            position: "absolute",
            left: 60,
            top: 0,
            bottom: 0,
            width: 2,
            background: "#b8341e",
            display: "flex",
          }}
        />

        {/* Top — logo + stamp */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "#1c2a4a",
              fontStyle: "italic",
              letterSpacing: "-0.02em",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            mimic
            <svg
              width="58"
              height="58"
              viewBox="0 0 24 24"
              fill="#b8341e"
              style={{ display: "block" }}
            >
              <polygon points="12,2 14.6,8.6 21.6,9.2 16.3,13.8 17.9,20.6 12,17 6.1,20.6 7.7,13.8 2.4,9.2 9.4,8.6" />
            </svg>
          </div>
          <div
            style={{
              border: "3px solid #b8341e",
              padding: "8px 22px",
              color: "#b8341e",
              fontSize: 22,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              transform: "rotate(-2deg)",
              fontFamily: "monospace",
              display: "flex",
            }}
          >
            beta · vol. 01
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            marginTop: 70,
            fontSize: 116,
            lineHeight: 1.0,
            letterSpacing: "-0.02em",
            fontWeight: 700,
            fontStyle: "italic",
            display: "flex",
            flexDirection: "column",
            color: "#1c2a4a",
          }}
        >
          <div style={{ display: "flex" }}>chess that</div>
          <div style={{ display: "flex", color: "#b8341e" }}>remembers</div>
          <div style={{ display: "flex" }}>your mistakes.</div>
        </div>

        {/* Bottom */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div
            style={{
              fontSize: 22,
              color: "#3a4a6e",
              maxWidth: 760,
              lineHeight: 1.4,
              fontFamily: "monospace",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            an opponent built from your blunders
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#1c2a4a",
              fontWeight: 700,
              fontFamily: "monospace",
              letterSpacing: "0.08em",
              display: "flex",
              alignItems: "center",
              gap: 8,
              textTransform: "uppercase",
            }}
          >
            mimicchess.com
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

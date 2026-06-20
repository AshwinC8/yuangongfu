import { ImageResponse } from "next/og";

// Branded 1200×630 social share card, generated at build/request time so there's
// no binary asset to maintain. Next auto-wires this to og:image + twitter:image.
export const alt = "Yuan Gong Fu — internal martial arts in Lausanne";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          color: "#000000",
          fontFamily: "sans-serif",
          padding: "80px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 34,
            letterSpacing: 10,
            textTransform: "uppercase",
            color: "#bc0000",
            marginBottom: 28,
          }}
        >
          Yuan Gong Fu
        </div>
        <div style={{ fontSize: 92, fontWeight: 700, lineHeight: 1.05 }}>
          Power begins in stillness
        </div>
        <div style={{ fontSize: 30, color: "#6b6560", marginTop: 36 }}>
          Tai Chi · Qi Gong · Meditation · Internal Martial Arts · Lausanne
        </div>
      </div>
    ),
    { ...size },
  );
}

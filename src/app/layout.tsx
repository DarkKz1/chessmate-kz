import type { Metadata } from "next";
import { Inter, Caveat, Special_Elite, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

// Body — neutral, highly legible base
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Handwritten — logo, margin notes, "ну..." comments. Soviet notebook feel.
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Typewriter — UI labels, buttons, headers. Aged paper / chess-bulletin feel.
const specialElite = Special_Elite({
  variable: "--font-typewriter",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

// Monospace — chess notation only (Nf3, e4, O-O)
const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mimic — chess that remembers your mistakes",
  description:
    "Mimic is a chess AI that maps your weaknesses and plays them back at you. The more you play, the sharper it cuts.",
  metadataBase: new URL("https://dr-chessmate-kz.vercel.app"),
  openGraph: {
    title: "Mimic — chess that remembers your mistakes",
    description:
      "An AI opponent built from your own blunders. Plays your weaknesses back at you.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${caveat.variable} ${specialElite.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

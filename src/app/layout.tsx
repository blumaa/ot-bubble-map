import type { Metadata } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import { SITE_NAME } from "@/lib/site";
import "./globals.css";

// UI text.
const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

// Display: site name, group labels, popover titles. Soft, old-style serif for the old-time feel.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "opsz"],
});

export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: "Zoomable bubble map of old-time fiddle tunes from Slippery-Hill",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

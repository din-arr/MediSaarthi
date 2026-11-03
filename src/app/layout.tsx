import type { Metadata } from "next";
import { Inter, Noto_Sans_Bengali, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import MotionProvider from "../components/motion/MotionProvider";
import ThemeProvider from "../components/ThemeProvider";
import LanguageProvider from "../components/LanguageProvider";

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
const devanagari = Noto_Sans_Devanagari({ variable: "--font-devanagari", subsets: ["devanagari"], weight: ["400", "500", "600", "700"], display: "swap" });
const bengali = Noto_Sans_Bengali({ variable: "--font-bengali", subsets: ["bengali"], weight: ["400", "500", "600", "700"], display: "swap" });

export const metadata: Metadata = {
  title: "MediSaarthi | Your Trusted Medicine Companion",
  description: "An independent educational demo of pharmacy reordering, AI-assisted prescription review and refill reminders.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body className={`${sans.variable} ${devanagari.variable} ${bengali.variable}`}><ThemeProvider><LanguageProvider><MotionProvider>{children}</MotionProvider></LanguageProvider></ThemeProvider></body></html>;
}

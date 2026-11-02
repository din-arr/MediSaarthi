import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import MotionProvider from "../components/motion/MotionProvider";
import ThemeProvider from "../components/ThemeProvider";

const display = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MediSaarthi | Your Trusted Medicine Companion",
  description: "An independent educational demo of pharmacy reordering, AI-assisted prescription review and refill reminders.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body className={`${display.variable} ${sans.variable}`}><ThemeProvider><MotionProvider>{children}</MotionProvider></ThemeProvider></body></html>;
}

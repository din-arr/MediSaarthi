import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MediSaarthi | Your Trusted Medicine Companion",
  description: "An independent educational demo of pharmacy reordering, AI-assisted prescription review and refill reminders.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

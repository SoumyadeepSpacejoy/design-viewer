import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthGuard from "@/components/AuthGuard";
import { ThemeProvider } from "@/components/ThemeContext";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Spacejoy ai designs",
  description: "Spacejoy AI designs viewer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${plusJakartaSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <AuthGuard>{children}</AuthGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}

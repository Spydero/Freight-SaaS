import type { Metadata } from "next";
import { Manrope, Syne } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

const display = Syne({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "ELIOS — Modern Logistics",
  description: "Portfolio shipping management SaaS — quotes, shipments, and tracking.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${body.variable} ${display.variable} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CareerPilot — Your AI-Powered Career Copilot",
  description:
    "Discover your ideal career path, analyze your skill gaps, and prepare for your dream job with AI-powered guidance.",
  keywords: ["career guidance", "AI", "resume analyzer", "skill gap", "mock interview"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0f172a] text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], display: "swap" });

const title = "JevSpeak — A decision model that speaks";
const description = "Turn probabilistic decisions into English or Chinese without a generative LLM. Try a conversation and inspect the decisions behind each reply.";

export const metadata: Metadata = {
  metadataBase: new URL("https://jevspeak.org"),
  title,
  description,
  openGraph: { title, description, siteName: "JevSpeak", type: "website", locale: "en_US" },
  twitter: { card: "summary_large_image", title, description, creator: "@LuigiProof", images: ["/opengraph-image"] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import FloatingChatbox from '@/components/FloatingChatbox'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MovieWorld - Your Ultimate Movie Destination",
  description: "Discover, watch, and discuss movies with our AI-powered platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white`}>
        <Navigation />
        <div className="pt-16">
          {children}
        </div>
        <FloatingChatbox />
      </body>
    </html>
  );
}

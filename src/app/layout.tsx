import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../styles/scrollbar.css";
import Navigation from "@/components/Navigation";
import { Toaster } from 'react-hot-toast';
import Footer from '@/components/Footer';
import AuthChecker from '../components/AuthChecker';
import { SplashWrapper } from '@/components/splash';
import { HeaderProvider } from '@/contexts/HeaderContext';
import ContentWrapper from '@/components/ContentWrapper';
import { SpeedInsights } from '@vercel/speed-insights/next';
import WatchlistSyncer from "@/components/WatchlistSyncer";
import FloatingChatbox from "@/components/FloatingChatbox";
import ProgressCleanup from '@/components/ProgressCleanup';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  referrer: "origin",
  title: "Entertainment Galaxy – Explore Movies, Games & Beyond",
  description: "Dive into a universe of entertainment: stream movies, play games, and enjoy AI-powered recommendations in one seamless platform.",
  other: {
    'translate': 'no',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.ico" />
        <meta name="referrer" content="origin" />
      </head>
      <body className={`${inter.className} bg-black text-white min-h-screen flex flex-col`}>
        <HeaderProvider>
          {/* Splash Screen */}
          <SplashWrapper />
          
          <AuthChecker />
          <ProgressCleanup />
          <Navigation />
          <WatchlistSyncer />
          <ContentWrapper>
            {children}
          </ContentWrapper>
          <Footer />
          <FloatingChatbox />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1F2937',
                color: '#fff',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          <SpeedInsights />
        </HeaderProvider>
      </body>
    </html>
  );
}

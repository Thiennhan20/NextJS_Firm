import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import FloatingChatbox from '@/components/FloatingChatbox'
import { Toaster } from 'react-hot-toast';
import Footer from '@/components/Footer';
import WatchlistSyncer from '@/components/WatchlistSyncer';
import ClearStorageOnLoad from '@/components/ClearStorageOnLoad';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MovieWorld - Your Ultimate Movie Destination",
  description: "Discover, watch, and discuss movies with our AI-powered platform",
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
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      </head>
      <body className={`${inter.className} bg-black text-white min-h-screen flex flex-col`}>
        <ClearStorageOnLoad />
        <Navigation />
        <WatchlistSyncer />
        <div className="pt-16 flex-grow">
          {children}
        </div>
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
      </body>
    </html>
  );
}

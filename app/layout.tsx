import type {
  Metadata,
  Viewport,
} from "next";

import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import { AppProviders } from "@/app/providers";

import "./globals.css";
import "./jcs-foundation.css";

/*
 JCS Business Suite Web
 Root Application Layout

 Responsibilities:
 - Load the global JCS Design System.
 - Configure application metadata.
 - Provide responsive viewport behavior.
 - Establish the root language and appearance behavior.
 - Connect the application's global providers.

 Business authentication, permissions, business context,
 and business-specific logic must not be placed in this file.
 */

// MARK: - Fonts

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// MARK: - Metadata

export const metadata: Metadata = {
  applicationName: "JCS Business Suite",

  title: {
    default: "JCS Business Suite",
    template: "%s | JCS Business Suite",
  },

  description:
    "Build, run, and grow your business with connected sales, customers, employees, inventory, POS, payments, operations, and business insights.",

  keywords: [
    "JCS Business Suite",
    "business management",
    "point of sale",
    "inventory",
    "customers",
    "employees",
    "business analytics",
    "online store",
    "appointments",
    "business software",
  ],

  authors: [
    {
      name: "JCS Business Suite",
    },
  ],

  creator: "JCS Business Suite",
  publisher: "JCS Business Suite",

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

// MARK: - Viewport

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  colorScheme: "light dark",

  themeColor: [
    {
      media: "(prefers-color-scheme: light)",
      color: "#f7faff",
    },
    {
      media: "(prefers-color-scheme: dark)",
      color: "#07101f",
    },
  ],
};

// MARK: - Root Layout Props

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

// MARK: - Root Layout

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
        `}
      >
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
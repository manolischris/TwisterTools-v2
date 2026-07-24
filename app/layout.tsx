import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleTagManager } from "@next/third-parties/google";
import "./globals.css";
import PerformanceShim from "@/components/PerformanceShim";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.twistertools.com"),
  title: {
    default: "TwisterTools - Free Online Text & Image Tools",
    template: "%s | TwisterTools",
  },
  description:
    "Free online tools for text manipulation, image editing, SEO optimization, and more. Fast, secure, and easy-to-use web utilities for developers and content creators.",
  keywords: [
    "online tools",
    "text tools",
    "image tools",
    "SEO tools",
    "free utilities",
    "web tools",
  ],
  authors: [{ name: "TwisterTools" }],
  creator: "TwisterTools",
  publisher: "TwisterTools",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.twistertools.com",
    siteName: "TwisterTools",
    title: "TwisterTools - Free Online Text & Image Tools",
    description:
      "Free online tools for text manipulation, image editing, SEO optimization, and more. Fast, secure, and easy-to-use web utilities.",
    images: [
      {
        url: "/images/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "TwisterTools - Free Online Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TwisterTools - Free Online Text & Image Tools",
    description:
      "Free online tools for text manipulation, image editing, SEO optimization, and more.",
    images: ["/images/og-default.jpg"],
    creator: "@twistertools",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Pre-hydration Google Consent Mode v2 Default Signals */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                'ad_storage': 'denied',
                'analytics_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied',
                'wait_for_update': 500
              });
            `,
          }}
        />
      </head>
      <GoogleTagManager gtmId="GTM-T6VQVF8K" />
      <body className="min-h-full flex flex-col">
        <PerformanceShim />
        {/* <!-- AdSense Placement Header --> */}

        <Header />

        <main className="flex-1 w-full">
          {children}
        </main>

        {/* <!-- AdSense Placement Footer --> */}

        <Footer />
        <CookieConsent />
      </body>
    </html>
  );
}
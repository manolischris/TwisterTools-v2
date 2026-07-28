import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleTagManager } from "@next/third-parties/google";
import "./globals.css";
import PerformanceShim from "@/components/PerformanceShim";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import Script from "next/script";

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
    default: "TwisterTools - Free Online Calculators, Converters & Web Utilities",
    template: "%s | TwisterTools",
  },
  description:
    "100% free, fast, and privacy-first online utilities. Access our growing suite of browser-native calculators, developer tools, image converters, text editors, and web tools with zero server tracking.",
  keywords: [
    "free online calculators",
    "developer tools",
    "unit converters",
    "image converters",
    "text editors",
    "SEO utilities",
    "JSON formatter",
    "QR code generator",
    "client-side web tools",
    "TwisterTools"
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
    title: "TwisterTools - Free Online Calculators, Converters & Web Utilities",
    description:
      "100% free, fast, and privacy-first online utilities. Access our growing suite of browser-native calculators, developer tools, image converters, text editors, and web tools with zero server tracking.",
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
    title: "TwisterTools - Free Online Calculators, Converters & Web Utilities",
    description:
      "Fast, privacy-first online utilities. Access our growing suite of browser-native calculators, converters, and web tools.",
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
      <body className="min-h-full flex flex-col">
        <Script src="/gtm-consent-init.js" strategy="beforeInteractive" />
        <GoogleTagManager gtmId="GTM-T6VQVF8K" />
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
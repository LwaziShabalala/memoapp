import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Script from "next/script";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "memo",
  description: "AI platform",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {/* 🍋 LemonSqueezy Affiliate Tracking */}
          <Script id="lemon-affiliate-config" strategy="beforeInteractive">
            {`window.lemonSqueezyAffiliateConfig = { store: "thememoapp" };`}
          </Script>
          <Script
            src="https://lmsqueezy.com/affiliate.js"
            strategy="defer"
          />

          {/* 📊 Umami Analytics */}
          <Script
            src="https://datafa.st/js/script.js"
            data-website-id="67fcffed185b579edb24c21b"
            data-domain="memoapp.net"
            strategy="afterInteractive"
          />

          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}

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
        <head>
          {/* 📊 Umami Analytics (added as-is with defer) */}
          <script
            defer
            data-website-id="67fd031ccee849af2f02027f"
            data-domain="memoapp.net"
            src="https://datafa.st/js/script.js"
          ></script>
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {/* 🍋 LemonSqueezy Affiliate Tracking */}
          <Script id="lemon-affiliate-config" strategy="beforeInteractive">
            {`window.lemonSqueezyAffiliateConfig = { store: "thememoapp" };`}
          </Script>
          <Script
            src="https://lmsqueezy.com/affiliate.js"
            strategy="afterInteractive"
          />

          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}

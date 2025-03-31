"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";

export default function GoogleAnalytics(): JSX.Element {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Use 'window' safely with type assertion
    const gtag = (window as unknown as { gtag?: (...args: any[]) => void }).gtag;

    if (typeof gtag === "function") {
      gtag("config", "G-GXB7S8KDNR", {
        page_path: pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ""),
      });
    }
  }, [pathname, searchParams]);

  return (
    <>
      <Script
        strategy="afterInteractive"
        src="https://www.googletagmanager.com/gtag/js?id=G-GXB7S8KDNR"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-GXB7S8KDNR');
          `,
        }}
      />
    </>
  );
}

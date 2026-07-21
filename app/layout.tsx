// Copyright © 2026 Holdam. All rights reserved.
// TODO: Demo e-commerce shell; redirects buyers to checkout-ui. Could be Vite unless we need
// Next server features for Meta Pixel / SSR product pages.
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import { Suspense } from "react";
import ReferralCapture from "@/components/ReferralCapture";
import "./globals.css";
import { STOREFRONT_META_DESCRIPTION } from "@/lib/device-quality-copy";
import { COMPANY_NAME } from "@/lib/storefront-brand";

// Replace with your actual Meta Pixel ID
const META_PIXEL_ID = "YOUR_PIXEL_ID_HERE";

export const metadata: Metadata = {
  title: `${COMPANY_NAME} - Brand New and Grade A Computing Devices`,
  description: STOREFRONT_META_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Persist ?ref= before React hydrates so product links keep the referral code. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=location.search.match(/[?&]ref=([^&]+)/);if(m){sessionStorage.setItem("holdam_referral_code",decodeURIComponent(m[1]).trim().toUpperCase());}}catch(e){}})();`,
          }}
        />
        {/* Meta Pixel Code */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
      </head>
      <body className="min-h-screen bg-surface-muted font-sans">
        {/* Meta Pixel Noscript Fallback */}
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
        {children}
        <Suspense fallback={null}>
          <ReferralCapture />
        </Suspense>
        {process.env.NODE_ENV === "production" && <Analytics />}
        {process.env.NODE_ENV === "production" && <SpeedInsights />}
      </body>
    </html>
  );
}

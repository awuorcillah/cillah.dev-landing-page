import type { Metadata, Viewport } from "next"
import { Sora, Inter } from "next/font/google"
import Script from "next/script"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Toaster } from "sonner"
import { SITE_URL, DEFAULT_OG_IMAGE, absoluteUrl } from "@/lib/site-config"

import "./globals.css"

const sora = Sora({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sora",
})

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Cillah | AI & Automation for Real Estate Agencies in Kenya",
  description:
    "Cillah builds websites, AI assistants and automation for Kenyan real estate agencies, so no lead is lost to slow, manual follow-up.",
  authors: [{ name: "Cillah" }],
  openGraph: {
    title: "Cillah | AI & Automation for Real Estate Agencies in Kenya",
    description:
      "Cillah builds websites, AI assistants and automation for Kenyan real estate agencies, so no lead is lost to slow, manual follow-up.",
    type: "website",
    locale: "en_US",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cillah | AI & Automation for Real Estate Agencies in Kenya",
    description:
      "Cillah builds websites, AI assistants and automation for Kenyan real estate agencies, so no lead is lost to slow, manual follow-up.",
    images: [DEFAULT_OG_IMAGE],
  },
  icons: {
    icon: "/images/cillah-emblem.png",
    shortcut: "/images/cillah-emblem.png",
    apple: "/images/cillah-emblem.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID

  return (
    <html lang="en">
      <head>
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}');`}
            </Script>
          </>
        )}
        {gtmId && (
          <Script id="gtm-init" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
          </Script>
        )}
        {metaPixelId && (
          <Script id="meta-pixel-init" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`}
          </Script>
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": ["Organization", "ProfessionalService"],
                  "@id": `${SITE_URL}/#organization`,
                  "name": "Cillah",
                  "legalName": "Cillah AI Automation",
                  "url": SITE_URL,
                  "logo": {
                    "@type": "ImageObject",
                    "@id": `${SITE_URL}/#logo`,
                    "url": DEFAULT_OG_IMAGE,
                    "contentUrl": DEFAULT_OG_IMAGE,
                    "caption": "Cillah Logo"
                  },
                  "image": DEFAULT_OG_IMAGE,
                  "description": "Cillah builds websites, AI assistants and automation for real estate agencies in Kenya, so no lead is lost to slow, manual follow-up.",
                  "email": "atulah@cillah.dev",
                  "telephone": "+254759442265",
                  "address": {
                    "@type": "PostalAddress",
                    "addressLocality": "Nairobi",
                    "addressCountry": "KE",
                    "streetAddress": "Nairobi, Kenya"
                  },
                  "geo": {
                    "@type": "GeoCoordinates",
                    "latitude": -1.2921,
                    "longitude": 36.8219
                  },
                  "identifier": {
                    "@type": "PropertyValue",
                    "name": "Government of Kenya Business Registration",
                    "value": "BN-5559Q2JL"
                  },
                  "sameAs": [
                    "https://www.linkedin.com/in/cheryl-cilla-77a125415",
                    "https://www.instagram.com/cheryl_cilla",
                    "https://www.facebook.com/share/1EbU2KjfER/",
                    "https://www.tiktok.com/@cillah.dev"
                  ],
                  "priceRange": "$$$$",
                  "currenciesAccepted": "KES, USD",
                  "paymentAccepted": "M-Pesa, Credit Card, Bank Transfer",
                  "areaServed": [
                    { "@type": "Country", "name": "Kenya" },
                    { "@type": "Country", "name": "United States" },
                    { "@type": "Country", "name": "United Kingdom" },
                    { "@type": "Country", "name": "United Arab Emirates" }
                  ]
                },
                {
                  "@type": "WebSite",
                  "@id": `${SITE_URL}/#website`,
                  "url": SITE_URL,
                  "name": "Cillah",
                  "description": "Modern Digital Operating Systems, Custom Web Applications & Autonomous AI Agents",
                  "publisher": {
                    "@id": `${SITE_URL}/#organization`
                  },
                  "inLanguage": "en-US"
                },
                {
                  "@type": "ItemList",
                  "@id": `${SITE_URL}/#sitelinks`,
                  "name": "Cillah Sitelinks",
                  "itemListElement": [
                    {
                      "@type": "SiteNavigationElement",
                      "position": 1,
                      "name": "Book a Consultation",
                      "description": "Schedule a one-on-one discovery consultation to map out your business automation.",
                      "url": absoluteUrl("/book-consultation")
                    },
                    {
                      "@type": "SiteNavigationElement",
                      "position": 2,
                      "name": "Our Services",
                      "description": "Software development services for business: custom web applications, 24/7 AI messaging agents, and CRM automation pipelines.",
                      "url": absoluteUrl("/our-services")
                    },
                    {
                      "@type": "SiteNavigationElement",
                      "position": 3,
                      "name": "Use Cases",
                      "description": "See practical real estate automation workflows and live client results.",
                      "url": absoluteUrl("/use-cases")
                    },
                    {
                      "@type": "SiteNavigationElement",
                      "position": 4,
                      "name": "Articles",
                      "description": "Read strategic insights on custom web operating systems, autonomous AI agents, and CRM automation.",
                      "url": absoluteUrl("/articles")
                    },
                    {
                      "@type": "SiteNavigationElement",
                      "position": 5,
                      "name": "Client Portal",
                      "description": "Access your Cillah client workspace to log in or sign up for your sales dashboard.",
                      "url": absoluteUrl("/client-portal")
                    }
                  ]
                }
              ]
            }),
          }}
        />
      </head>
      <body className={`${inter.variable} ${sora.variable} font-sans bg-background text-foreground antialiased`}>
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        {children}
        <Toaster position="top-left" theme="dark" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}

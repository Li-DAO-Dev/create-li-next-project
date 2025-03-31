import { routing } from "@/i18n/routing.ts"
import { NextIntlClientProvider, hasLocale } from "next-intl"
import { setRequestLocale } from "next-intl/server"
import { ThemeProvider } from "next-themes"
import {
  Merriweather,
  Noto_Sans_SC,
  Noto_Sans_TC,
  Noto_Serif_SC,
  Noto_Serif_TC,
  Roboto,
} from "next/font/google"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"
import "../global.css"

// Sans font
const NotoSansScFont = Noto_Sans_SC({
  weight: ["300", "400", "500", "700"],
  preload: false,
  variable: "--font-sans-next",
})

const NotoSansTcFont = Noto_Sans_TC({
  weight: ["300", "400", "500", "700"],
  variable: "--font-sans-next",
  preload: false,
})

const RobotoFont = Roboto({
  weight: ["300", "400", "500", "700"],
  variable: "--font-sans-next",
  subsets: ["latin"],
  preload: false,
})

// Serif font
const NotoSerifScFont = Noto_Serif_SC({
  weight: ["300", "400", "500", "700"],
  variable: "--font-serif-next",
  subsets: ["latin"],
  preload: false,
})

const NotoSerifTcFont = Noto_Serif_TC({
  weight: ["300", "400", "500", "700"],
  variable: "--font-serif-next",
  preload: false,
})

const MerriweatherFont = Merriweather({
  weight: ["300", "400", "700"],
  variable: "--font-serif-next",
  preload: false,
})

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }))
}

// biome-ignore lint/style/noDefaultExport: layout.tsx
export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  setRequestLocale(locale)

  const fontClassName =
    {
      en: `${RobotoFont.variable} ${MerriweatherFont.variable}`,
      "zh-CN": `${NotoSansScFont.variable} ${NotoSerifScFont.variable}`,
      "zh-TW": `${NotoSansTcFont.variable} ${NotoSerifTcFont.variable}`,
    }[locale] ?? `${NotoSansScFont.variable} ${NotoSerifScFont.variable}`

  return (
    <html class={fontClassName} lang={locale} suppressHydrationWarning={true}>
      <body>
        <NextIntlClientProvider>
          <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem={true}>
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

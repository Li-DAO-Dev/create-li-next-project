import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const nextConfig: NextConfig = {
  /* config options here */
}

const withNextIntl = createNextIntlPlugin({
  requestConfig: "./i18n/request.ts",
  experimental: {
    createMessagesDeclaration: ["./i18n/translations/en/HomePage.json"],
  },
})

// biome-ignore lint/style/noDefaultExport: next.config.ts
export default withNextIntl(nextConfig)

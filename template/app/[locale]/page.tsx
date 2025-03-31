import type { routing } from "@/i18n/routing.ts"
import { getTranslations } from "next-intl/server"
import { SimpleThemeSwitcher } from "../SimpleThemeSwitcher.tsx"

// biome-ignore lint/style/noDefaultExport: page.tsx
export default async function Home({
  params,
}: { params: Promise<{ locale: (typeof routing.locales)[number] }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "HomePage" })

  return (
    <div class="flex justify-center items-center h-screen">
      <div class="flex gap-4">
        <div class="flex flex-col">
          <div>
            <h1 class="font-bold text-4xl">{t("title")}</h1>
          </div>
          <div>
            <p class="text-secondary-text text-xm">{t("hello")}</p>
          </div>
        </div>
        <div class="flex justify-center items-center bg-secondary rounded-full size-16">
          <p class="font-medium text-primary text-5xl">LI</p>
        </div>
        <SimpleThemeSwitcher />
      </div>
    </div>
  )
}

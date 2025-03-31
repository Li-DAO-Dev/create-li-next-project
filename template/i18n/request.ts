// biome-ignore lint/correctness/noNodejsModules: Running in the server
import path from "node:path"
import fg from "fast-glob"
import { hasLocale } from "next-intl"
import { getRequestConfig } from "next-intl/server"
import { routing } from "./routing.ts"

// biome-ignore lint/style/noDefaultExport: request.ts
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale
  const localePath = path.join(process.cwd(), "i18n", "translations", locale)

  // const messagesFiles =
  const messages = (
    await Promise.all(
      (
        await fg(`${localePath}/*.json`)
      ).map(async path => {
        const key = path.replace(`${localePath}/`, "").replace(".json", "")
        return {
          key,
          value: (await import(`./translations/${locale}/${key}.json`)).default,
        }
      }),
    )
  ).reduce(
    (acc, curr) => {
      acc[curr.key] = curr.value
      return acc
    },
    // biome-ignore lint/suspicious/noExplicitAny:
    {} as Record<string, any>,
  )
  return { locale, messages }
})

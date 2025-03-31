import type { routing } from "./routing.ts"
import type messages from "./translations/en/HomePage.d.json.ts"

type Messages = {
  HomePage: typeof messages
}

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number]
    Messages: Messages
  }
}

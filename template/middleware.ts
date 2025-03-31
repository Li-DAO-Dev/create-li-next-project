import createMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing.ts"

// biome-ignore lint/style/noDefaultExport: middleware
export default createMiddleware(routing)

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: "/((?!api|_next/image|_next/static|_vercel|.*\\..*).*)",
}

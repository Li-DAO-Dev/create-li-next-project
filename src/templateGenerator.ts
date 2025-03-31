import path from "node:path"
import { fileURLToPath } from "node:url"
import chalk from "chalk"
import { execa } from "execa"
import fs from "fs-extra"

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Path to template directory
const TEMPLATE_DIR = path.resolve(__dirname, "..", "template")

interface ProjectConfig {
  projectName: string
  folders: string[]
  useI18n: boolean
  languages: string[]
  useNextThemes: boolean
  allowSystemTheme?: boolean
}

/**
 * Generate a new Next.js project based on the provided configuration
 */
export async function generateProject(config: ProjectConfig): Promise<void> {
  const { projectName, folders, useI18n, languages, useNextThemes, allowSystemTheme = true } = config

  const projectPath = path.resolve(process.cwd(), projectName)

  // Check if directory already exists
  if (await fs.pathExists(projectPath)) {
    throw new Error(
      `Directory ${projectName} already exists. Choose a different name or delete the existing directory.`,
    )
  }

  try {
    // Create project directory
    await fs.mkdir(projectPath)
    console.log(chalk.green(`Created directory ${projectName}`))

    // Copy base configuration files
    await copyBaseConfigFiles(projectPath)

    // Create folder structure
    await createFolderStructure(projectPath, folders)

    // Set up i18n if needed
    if (useI18n) {
      await setupI18n(projectPath, languages)
    }

    // Set up themes if needed
    if (useNextThemes) {
      await setupThemes(projectPath, folders)
    }

    // Setup app folder with basic files
    await setupAppFolder(projectPath, useI18n, languages, useNextThemes, allowSystemTheme, folders)

    // Update tsconfig.json
    await updateTsConfig(projectPath, folders, useI18n)

    // Update package.json
    await updatePackageJson(projectPath, projectName, useI18n, useNextThemes)

    // Update GitHub templates
    await updateGitHubTemplates(projectPath, projectName, folders, useI18n, languages)

    // Create next.config.ts
    await setupNextConfig(projectPath, useI18n, languages)

    console.log(chalk.green("\nProject created successfully!"))

    // Execute post-creation commands
    await runPostCreationCommands(projectPath, projectName)
  } catch (error) {
    // Clean up by removing the directory if something failed
    try {
      await fs.remove(projectPath)
    } catch (cleanupError) {
      console.error("Failed to clean up after error:", cleanupError)
    }
    throw error
  }
}

/**
 * Copy base configuration files from template directory
 */
async function copyBaseConfigFiles(projectPath: string): Promise<void> {
  const baseFiles = [
    ".cspell.json",
    ".editorconfig",
    ".gitignore",
    ".ignore-words.txt",
    ".nvmrc",
    ".pre-commit-config.yaml",
    "biome.json",
    "next-env.d.ts",
    "pnpm-workspace.yaml",
    "postcss.config.mjs",
    "SECURITY.md",
  ]

  for (const file of baseFiles) {
    const sourcePath = path.join(TEMPLATE_DIR, file)

    if (await fs.pathExists(sourcePath)) {
      await fs.copy(sourcePath, path.join(projectPath, file))
      console.log(chalk.green(`Copied ${file}`))
    }
  }

  // Copy VSCode configuration files
  await copyVsCodeConfig(projectPath)
}

/**
 * Copy VSCode configuration files
 */
async function copyVsCodeConfig(projectPath: string): Promise<void> {
  const vscodeDir = path.join(TEMPLATE_DIR, ".vscode")

  if (await fs.pathExists(vscodeDir)) {
    await fs.copy(vscodeDir, path.join(projectPath, ".vscode"))
    console.log(chalk.green("Copied .vscode configuration files"))
  }
}

/**
 * Create the folder structure based on user selection
 */
async function createFolderStructure(projectPath: string, folders: string[]): Promise<void> {
  for (const folder of folders) {
    await fs.mkdir(path.join(projectPath, folder))
    console.log(chalk.green(`Created ${folder}/ directory`))
  }

  // Copy global.css to corresponding directory if it exists
  const globalCssSource = path.join(TEMPLATE_DIR, "app", "global.css")
  if (await fs.pathExists(globalCssSource)) {
    if (folders.includes("styles")) {
      await fs.copy(globalCssSource, path.join(projectPath, "styles", "globals.css"))
    } else {
      await fs.copy(globalCssSource, path.join(projectPath, "app", "globals.css"))
    }
    console.log(chalk.green("Created app/globals.css"))
  }
}

/**
 * Set up i18n configuration
 */
async function setupI18n(projectPath: string, languages: string[]): Promise<void> {
  // Create i18n directory
  await fs.mkdir(path.join(projectPath, "i18n"))

  // Copy navigation.ts and request.ts as is
  await fs.copy(
    path.join(TEMPLATE_DIR, "i18n", "navigation.ts"),
    path.join(projectPath, "i18n", "navigation.ts"),
  )
  await fs.copy(path.join(TEMPLATE_DIR, "i18n", "request.ts"), path.join(projectPath, "i18n", "request.ts"))
  console.log(chalk.green("Created i18n/navigation.ts and i18n/request.ts"))

  // Create custom routing.ts with selected languages
  const defaultLocale = languages.includes("en") ? "en" : languages[0]
  const routingContent = `import { defineRouting } from "next-intl/routing"

export const routing = defineRouting({
  locales: ${JSON.stringify(languages.sort((a, b) => a.localeCompare(b)))},
  defaultLocale: "${defaultLocale}",
})
`
  await fs.writeFile(path.join(projectPath, "i18n", "routing.ts"), routingContent)
  console.log(chalk.green("Created customized i18n/routing.ts with selected languages"))

  // Create custom types.d.ts
  const typesContent = `import type { routing } from "./routing.ts"
import type messages from "./translations/${defaultLocale}/HomePage.d.json.ts"

type Messages = {
  HomePage: typeof messages
}

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number]
    Messages: Messages
  }
}
`
  await fs.writeFile(path.join(projectPath, "i18n", "types.d.ts"), typesContent)
  console.log(chalk.green("Created i18n/types.d.ts"))

  // Create translations directory
  await fs.mkdir(path.join(projectPath, "i18n", "translations"))

  // Copy selected language translations
  for (const lang of languages) {
    if (await fs.pathExists(path.join(TEMPLATE_DIR, "i18n", "translations", lang))) {
      await fs.copy(
        path.join(TEMPLATE_DIR, "i18n", "translations", lang),
        path.join(projectPath, "i18n", "translations", lang),
      )
      console.log(chalk.green(`Created i18n/translations/${lang}`))
    }
  }

  // Copy middleware.ts for i18n routing
  await fs.copy(path.join(TEMPLATE_DIR, "middleware.ts"), path.join(projectPath, "middleware.ts"))
  console.log(chalk.green("Created middleware.ts"))

  // We're skipping app/[locale] file creation as requested
}

/**
 * Set up theme configuration
 */
async function setupThemes(projectPath: string, folders: string[]): Promise<void> {
  // Place the ThemeSwitcher in the appropriate directory based on folder structure
  const hasComponentsFolder = folders.includes("components")
  const targetPath = hasComponentsFolder
    ? path.join(projectPath, "components", "SimpleThemeSwitcher.tsx")
    : path.join(projectPath, "app", "SimpleThemeSwitcher.tsx")

  // Copy the ThemeSwitcher component
  await fs.copy(path.join(TEMPLATE_DIR, "app", "SimpleThemeSwitcher.tsx"), targetPath)

  console.log(chalk.green(`Created ${hasComponentsFolder ? "components" : "app"}/SimpleThemeSwitcher.tsx`))
}

/**
 * Update tsconfig.json with appropriate paths
 */
async function updateTsConfig(projectPath: string, folders: string[], useI18n: boolean): Promise<void> {
  const tsConfigPath = path.join(TEMPLATE_DIR, "tsconfig.json")
  const tsConfig = await fs.readJson(tsConfigPath)

  // Modify paths based on folders and features
  const paths: Record<string, string[]> = {
    "@/*": ["./*"],
    "@/app/*": ["./app/*"],
  }

  if (useI18n) {
    paths["@/i18n/*"] = ["./i18n/*"]
  }

  for (const folder of folders) {
    if (folder !== "app") {
      // app is already included
      paths[`@/${folder}/*`] = [`./${folder}/*`]
    }
  }

  tsConfig.compilerOptions.paths = paths

  await fs.writeJson(path.join(projectPath, "tsconfig.json"), tsConfig, { spaces: 2 })
  console.log(chalk.green("Updated tsconfig.json with appropriate paths"))
}

/**
 * Update package.json with project details and dependencies
 */
async function updatePackageJson(
  projectPath: string,
  projectName: string,
  useI18n: boolean,
  useNextThemes: boolean,
): Promise<void> {
  const templatePackageJson = await fs.readJson(path.join(TEMPLATE_DIR, "package.json"))

  // Set project name
  templatePackageJson.name = projectName

  // Update repository, bugs and homepage URLs
  if (templatePackageJson.repository) {
    templatePackageJson.repository.url = `git+https://github.com/li-dao-dev/${projectName}.git`
  }

  if (templatePackageJson.bugs) {
    templatePackageJson.bugs.url = `https://github.com/li-dao-dev/${projectName}/issues`
  }

  templatePackageJson.homepage = `https://github.com/li-dao-dev/${projectName}#readme`

  // Adjust dependencies based on features
  const dependencies = { ...templatePackageJson.dependencies }

  // Remove next-intl if not using i18n
  if (!useI18n && dependencies["next-intl"]) {
    dependencies["next-intl"] = undefined
    dependencies["fast-glob"] = undefined
  }

  // Remove next-themes if not using themes
  if (!useNextThemes && dependencies["next-themes"]) {
    dependencies["next-themes"] = undefined
  }

  // Filter out undefined values
  templatePackageJson.dependencies = Object.fromEntries(
    Object.entries(dependencies).filter(([_, value]) => value !== undefined),
  )

  await fs.writeJson(path.join(projectPath, "package.json"), templatePackageJson, { spaces: 2 })
  console.log(chalk.green("Updated package.json with project details"))
}

/**
 * Update GitHub templates
 */
async function updateGitHubTemplates(
  projectPath: string,
  projectName: string,
  folders: string[],
  useI18n: boolean,
  languages: string[],
): Promise<void> {
  // Create .github directory
  await fs.mkdir(path.join(projectPath, ".github"))

  // Create and copy issue templates
  await setupIssueTemplates(projectPath, projectName)

  // Copy GitHub workflow files
  if (await fs.pathExists(path.join(TEMPLATE_DIR, ".github", "workflows"))) {
    await fs.mkdir(path.join(projectPath, ".github", "workflows"), { recursive: true })

    const workflowFiles = await fs.readdir(path.join(TEMPLATE_DIR, ".github", "workflows"))

    for (const file of workflowFiles) {
      await fs.copy(
        path.join(TEMPLATE_DIR, ".github", "workflows", file),
        path.join(projectPath, ".github", "workflows", file),
      )
    }

    console.log(chalk.green("Copied GitHub workflow files"))
  }

  // Update CODE_OF_CONDUCT.md
  if (await fs.pathExists(path.join(TEMPLATE_DIR, ".github", "CODE_OF_CONDUCT.md"))) {
    await fs.copy(
      path.join(TEMPLATE_DIR, ".github", "CODE_OF_CONDUCT.md"),
      path.join(projectPath, ".github", "CODE_OF_CONDUCT.md"),
    )
  }

  // Update CONTRIBUTING.md
  if (await fs.pathExists(path.join(TEMPLATE_DIR, ".github", "CONTRIBUTING.md"))) {
    let contributingContent = await fs.readFile(
      path.join(TEMPLATE_DIR, ".github", "CONTRIBUTING.md"),
      "utf8",
    )

    // Update project name
    contributingContent = contributingContent.replace(/{{projectName}}/g, projectName)

    // Update project structure based on folders
    const foldersList = folders
      .map(folder => `   - \`${folder}\` is the folder for ${getFolderDescription(folder)}.`)
      .join("\n")

    // Replace the project structure section
    contributingContent = contributingContent.replace(
      // biome-ignore lint/performance/useTopLevelRegex:
      /{{projectStructure}}/s,
      `1. We are using:
   - \`Next.js\` for the full stack framework.
   - \`Tailwind CSS\` for the styling.
   - \`TypeScript\` for the type system.
   - \`pnpm\` for the package manager.
2. The Project Structure is as follows:
${foldersList}`,
    )

    await fs.writeFile(path.join(projectPath, ".github", "CONTRIBUTING.md"), contributingContent)
    console.log(chalk.green("Updated CONTRIBUTING.md"))
  }

  // Update PULL_REQUEST_TEMPLATE.md
  if (await fs.pathExists(path.join(TEMPLATE_DIR, ".github", "PULL_REQUEST_TEMPLATE.md"))) {
    let prTemplateContent = await fs.readFile(
      path.join(TEMPLATE_DIR, ".github", "PULL_REQUEST_TEMPLATE.md"),
      "utf8",
    )

    if (useI18n) {
      // Keep the language section but update available languages
      const languageSection = languages
        .map(lang => {
          if (lang === "en") return "- [ ] English"
          if (lang === "zh-CN") return "- [ ] 简体中文 (Simplified Chinese)"
          if (lang === "zh-TW") return "- [ ] 繁體中文 (Traditional Chinese)"
          return `- [ ] ${lang}`
        })
        .join("\n")

      prTemplateContent = prTemplateContent.replace(
        // biome-ignore lint/performance/useTopLevelRegex:
        /{{languageSection}}/s,
        `## Language (if applicable)\n\n${languageSection}`,
      )
    } else {
      // Remove the language section if not using i18n
      // biome-ignore lint/performance/useTopLevelRegex:
      prTemplateContent = prTemplateContent.replace(/\n{{languageSection}}/s, "")
    }

    await fs.writeFile(path.join(projectPath, ".github", "PULL_REQUEST_TEMPLATE.md"), prTemplateContent)
    console.log(chalk.green("Updated PULL_REQUEST_TEMPLATE.md"))
  }

  // Update SUPPORT.md
  if (await fs.pathExists(path.join(TEMPLATE_DIR, ".github", "SUPPORT.md"))) {
    let supportContent = await fs.readFile(path.join(TEMPLATE_DIR, ".github", "SUPPORT.md"), "utf8")

    // Update issue address placeholder
    supportContent = supportContent.replace(
      /{address}/g,
      `https://github.com/li-dao-dev/${projectName}/issues`,
    )

    await fs.writeFile(path.join(projectPath, ".github", "SUPPORT.md"), supportContent)
    console.log(chalk.green("Updated SUPPORT.md"))
  }
}

/**
 * Set up GitHub issue templates
 */
async function setupIssueTemplates(projectPath: string, projectName: string): Promise<void> {
  const issueTemplateDir = path.join(TEMPLATE_DIR, ".github", "ISSUE_TEMPLATE")
  const targetDir = path.join(projectPath, ".github", "ISSUE_TEMPLATE")

  // Check if issue templates exist in template directory
  if (await fs.pathExists(issueTemplateDir)) {
    // Create directory and copy all templates
    await fs.mkdir(targetDir, { recursive: true })
    await fs.copy(issueTemplateDir, targetDir)

    // Update question template with the correct project name
    const questionTemplatePath = path.join(targetDir, "question.yml")
    if (await fs.pathExists(questionTemplatePath)) {
      let questionContent = await fs.readFile(questionTemplatePath, "utf8")
      questionContent = questionContent.replace(
        /li-dao-dev\/create-li-next-project\/issues/g,
        `li-dao-dev/${projectName}/issues`,
      )
      await fs.writeFile(questionTemplatePath, questionContent)
    }

    console.log(chalk.green("Copied GitHub issue templates"))
  } else {
    console.log(chalk.yellow("No issue templates found in template directory. Skipping."))
  }
}

/**
 * Set up Next.js configuration
 */
async function setupNextConfig(projectPath: string, useI18n: boolean, languages: string[]): Promise<void> {
  if (useI18n) {
    const defaultLocale = languages.includes("en") ? "en" : languages[0]
    // Create a basic next.config.ts without i18n
    const i18nConfig = `import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const nextConfig: NextConfig = {
  /* config options here */
}

const withNextIntl = createNextIntlPlugin({
  requestConfig: "./i18n/request.ts",
  experimental: {
    createMessagesDeclaration: ["./i18n/translations/${defaultLocale}/HomePage.json"],
  },
})

// biome-ignore lint/style/noDefaultExport: next.config.ts
export default withNextIntl(nextConfig)

`
    await fs.writeFile(path.join(projectPath, "next.config.ts"), i18nConfig)
    console.log(chalk.green("Created customized next.config.ts with i18n support"))
  } else {
    // Create a basic next.config.ts without i18n
    const basicConfig = `import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /* config options here */
}

// biome-ignore lint/style/noDefaultExport: next.config.ts
export default nextConfig
`
    await fs.writeFile(path.join(projectPath, "next.config.ts"), basicConfig)
    console.log(chalk.green("Created basic next.config.ts"))
  }
}

/**
 * Get a description for a folder
 */
function getFolderDescription(folder: string): string {
  switch (folder) {
    case "app":
      return "the App Router"
    case "components":
      return "reusable UI components"
    case "public":
      return "static files"
    case "styles":
      return "global styles and CSS modules"
    case "lib":
      return "utility functions and shared code"
    default:
      return `the ${folder} content`
  }
}

/**
 * Setup the app folder with basic files
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity:
async function setupAppFolder(
  projectPath: string,
  useI18n: boolean,
  languages: string[],
  useNextThemes: boolean,
  allowSystemTheme: boolean,
  folders: string[],
): Promise<void> {
  if (useI18n) {
    // Create app/[locale] structure for i18n
    await fs.mkdir(path.join(projectPath, "app", "[locale]"), { recursive: true })

    // Create a simple page.tsx in the [locale] folder
    const pageContent = `import type { routing } from "@/i18n/routing.ts"
import { getTranslations } from "next-intl/server"${
      useNextThemes
        ? `\nimport { SimpleThemeSwitcher } from "${folders.includes("components") ? "@/components" : "@/app"}/SimpleThemeSwitcher.tsx"`
        : ""
    }

// biome-ignore lint/style/noDefaultExport: page.tsx
export default async function Home({
  params,
}: { params: Promise<{ locale: (typeof routing.locales)[number] }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "HomePage" })

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="flex gap-4">
        <div className="flex flex-col">
          <div>
            <h1 className="font-bold text-4xl">{t("title")}</h1>
          </div>
          <div>
            <p className="text-secondary-text text-xm">{t("hello")}</p>
          </div>
        </div>
        <div className="flex justify-center items-center bg-secondary rounded-full size-16">
          <p className="font-medium text-primary text-5xl">LI</p>
        </div>${useNextThemes ? "\n        <SimpleThemeSwitcher />" : ""}
      </div>
    </div>
  )
}
`
    await fs.writeFile(path.join(projectPath, "app", "[locale]", "page.tsx"), pageContent)
    console.log(chalk.green("Created app/[locale]/page.tsx"))

    // Create layout.tsx with theme support if enabled
    const layoutImports = `import { routing } from "@/i18n/routing.ts"
import { NextIntlClientProvider, hasLocale } from "next-intl"
import { setRequestLocale } from "next-intl/server"${
      useNextThemes ? `\nimport { ThemeProvider } from "next-themes"` : ""
    }
import { notFound } from "next/navigation"
import type { ReactNode } from "react"${
      languages.includes("zh-CN") ? '\nimport { Noto_Sans_SC, Noto_Serif_SC } from "next/font/google"' : ""
    }${
      languages.includes("zh-TW") ? '\nimport { Noto_Sans_TC, Noto_Serif_TC } from "next/font/google"' : ""
    }${languages.includes("en") ? '\nimport { Merriweather, Roboto } from "next/font/google"' : ""}
`

    const fontConfig = `${
      languages.includes("zh-CN")
        ? `const NotoSansScFont = Noto_Sans_SC({
  weight: ["300", "400", "500", "700"],
  preload: false,
  variable: "--font-sans-next",
})

const NotoSerifScFont = Noto_Serif_SC({
  weight: ["300", "400", "500", "700"],
  variable: "--font-serif-next",
  subsets: ["latin"],
  preload: false,
})

`
        : ""
    }${
      languages.includes("zh-TW")
        ? `const NotoSansTcFont = Noto_Sans_TC({
  weight: ["300", "400", "500", "700"],
  variable: "--font-sans-next",
  preload: false,
})

const NotoSerifTcFont = Noto_Serif_TC({
  weight: ["300", "400", "500", "700"],
  variable: "--font-serif-next",
  preload: false,
})

`
        : ""
    }${
      languages.includes("en")
        ? `const RobotoFont = Roboto({
  weight: ["300", "400", "500", "700"],
  variable: "--font-sans-next",
  subsets: ["latin"],
  preload: false,
})

const MerriweatherFont = Merriweather({
  weight: ["300", "400", "700"],
  variable: "--font-serif-next",
  preload: false,
})

`
        : ""
    }`

    const staticParams = `export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }))
}
`

    const layoutFunction = `// biome-ignore lint/style/noDefaultExport: layout.tsx
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
    {${
      languages.includes("en") ? "\n      en: `${RobotoFont.variable} ${MerriweatherFont.variable}`," : ""
    }${
      languages.includes("zh-CN")
        ? '\n      "zh-CN": `${NotoSansScFont.variable} ${NotoSerifScFont.variable}`,'
        : ""
    }${
      languages.includes("zh-TW")
        ? '\n      "zh-TW": `${NotoSansTcFont.variable} ${NotoSerifTcFont.variable}`,'
        : ""
    }
    }[locale] ?? \`\${NotoSansScFont.variable} \${NotoSerifScFont.variable}\`

  return (
    <html class={fontClassName} lang={locale} suppressHydrationWarning={${useNextThemes}}>
      <body>
        <NextIntlClientProvider>
          ${
            useNextThemes
              ? `<ThemeProvider attribute="data-theme" defaultTheme="${allowSystemTheme ? "system" : "light"}" enableSystem={${allowSystemTheme}}>
            {children}
          </ThemeProvider>`
              : "{children}"
          }
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
`

    const layoutContent = `${layoutImports}import '${folders.includes("styles") ? "@/styles" : ".."}/globals.css'\n\n${fontConfig}${staticParams}${layoutFunction}`

    await fs.writeFile(path.join(projectPath, "app", "[locale]", "layout.tsx"), layoutContent)
    console.log(chalk.green("Created app/[locale]/layout.tsx"))
  } else {
    // Create non-i18n app structure
    const pageContent = `${useNextThemes ? `import { SimpleThemeSwitcher } from "${folders.includes("components") ? "@/components" : "@/app"}/SimpleThemeSwitcher.tsx"` : ""}

// biome-ignore lint/style/noDefaultExport: page.tsx
export default async function Home() {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="flex gap-4">
        <div className="flex flex-col">
          <div>
            <h1 className="font-bold text-4xl">Home</h1>
          </div>
          <div>
            <p className="text-secondary-text text-xm">Hello Community</p>
          </div>
        </div>
        <div className="flex justify-center items-center bg-secondary rounded-full size-16">
          <p className="font-medium text-primary text-5xl">LI</p>
        </div>${useNextThemes ? "\n        <SimpleThemeSwitcher />" : ""}
      </div>
    </div>
  )
}

`
    await fs.writeFile(path.join(projectPath, "app", "page.tsx"), pageContent)
    console.log(chalk.green("Created app/page.tsx"))

    // Create layout.tsx with theme support if enabled
    const layoutContent = `import { Merriweather, Roboto } from "next/font/google"
import "${folders.includes("styles") ? "@/styles" : "."}/globals.css"

const RobotoFont = Roboto({
  weight: ["300", "400", "500", "700"],
  variable: "--font-sans-next",
  subsets: ["latin"],
  preload: false,
})

const MerriweatherFont = Merriweather({
  weight: ["300", "400", "700"],
  variable: "--font-serif-next",
  preload: false,
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={\`\${RobotoFont.variable} \${MerriweatherFont.variable}\`} suppressHydrationWarning={${useNextThemes}}>
      <body>
        ${
          useNextThemes
            ? `<ThemeProvider attribute="data-theme" defaultTheme="${allowSystemTheme ? "system" : "light"}" enableSystem={${allowSystemTheme}}>
          {children}
        </ThemeProvider>`
            : "{children}"
        }
      </body>
    </html>
  )
}
`

    const finalLayoutContent = useNextThemes
      ? `import { ThemeProvider } from 'next-themes'\n${layoutContent}`
      : layoutContent

    await fs.writeFile(path.join(projectPath, "app", "layout.tsx"), finalLayoutContent)
    console.log(chalk.green("Created app/layout.tsx"))
  }
}

/**
 * Run commands after project creation
 */
async function runPostCreationCommands(projectPath: string, projectName: string): Promise<void> {
  console.log(chalk.cyan("\nInitializing project..."))

  try {
    // Change directory to the project directory
    process.chdir(projectPath)

    // Initialize git repository
    console.log(chalk.cyan("\nInitializing git repository..."))
    await execa("git", ["init"])
    console.log(chalk.green("Git repository initialized"))

    // Check if pnpm is available
    console.log(chalk.cyan("\nChecking for package manager..."))
    try {
      // Verify pnpm is installed
      await execa("pnpm", ["--version"])

      // Install dependencies with pnpm
      console.log(chalk.cyan("Installing dependencies with pnpm..."))
      await execa("pnpm", ["install"], { stdio: "inherit" })
      console.log(chalk.green("Dependencies installed with pnpm"))
    } catch {
      // pnpm not available, notify user
      console.log(chalk.yellow("pnpm not found. Please install pnpm to install dependencies."))
      console.log(chalk.yellow("Visit https://pnpm.io/installation for installation instructions."))
    }

    // Check for pre-commit and install hooks if available
    try {
      console.log(chalk.cyan("\nChecking for pre-commit..."))
      await execa("pre-commit", ["--version"])

      // Install pre-commit hooks
      console.log(chalk.cyan("Installing pre-commit hooks..."))
      await execa("pre-commit", ["install"])
      await execa("git", ["add", "."])
      await execa("pre-commit", ["run", "--all-files"])
      console.log(chalk.green("Pre-commit hooks installed"))
    } catch {
      console.log(chalk.yellow("pre-commit not found. Skipping pre-commit hooks installation."))
      console.log(
        chalk.yellow(
          "To install pre-commit hooks manually, run 'pre-commit install' after installing pre-commit.",
        ),
      )
    }

    // Initial git commit
    console.log(chalk.cyan("\nCreating initial commit..."))
    await execa("git", ["add", "."])
    await execa("git", ["commit", "-m", "Initial commit from create-li-next-project"])
    console.log(chalk.green("Initial commit created"))

    console.log(chalk.green("\nProject initialization complete!"))
    console.log(`\nTo get started:
${chalk.cyan(`cd ${projectName}`)}
${chalk.cyan("pnpm dev")}
`)
  } catch (error) {
    console.error("Error during post-creation commands:", error)
    console.log(`\nTo get started manually:
${chalk.cyan(`cd ${projectName}`)}
${chalk.cyan("git init && git add .")}
${chalk.cyan("pnpm install")}
${chalk.cyan("pre-commit install")} ${chalk.gray("# if pre-commit is available")}
${chalk.cyan("pnpm dev")}
`)
  }
}

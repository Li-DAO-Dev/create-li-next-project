<!-- markdownlint-disable no-inline-html first-line-h1 -->

<div align="center">

# create-li-next-project

*A CLI tool to scaffold Next.js projects with Li Community standards and practices.*

[![npm version](https://img.shields.io/npm/v/@li-dao-dev/create-li-next-project.svg)](https://www.npmjs.com/package/@li-dao-dev/create-li-next-project)
[![License](https://img.shields.io/npm/l/@li-dao-dev/create-li-next-project.svg)](https://github.com/li-dao-dev/create-li-next-project/blob/main/LICENSE)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/li-dao-dev/create-li-next-project/publish.yml?label=publish)](https://github.com/li-dao-dev/create-li-next-project/actions)

</div>

## Features

- 🚀 **Rapid Project Setup**: Create a fully configured Next.js project in seconds
- 🌐 **Internationalization Support**: Optional i18n setup with next-intl
- 🎨 **Theme Support**: Optional dark/light mode with next-themes
- 📁 **Customizable Structure**: Choose which folders to include in your project
- 🔧 **Li Community Standards**: Pre-configured with best practices
- 📦 **GitHub Templates**: Issue templates, PR templates, and workflows included

## Usage

```bash
# Using npx (npm)
npx @li-dao-dev/create-li-next-project

# Using pnpm
pnpm dlx @li-dao-dev/create-li-next-project

# Using yarn
yarn dlx @li-dao-dev/create-li-next-project

# Global installation
npm install -g @li-dao-dev/create-li-next-project
create-li-next-project
```

## Scaffold Options

The CLI will guide you through a series of prompts to customize your project:

### Project Name

Enter a name for your project. It must contain only letters, numbers, dashes, and underscores.

### Folder Structure

Choose which folders to include in your project:

- `app` (always included - Next.js App Router)
- `components` (for reusable UI components)
- `styles` (for global styles and CSS modules)
- `lib` (for utility functions and shared code)
- `public` (for static files)

### Internationalization (i18n)

Optionally set up i18n support with next-intl. If enabled, you can select from:

- English (en)
- Simplified Chinese (zh-CN)
- Traditional Chinese (zh-TW)

### Theme Support

Optionally add dark/light mode support using next-themes:

- Choose whether to use next-themes
- Configure system theme preference detection

## What's Included

When you create a project with `create-li-next-project`, you get:

### Project Structure

- Modern Next.js App Router setup
- TypeScript configuration with proper path aliases
- Tailwind CSS integration
- Biome for linting and formatting
- Pre-commit hooks for code quality

### GitHub Setup

- Workflow templates for CI/CD
- Issue templates for bug reports, feature requests, and questions
- Pull request template with contribution guidelines
- Security policy and support documentation

### Development Experience

- VSCode configuration
- Editor settings for consistent formatting
- Spell checking configuration
- Git ignore patterns

## Contributing

See [CONTRIBUTING.md](https://github.com/li-dao-dev/create-li-next-project/blob/main/.github/CONTRIBUTING.md) for details on how to contribute to this project.

## License

[AGPL-3.0](https://github.com/li-dao-dev/create-li-next-project/blob/main/LICENSE)

## About Li Community

\$LI will establish a unique community ecosystem dedicated to promoting press freedom and human rights, particularly in authoritarian states like China. This ecosystem will grow and evolve alongside the $LI token, fostering collective progress toward these critical values.

---

<div align="center">
  Made with ❤️ by the [Li Community](https://li-dao.org)
</div>

#!/usr/bin/env node

import chalk from "chalk"
import inquirer from "inquirer"
import { generateProject } from "./templateGenerator.js"

const NAME_REGEX = /^[a-zA-Z0-9-_]+$/

// Get the directory of the current module

console.log(chalk.blue("Welcome to create-li-next-project!"))
console.log(chalk.green("Let's set up your Next.js project for the Li Community.\n"))

async function main() {
  try {
    // Ask user for project configuration
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "projectName",
        message: "What is the name of your project?",
        default: "my-li-next-app",
        validate: (input: string) => {
          if (NAME_REGEX.test(input)) return true
          return "Project name may only contain letters, numbers, dashes, and underscores."
        },
      },
      {
        type: "checkbox",
        name: "folders",
        message: "Which folders would you like to create in your project?",
        choices: [
          { name: "app", value: "app", checked: true, disabled: "Required" },
          { name: "components", value: "components", checked: true },
          { name: "styles", value: "styles", checked: true },
          { name: "lib", value: "lib", checked: true },
          { name: "public", value: "public", checked: true },
        ],
      },
      {
        type: "confirm",
        name: "useI18n",
        message: "Would you like to use i18n?",
        default: false,
      },
      {
        type: "checkbox",
        name: "languages",
        message: "Select languages to include:",
        choices: [
          { name: "English (en)", value: "en", checked: true },
          { name: "Simplified Chinese (zh-CN)", value: "zh-CN" },
          { name: "Traditional Chinese (zh-TW)", value: "zh-TW" },
        ],
        when: answers => answers.useI18n,
        validate: input => {
          if (input.length === 0) {
            return "You must choose at least one language."
          }
          return true
        },
      },
      {
        type: "confirm",
        name: "useNextThemes",
        message: "Would you like to use next-themes for dark/light mode?",
        default: false,
      },
      {
        type: "confirm",
        name: "allowSystemTheme",
        message: "Allow system theme preference?",
        default: true,
        when: answers => answers.useNextThemes,
      },
    ])

    // Always ensure 'app' is in the folders array
    answers.folders.push("app")

    console.log("\n")
    console.log(chalk.blue("Creating your project with the following configuration:"))
    console.log(chalk.green(`Project name: ${answers.projectName}`))
    console.log(chalk.green(`Folders: ${answers.folders.join(", ")}`))
    console.log(chalk.green(`Using i18n: ${answers.useI18n ? "Yes" : "No"}`))
    if (answers.useI18n) {
      console.log(chalk.green(`Languages: ${answers.languages.join(", ")}`))
    }
    console.log(chalk.green(`Using next-themes: ${answers.useNextThemes ? "Yes" : "No"}`))
    if (answers.useNextThemes) {
      console.log(chalk.green(`Allow system theme: ${answers.allowSystemTheme ? "Yes" : "No"}`))
    }
    console.log("\n")

    // Generate the project using the template generator
    await generateProject({
      projectName: answers.projectName,
      folders: answers.folders,
      useI18n: answers.useI18n,
      languages: answers.languages || [],
      useNextThemes: answers.useNextThemes,
      allowSystemTheme: answers.allowSystemTheme,
    })
  } catch (error) {
    console.error(chalk.red("An error occurred:"), error)
    process.exit(1)
  }
}

main()

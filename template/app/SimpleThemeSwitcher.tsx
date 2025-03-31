"use client"

import { useTheme } from "next-themes"

export function SimpleThemeSwitcher() {
  const { themes, setTheme, theme } = useTheme()

  return (
    <select onChange={e => setTheme(e.target.value)} value={theme}>
      {themes.map(t => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  )
}

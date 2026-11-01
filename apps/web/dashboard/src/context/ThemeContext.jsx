/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { applyTheme, readTheme, themes, THEME_STORAGE_KEY } from '../theme'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readTheme)
  const selectTheme = (id) => {
    const next = themes.find((item) => item.id === id)
    if (!next) return
    applyTheme(next)
    setTheme(next)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, id)
    } catch {
      /* The current session still works when storage is blocked. */
    }
  }
  useEffect(() => {
    const sync = (event) => {
      if (event.key === THEME_STORAGE_KEY || event.key === null) {
        const next = readTheme()
        applyTheme(next)
        setTheme(next)
      }
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])
  return <ThemeContext.Provider value={{ theme, selectTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)

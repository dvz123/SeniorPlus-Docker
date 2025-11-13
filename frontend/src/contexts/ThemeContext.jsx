import { createContext, useState, useContext, useEffect } from "react"

const ThemeContext = createContext()

export const useTheme = () => useContext(ThemeContext)

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    // Verificar se há uma preferência salva no localStorage
    const savedTheme = localStorage.getItem("theme")
    // Verificar se o sistema do usuário prefere modo escuro
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches

    return savedTheme ? savedTheme === "dark" : false
  })

  useEffect(() => {
    // Atualizar o localStorage quando o tema mudar
    localStorage.setItem("theme", darkMode ? "dark" : "light")

    // Atualizar a classe no elemento HTML
    if (darkMode) {
      document.documentElement.classList.add("dark-mode")
    } else {
      document.documentElement.classList.remove("dark-mode")
    }
  }, [darkMode])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  return <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>{children}</ThemeContext.Provider>
}

import React, { useState } from 'react'

import loadTheme, { themes } from 'themes/loadTheme'

const ThemeContext = React.createContext(null)

export default ThemeContext

const ThemeProvider = ({children}) => {
  const [themeName, setThemeName] = useState('sunsetblue')
  const [theme, setTheme] = useState(loadTheme(themes[1]))

  const handleChangeTheme = theme => {
    setThemeName(theme)
    setTheme(loadTheme(theme))
  }

  return (
    <ThemeContext.Provider value={{theme, themeName, setTheme: handleChangeTheme}}>
      {children}
    </ThemeContext.Provider>
  )
}

export {ThemeProvider}
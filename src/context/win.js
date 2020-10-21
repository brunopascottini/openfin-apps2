import React, { useState, useEffect } from 'react'

import throttle from 'lodash.throttle'

const WinContext = React.createContext({
  width: window.innerWidth,
  height: window.innerHeight
})

export default WinContext

export const WinProvider = ({children}) => {
  const [win, setWin] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  })

  useEffect(() => {
    const handleResize = throttle(() => {
      setWin({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }, 300)
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <WinContext.Provider value={win}>
      {children}
    </WinContext.Provider>
  )
}
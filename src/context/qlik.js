import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

import { openSession, closeSession } from '../helpers/qlikApp.js'

const QlikContext = React.createContext(null)
export default QlikContext

const QlikProvider = ({children}) => {
  const [app, setApp] = useState(null)
  const [computing, setComputing] = useState(false)

  useEffect(() => {
    openSession().then(app => {
      setApp(app)
    })
    return closeSession
  }, [])

  return (
    <>
      { !app ? <p>Loading...</p> : 
      <QlikContext.Provider value={{app, computing, setComputing}}>
        {children}
      </QlikContext.Provider> }
    </>
  )
}

QlikProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
}
QlikProvider.defaultProps = {
  children: null,
}

export { QlikProvider }
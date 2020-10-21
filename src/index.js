import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import * as serviceWorker from './serviceWorker'

import GlobalProvider from './context/GlobalProvider'

ReactDOM.render(
  // this global provider combines contexts for the qlik api, object state, selection state, theming and viewport size tracking
  <GlobalProvider>
    <App />
  </GlobalProvider>
  , document.getElementById('root')
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()

import React from 'react'

import { WinProvider } from './win'
import { ThemeProvider } from './theme'
import { QlikProvider } from './qlik'
import { SelectionsProvider } from './selections'
import { ObjectsProvider } from './objects'

export default function GlobalProvider({ children }) {
  return (
    // Any of the below contexts containing functionality not needed can simply be removed from the provider tree here.
    // Note that selections requires the objects provider to work correctly, but the object state management can be kept without selections.
    // Do not remove QlikProvider - this provides global access to the Enigma.js library
    <QlikProvider>
      <WinProvider>
        <ThemeProvider>
          <ObjectsProvider>
            <SelectionsProvider>
              {children}
            </SelectionsProvider>
          </ObjectsProvider>
        </ThemeProvider>
      </WinProvider>
    </QlikProvider>
  )
}

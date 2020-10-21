import React, { useState, useContext, useCallback } from 'react'

import qlikContext from 'context/qlik'

const ObjectsContext = React.createContext(null)
export default ObjectsContext

const ObjectsProvider = ({ children }) => {
  const {app, computing} = useContext(qlikContext)

  const [objects, setObjects] = useState([])

  // state updates
  const saveObjectToState = useCallback(newObj => {
    setObjects(curr => [...curr, newObj])
  }, [])
  const removeObjectFromState = useCallback(id => {
    const i = objects.findIndex(x => x.id === id)
    setObjects(curr => {
      const next = [...curr].splice(i, 1)
      return next
    })
  }, [objects])

  // logic
  const getObject = useCallback(async id => {
    let model
    try {
      model = await app.getObject(id)
    }
    catch(err) {
      console.log(err)
      throw new Error(`Whoops, couldn't find the requested object with id "${id}", in the connected qlik app. Please check the object id and try again`)
    }
    const props = await model.getProperties()
    props.qHyperCubeDef.qInitialDataFetch = [{ qTop: 0, qLeft: 0, qWidth: 10, qHeight: 100 }]
    await model.setProperties(props)
    saveObjectToState({ 
      id: model.id,
      type: 'cube'
    })
    return model
  }, [app, saveObjectToState])

  const createObject = useCallback(async (type, def, ref) => {
    let qType, key
    switch(type) {
      case 'cube':
        qType = 'qHyperCube'
        key = 'qHyperCubeDef'
        break
      case 'list':
        qType = 'qListObject'
        key = 'qListObjectDef'
        break
      case 'selections':
        qType = 'CurrentSelections'
        key = 'qSelectionObjectDef'
        break
      default:
        qType = null
        key = null
        break
    }
    let objDef
    if(qType && key) {
      objDef = {
        qInfo: {
          qType: ref || qType
        },
        [key]: def || {}
      }
    } else {
      objDef = type
    }
    return app.createSessionObject(objDef)
    .then(model => {
      saveObjectToState({ 
        id: model.id,
        type: type,
        ref
      })
      return model
    })
  }, [app, saveObjectToState])

  const timer = () => new Promise(res => setTimeout(res, 200))

  const getObjectLayout = useCallback(async model => {
    for(var i=0; i<20; i++) {
      if(!computing) {
        let layout
        while(!layout) {
          try {
            layout = await model.getLayout()
          }
          catch(err) {
            await timer()
          }
        }
        return layout
      }
    }
  }, [computing])

  const destroyObject = useCallback(async id => {
    await app.destroySessionObject(id)
    removeObjectFromState(id)
  }, [app, removeObjectFromState])

  return (
    <ObjectsContext.Provider 
      value={{
        objects,
        createObject,
        getObject,
        getObjectLayout,
        destroyObject,
      }}
    >
      {children}
    </ObjectsContext.Provider>
  )
}

export { ObjectsProvider }
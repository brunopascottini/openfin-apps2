import React, { useState, useEffect, useContext, useCallback } from 'react'

import QlikContext from 'context/qlik'
import ObjectsContext from 'context/objects'
import {getApiFromType} from 'helpers'

const SelectionsContext = React.createContext(null)
export default SelectionsContext

const SelectionsProvider = ({ children }) => {
  const {app, setComputing} = useContext(QlikContext)
  const {objects, createObject, destroyObject} = useContext(ObjectsContext)

  const [state, setState] = useState({
    selectedModelId: null,
    selectedModelType: null,
    isSelecting: false,
    values: []
  })

  const [modelId, setModelId] = useState(null)

  // state updates
  const saveSelectionsStart = useCallback(payload => {
    const { id, type, values } = payload
    setState(curr => ({
      ...curr,
      selectedModelId: id,
      selectedModelType: type,
      isSelecting: true,
      values: values || []
    }))
  }, [])
  const saveSelectionsEnd = useCallback(() => {
    setState(curr => ({
      ...curr,
      selectedModelId: null,
      selectedModelType: null,
      isSelecting: false,
      values: []
    }))
  }, [])
  const updateSelectedValues = useCallback(values => {
    setState(curr => ({
      ...curr,
      values: values
    }))
  }, [])
  
  const stopIfSelecting = useCallback(async id => {
    const { isSelecting, selectedModelId } = state
    if(!isSelecting || selectedModelId === id) {
      return
    }
    try {
      const model = await app.getObject(selectedModelId)
      setComputing(true)
      await model.endSelections(true)
      setComputing(false)
    }
    catch(err) {
      return new Error(`Couldn't end selections on ${selectedModelId}`)
    }
  }, [app, setComputing, state])

  // logic
  const beginSelections = useCallback(async id => {
    try {
      await stopIfSelecting(id)
      const { selectedModelId } = state
      const { type } = objects.find(x => x.id === id)
      const { path } = getApiFromType(type)
  
      if(selectedModelId !== id) {
        const model = await app.getObject(id)
        setComputing(true)
        await model.beginSelections([path])
        setComputing(false)
        saveSelectionsStart({ id, type })
      } 
      return
    }
    catch(err) {
      return new Error(`Couldn't begin selections on ${id} - ${err}`)
    }
  }, [app, objects, saveSelectionsStart, setComputing, state, stopIfSelecting])

  
  const endSelections = useCallback(async saveChanges => {
    if(typeof saveChanges === 'undefined') {
      throw new Error("'Save changes' boolean parameter is required for endSelections method")
    }
    const { selectedModelId, isSelecting } = state
    try {
      const model = await app.getObject(selectedModelId)
      if(!isSelecting) {
        return Promise.resolve("No selections in progress")
      }
      setComputing(true)
      await model.endSelections(saveChanges)
      setComputing(false)
      return saveSelectionsEnd()
    }
    catch(err) {
      return new Error(`Couldn't end selections - ${err}`)
    }
  }, [app, saveSelectionsEnd, setComputing, state])
  
  const selectValues = useCallback(async (id, values, toggle) => {
    try {
      const { type } = objects.find(x => x.id === id)
      if(!type) {
        throw new Error(`Whoops, specified object not found (ObjectID ${id})`)
      }
  
      await beginSelections(id)
  
      if(typeof toggle === 'undefined') {
        toggle = state.values.length > 0 && state.selectedModelId === id ? true : false
      }
  
      const model = await app.getObject(id)
      setComputing(true)
      if(type === 'cube') {
        await model.selectHyperCubeValues('/qHyperCubeDef', 0, values, toggle)
      } else if(type === 'list') {
        await model.selectListObjectValues('/qListObjectDef', values, toggle)
      } else {
        return new Error('NOT IMPLEMENTED FOR OBJECT TYPE' + type)
      }
      setComputing(false)
      let stateValues = [...state.values]
      values.forEach(x => {
        const i = stateValues.findIndex(v => v === x)
        if(i > -1) {
          stateValues[i] = null
        } else {
          stateValues.push(x)
        }
      })
      stateValues = stateValues.filter(x => x !== null)
      updateSelectedValues(state.selectedModelId === id ? stateValues : values)
      if(stateValues.length === 0) {
        await endSelections(false)
      }
      
      return Promise.resolve(state.values)
    }
    catch(err) {
      throw new Error("Error selecting values - " + err)
    }
  }, [app, beginSelections, endSelections, objects, setComputing, state.values, updateSelectedValues])
  
  const clearFieldSelections = useCallback(async qFieldName => {
    try {
      const field = await app.getField(qFieldName)
      field.clear()
      return Promise.resolve(`Cleared ${qFieldName} selections`)
    }
    catch(err) {
      return new Error("Error clearing field selections", err)
    }
  }, [app])

  useEffect(() => {
    createObject('selections').then(model => {
      setModelId(model.id)
    })
    return () => {
      if(modelId) { 
        destroyObject(modelId)
      }
    }
  }, [])

  return (
    <>
      { modelId ? 
        <SelectionsContext.Provider 
          value={{
            selections: state,
            beginSelections,
            selectValues,
            endSelections,
            clearFieldSelections
          }}
        >
          {children}
        </SelectionsContext.Provider> : 
        <p>Loading</p> }
    </>
  )
}

export { SelectionsProvider }
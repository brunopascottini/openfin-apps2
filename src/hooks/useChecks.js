import { useContext, useCallback } from 'react'
import QlikContext from 'context/qlik'
import {ordinalize} from 'helpers'

export default function useChecks(value) {
  const {app} = useContext(QlikContext)
  
  const dimMeasureCheck = useCallback(async (dims, measures, compName) => {
    for(const [i, dim] of dims.entries()) {
      const field = dim.field || dim
      try {
        await app.getField(field)
      }
      catch(err) {
        throw new Error(`The field '${field}', passed as the ${ordinalize(i+1)} dimension to a ${compName} component was not found in the connected Qlik app. Please check that the value has been passed correctly, and that it is a field not a master dimension.`)
      }
    }
    for(const [i, measure] of measures.entries()) {
      const formula = measure.formula || measure
      const isValid = await app.checkExpression(formula)
      if(isValid.qErrorMsg) {
        throw new Error(`The measure '${formula}', passed as the ${ordinalize(i+1)} measure to a ${compName} component was flagged as having invalid syntax by the connected Qlik app.
  Please check your expression syntax and ensure there are no typos`)
      }
      if(isValid.qBadFieldNames.length > 0) {
        throw new Error(`The measure '${formula}', passed as the ${ordinalize(i+1)} measure to a ${compName} component was flagged by the connected Qlik app as containing an invalid field. 
  Please check that the value has been passed correctly, and is a valid Qlik sense expression containing fields which exist in the connected app.`)
      }
      if(isValid.qDangerousFieldNames.length > 0) {
        console.warn(`The measure '${formula}', passed as the ${ordinalize(i+1)} measure to a ${compName} component was flagged by the connected Qlik app as containing a dangerous field.`)
      }
    }
  }, [app])

  return {dimMeasureCheck}
}
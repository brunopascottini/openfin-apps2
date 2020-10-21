import React, { useState, useEffect, useRef, useCallback, useContext } from 'react'

import styled from 'styled-components'

import IconButton from 'components/atoms/IconButton'

import { ReactComponent as StepBackIcon } from 'assets/icons/step_back.svg'
import { ReactComponent as StepForwardIcon } from 'assets/icons/step_next.svg'
import { ReactComponent as CancelIcon } from 'assets/icons/cancel.svg'

import ObjectsContext from 'context/objects'
import SelectionsContext from 'context/selections'
import QlikContext from 'context/qlik'

import SelectionsFieldList from 'components/molecules/SelectionsFieldList'

const selectionBarHeight = '46px'

const SelectionBarContainer = styled.div`
  display: grid;
  grid-template-columns: 100px 1fr;
  height: ${selectionBarHeight};
  background-color: #f2f2f2;
  border: 1px solid #d9d9d9;
  & > div {
    box-sizing: border-box;
    &:nth-of-type(1) {
      border-right: 1px solid #d9d9d9;
    }
    &:nth-of-type(2) {
      background-color: #e6e6e6;
      > div {
        border-right: 1px solid #d9d9d9;
      }
    }
  }
`

const OptionsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0 6px;
`

const FieldsContainer = styled.div`
  display: flex;
  height: ${selectionBarHeight};
  border-bottom: 1px solid #d9d9d9;
  position: relative;
`

const FieldSummary = styled.div`
  width: 200px;
  padding: 0 10px;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 150px 22px;
  column-gap: 8px;
  align-content: center;
  font-size: 0.8em;
  overflow: hidden;
  background-color: #fff;
  cursor: pointer;
  .title {
    font-weight: 600;
  }
  .info > span {
    display: block;
    white-space: nowrap;
    font-weight: 400;
    color: #8c8c8c;
  }
  .icon {
    display: flex;
    flex-direction: column;
    justify-content: center;
    svg {
      fill: #8c8c8c;
    }
    &:hover svg {
      fill: #404040;
    }
  }
  &:hover {
    background-color: #f6f6f6
  }
`

export default function SelectionsBar() {
  const { app } = useContext(QlikContext)
  const { objects, createObject, getObjectLayout } = useContext(ObjectsContext)
  const { endSelections, clearFieldSelections } = useContext(SelectionsContext)
  
  const [fields, setFields] = useState([])

  const [model, setModel] = useState(null)

  const [selectedField, setSelectedField] = useState(null)

  const selectionBarRef = useRef()

  let isSubscribed = useRef(false)

  useEffect(() => {
    isSubscribed.current = true
    if(!model) {
      const { id } = objects.find(x => x.type === 'selections')
      app.getObject(id).then(model => {
        setModel(model)
        getObjectLayout(model).then(({qSelectionObject:e}) => {
          setFields(e.qSelections)
        })
        model.on('changed', () => {
          getObjectLayout(model).then(({qSelectionObject:e}) => {
            if(isSubscribed.current) {
              setFields(e.qSelections)
            }
          })
        })
      })
    }
    return () => {
      isSubscribed.current = false
      // if(model) {
      //   destroyObject(model.id))
      // }
    }
  }, [model, objects, createObject, getObjectLayout, app])

  useEffect(() => {
    setSelectedField(null)
  }, [fields.length])

  const stepBack = () => {
    endSelections(true).then(() => {
      app.back()
    })
  }

  const stepForward = () => {
    endSelections(true).then(() => {
      app.forward()
    })
  }

  const handleRequestClose = useCallback(() => setSelectedField(null), [])

  const handleClearFieldSelections = fieldName => {
    endSelections(true).then(() => {
      clearFieldSelections(fieldName)
      setSelectedField(null)
    })
  }

  const handleFieldClick = (x, i) => {
    setSelectedField(curr => curr && curr.info.qField === x.qField ? null : { info: x, index: i })
  }

  const handleClickAway = useCallback(() => {
    endSelections(true).then(() => {
      setSelectedField(null)
    })
  }, [endSelections])

  const getTitleString = str => str.length > 17 ? str.substr(0, 17) + '...' : str
  
  const getSelectedString = x => x.qSelectedCount > 1 && x.qSelectedCount < 7 ? `${x.qSelectedCount} of ${x.qTotal}` : x.qSelected

  return (
    <SelectionBarContainer>
      <OptionsContainer>
        <IconButton onClick={stepBack}>
          <StepBackIcon />
        </IconButton>
        <IconButton onClick={stepForward}>
          <StepForwardIcon />
        </IconButton>
      </OptionsContainer>
      <FieldsContainer ref={selectionBarRef}>
        { fields.map((x, i) => (
          <FieldSummary 
            key={i}
            onClick={() => handleFieldClick(x, i)}
          >
            <div className="text">
              <span className="title">{getTitleString(x.qField)}</span>
              <span className="info">
                <span>{getSelectedString(x)}</span>
              </span>
            </div>
            <div 
              className="icon" 
              onClick={e => { e.stopPropagation(); handleClearFieldSelections(x.qField) }}
            >
              <CancelIcon />
            </div>
          </FieldSummary>
        )) }
        { selectedField && 
          <SelectionsFieldList
            key={selectedField.info.qField}
            fieldInfo={selectedField.info}
            fieldIndex={selectedField.index}
            onRequestClose={handleRequestClose}
            onClickAway={handleClickAway}
          /> }
      </FieldsContainer>
    </SelectionBarContainer>
  )
}
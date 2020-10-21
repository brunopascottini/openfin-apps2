import React, { useEffect, useState, useRef, useContext } from 'react'

import usePrevious from 'hooks/usePrevious'

import ObjectsContext from 'context/objects'
import SelectionsContext from 'context/selections'

import IconButton, { CancelButton, ConfirmButton } from 'components/atoms/IconButton'

import { ReactComponent as CloseIcon } from 'assets/icons/close.svg'
import { ReactComponent as DoneIcon } from 'assets/icons/done.svg'

import styled from 'styled-components'

const FieldListContainer = styled.div`
  position: absolute;
  top: 100%;
  width: 200px;
  z-index: 10;
  svg {
    fill: #fff !important;
  }
`

const ValuesList = styled.div`
  color: #333; 
  background-color: #fff; 
  max-height: 300px; 
  overflow-y: auto; 
  font-size: 0.6em; 
  z-index: 2;
`

const ValueButtons = styled.div`
  margin: 7px;
  display: flex;
  justify-content: space-between;
  div {
    display: flex;
  }
`

const ValueItem = styled.div`
  margin: 1px 0;
  padding: 8px 10px;
  display: flex;
  justify-content: center;
  cursor: default;
  position: relative;
  &.S { background-color: #69ff69 } /* selected */
  &.A { background-color: #ddd } /* selected */
  &.X { background-color: #a9a9a9 } /* excluded */
  &.XS { 
    /* selected excluded */
    background-color: #a9a9a9;
    &::after {
      content: '✔';
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: #fff;
      font-size: 14px;
    }
  }
  &:hover {
    &::before {
      position: absolute;
      content: "";
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      background-color: rgba(0,0,0,0.1);
    }
  }
`

function SelectionsFieldList({ onRequestClose, onClickAway, fieldInfo, fieldIndex, isExpanded, onExpand, onClose, indexOfEl }) {

  const { createObject, getObjectLayout } = useContext(ObjectsContext)
  const { selections, beginSelections, selectValues, endSelections } = useContext(SelectionsContext)

  const [model, setModel] = useState(null)

  const [values, setValues] = useState([])

  const oldModelId = usePrevious(selections.selectedModelId) 

  const containerRef = useRef()

  useEffect(() => {
    if(model && oldModelId === model.id && selections.selectedModelId !== model.id) {
      onRequestClose()
    }
  }, [selections.selectedModelId, model, oldModelId, onRequestClose])

  const handleClick = qElemNumber => {
    selectValues(model.id, [qElemNumber], true)
  }
  
  const discardSelections = () => {
    endSelections(false).then(() => {
      onRequestClose()
    })
  }

  const confirmSelections = () => {
    endSelections(true).then(() => {
      onRequestClose()
    })
  }

  const selectAllValues = () => {
    const elems = values.map(x => x.qElemNumber)
    selectValues(model.id, elems, false)
  }

  const isSubscribed = useRef(false)

  useEffect(() => {
    const handleClick = e => {
      let isOutside = true
      let elem = e.target
      while(elem.parentNode) {
        if(elem === containerRef.current) {
          isOutside = false
          break;
        }
        elem = elem.parentNode
      }
      if(isOutside) {
        onClickAway()
      }
    }
    document.addEventListener('click', handleClick)
    return () => {
      document.removeEventListener('click', handleClick)
    }
  }, [onClickAway])

  useEffect(() => {
    isSubscribed.current = true
    const setLayout = m => {
      getObjectLayout(m).then(layout => {
        if(isSubscribed.current) {
          setValues(layout.qListObject.qDataPages[0].qMatrix.flat(1))
        }
        return layout
      })
    }
    if(model) {
      if(isExpanded) {
        beginSelections(model.id)
      }
    } else {
      createObject('list', {
        qDef: {
          qFieldDefs: [fieldInfo.qField],
          qSortCriterias: [
            { qSortByState: 1 } 
          ]
        },
        qShowAlternatives: true,
        qInitialDataFetch: [{
          qTop: 0,
          qLeft: 0,
          qWidth: 1,
          qHeight: 100
        }]
      }, `${fieldInfo.qField}_Selections`).then(m => {
        setModel(m)
        if(isExpanded) {
          beginSelections(m.id)
        }
        setLayout(m)
        m.on('changed', () => {
          setLayout(m)
        })
      })
    }
    return () => {
      isSubscribed.current = false
      // if(model) {
      //   setModel(null)
      //   destroyObject(model.id))
      // }
    }
  }, [isExpanded, fieldInfo.qField, model, getObjectLayout, beginSelections, createObject])

  return (
    <FieldListContainer style={{left: `${fieldIndex * 200}px`}} ref={containerRef}>
      <ValuesList>
        <ValueButtons>
          <IconButton onClick={selectAllValues}>
            Select all
          </IconButton>
          <div>
            <CancelButton onClick={discardSelections}>
              <CloseIcon />
            </CancelButton>
            <ConfirmButton onClick={confirmSelections}>
              <DoneIcon />
            </ConfirmButton>
          </div>
        </ValueButtons>
        { values.map(x => (
          <ValueItem
            key={x.qElemNumber}
            onClick={() => handleClick(x.qElemNumber)}
            className={x.qState}
          >
            {x.qText}
          </ValueItem>
        )) }
      </ValuesList>
    </FieldListContainer>
  )
}

export default SelectionsFieldList
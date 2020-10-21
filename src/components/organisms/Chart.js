import React, { useEffect, useState, useCallback, useRef, useContext } from 'react'

import PropTypes from 'prop-types'
import styled from 'styled-components'
import { ThemeProvider } from 'styled-components'

import loadTheme from 'themes/loadTheme'
import StyledGenericChart from 'themes/StyledGenericChart'

import WinContext from 'context/win'
import ThemeContext from 'context/theme'
import ObjectsContext from 'context/objects'
import SelectionsContext from 'context/selections'
import useChecks from 'hooks/useChecks'

import { ReactComponent as CloseIcon } from 'assets/icons/close.svg'
import { ReactComponent as DoneIcon } from 'assets/icons/done.svg'

import { CancelButton, ConfirmButton } from 'components/atoms/IconButton'

import ScatterPlot from 'components/molecules/ScatterPlot'
import BarChart from 'components/molecules/BarChart'
import LineChart from 'components/molecules/LineChart'
import PieChart from 'components/molecules/PieChart'
import ChartTooltip from 'components/molecules/ChartTooltip'

import { ordinalize } from 'helpers'

const charts = {
  'barchart': BarChart,
  'scatterplot': ScatterPlot,
  'linechart': LineChart,
  'piechart': PieChart
}

const ChartContainer = styled.div`
  margin-bottom: 30px;
  border: 1px solid transparent;
  border-radius: 5px;
  position: relative;
`

const ChartControls = styled.div`
  padding: 4px 8px;
  border-radius: 5px;
  z-index: 3;
  position: absolute;
  right: 0;
  top: 6px;
  display: flex;
  background-color: ${({ theme }) => theme.backgroundColor};
  svg {
    fill: #fff !important;
  }
`

function Chart({ documentTitle ,objectId, dimensions, measures, title, xLabel, yLabel, theme: propTheme, viewbox, type: propChartType, xTickFormat, yTickFormat, xTickCount, yTickCount, height: propHeight }) {
  const { dimMeasureCheck } = useChecks()

  const { createObject, getObject, getObjectLayout } = useContext(ObjectsContext)
  const { selections, selectValues, endSelections } = useContext(SelectionsContext)
  const { theme: contextTheme } = useContext(ThemeContext)
  const win = useContext(WinContext)

  const containerRef = useRef()
  const chartType = useRef()

  const [theme, setTheme] = useState(null)
  const [showChart, setShowChart] = useState(false)
  const [model, setModel] = useState(null)
  const [data, setData] = useState(null)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    let toSet
    if (propTheme) {
      if (typeof propTheme === 'string') {
        toSet = loadTheme(propTheme)
      } else {
        toSet = propTheme
      }
    } else {
      toSet = contextTheme
    }
    setTheme(toSet)
  }, [propTheme, contextTheme])

  useEffect(() => {
    if(propChartType) {
      chartType.current = propChartType
      if(!charts[chartType.current]) {
        throw new Error(`Unrecognized chart type, "${chartType.current}" provided to Chart component. 
        Currently supported chart types are: ${Object.keys(charts).join(', ')}`)
      }
      setShowChart(true)
    }
  }, [propChartType])

  const updateLayout = useCallback(model => {
    return getObjectLayout(model).then(layout => {
      const {qDimensionInfo:dimInfo, qMeasureInfo:mesInfo} = layout.qHyperCube
      const newData = layout.qHyperCube.qDataPages[0].qMatrix.map(x => ({
        qElemNumber: x[0].qElemNumber,
        dimensions: x.slice(0, dimInfo.length).map((d, i) => ({
          label: dimensions && dimensions[i] && measures[i].label ? dimensions[i].label : dimInfo[i].qFallbackTitle,
          value: d.qNum === 'NaN' ? d.qText : d.qNum
        })),
        measures: x.slice(dimInfo.length).map((d, i) => ({
          label: measures && measures[i] && measures[i].label ? measures[i].label : mesInfo[i].qFallbackTitle,
          format: measures ? (measures[i].format || (d => d)) : (d => d),
          value: d.qNum
        }))
      }))
      setData(newData)
      return layout
    })
  }, [dimensions, getObjectLayout, measures])

  useEffect(() => {
    setWidth(containerRef.current.getBoundingClientRect().width)
    setHeight(propHeight || containerRef.current.getBoundingClientRect().height)
  }, [win.width, propHeight])

  useEffect(() => {
    document.title = documentTitle
    if (!model) {
      if(objectId) {
        getObject(objectId).then(m => {
          setModel(m)
          updateLayout(m).then(layout => {
            if(!propChartType) {
              chartType.current = layout.qInfo.qType
              if(!charts[chartType.current]) {
                throw new Error(`Unrecognized chart type, "${chartType.current}" provided to Chart component. 
                Currently supported chart types are: ${Object.keys(charts).join(', ')}`)
              }
              setShowChart(true)
            }
          })
          m.on('changed', () => {
            updateLayout(m)
          })
        })
      } else {
        dimMeasureCheck(dimensions, measures, propChartType)
        const def = {
          qDimensions: dimensions.map(x => {
            x = typeof x === 'string' ? { field: x } : x
            return {
              qDef: { qFieldDefs: [x.field] },
              qNullSuppression: x.excludeNull ? true : false,
            }
          }),
          qMeasures: measures.map(x => {
            x = typeof x === 'string' ? { formula: x } : x
            const e = { qDef: { qDef: x.formula } }
            return x.sorting ? { ...e, qSortBy: x.sorting } : e
          }),
          qInitialDataFetch: [{ qTop: 0, qLeft: 0, qWidth: dimensions.length + measures.length, qHeight: 100 }]
        }
        createObject('cube', def).then(m => {
          setModel(m)
          updateLayout(m)
          m.on('changed', () => {
            updateLayout(m)
          })
        })
      }
    }
  }, [model, dimensions, measures, updateLayout, chartType, dimMeasureCheck, createObject, objectId, getObject, propChartType])

  const handleDimensionClick = d => {
    selectValues(model.id, [d.qElemNumber]).then(() => {
      updateLayout(model)
    })
  }

  const handleEndSelect = i => {
    endSelections(true).then(() => {
      updateLayout(model)
    })
  }

  const handleClearSelect = i => {
    endSelections(false).then(() => {
      updateLayout(model)
    })
  }

  const RequestedChart = charts[chartType.current]

  return (
    <ChartContainer
      ref={containerRef}
      className={`${chartType}-feature`}
      style={{ borderColor: selections.values.length > 0 && selections.selectedModelId === model.id ? '#bbb' : 'transparent' }}
    >
      {data && theme && data.length > 0 ?
        <ThemeProvider theme={theme}>
          <ChartControls
            className="controls"
            style={{
              display: selections.values.length > 0 && selections.selectedModelId === model.id ? 'flex' : 'none'
            }}
          >
            <CancelButton onClick={handleClearSelect}>
              <CloseIcon />
            </CancelButton>
            <ConfirmButton onClick={handleEndSelect}>
              <DoneIcon />
            </ConfirmButton>
          </ChartControls>
          <StyledGenericChart className="chart">
            { showChart && <RequestedChart
              data={data}
              selections={selections.selectedModelId === model.id ? selections.values : []}
              onDimensionClick={handleDimensionClick}
              width={width}
              height={height}
              xLabel={xLabel}
              yLabel={yLabel}
              title={title}
              theme={theme}
              dotSizeRange={[4, 9]}
              viewbox={viewbox}
              xTickFormat={xTickFormat}
              yTickFormat={yTickFormat}
              xTickCount={xTickCount}
              yTickCount={yTickCount}
              TooltipComponent={ChartTooltip}
/> }
          </StyledGenericChart>
        </ThemeProvider>
        : <p>No data</p>}
    </ChartContainer>
  )
}

function toType(obj) {
  return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
}

Chart.propTypes = {
  dimensions: (props, propName, compName) => {
    const dims = props[propName]
    if(!dims) {
      return props.objectId ? null : new Error(`Unless providing an 'objectId' prop to fetch an existing visualization from the connected app, the 'dimensions' prop must be passed to ${compName}. Please provide this prop or provide an 'objectId' prop.`)
    }
    if (!Array.isArray(dims)) { return new Error(`Dimensions passed to ${compName} must be an array. Please check the props passed.`) }
    for (const [i, dim] of dims.entries()) {
      const type = toType(dim)
      if (!['string', 'object'].includes(type)) {
        return new Error(`The ${ordinalize(i + 1)} dimension passed to ${compName} is a ${type}. Dimensions passed must be an object (containing a field property, plus any other config), or a string representing the field name`)
      }
      if (type === 'object') {
        if (!dim.field && !props.objectId) {
          return new Error(`The ${ordinalize(i + 1)} dimension passed to ${compName} does not include a 'field' property. Dimensions must include a 'field' property at minimum, or be passed as a string representing the field name.`)
        }
      }
    }
  },
  measures: (props, propName, compName) => {
    const measures = props[propName]
    if(!measures) {
      return props.objectId ? null : new Error(`Unless providing an 'objectId' prop to fetch an existing visualization from the connected app, the 'measures' prop must be passed to ${compName}. Please provide this prop or provide an 'objectId' prop.`)
    }
    if (!Array.isArray(measures)) { return new Error(`Measures passed to ${compName} must be an array. Please check the props passed.`) }
    for (const [i, measure] of measures.entries()) {
      const type = toType(measure)
      if (!['string', 'object'].includes(type)) {
        return new Error(`The ${ordinalize(i + 1)} measure passed to ${compName} is a ${type}. Measures passed must be an object (containing 'formula' and 'label'', plus any other config), or a string representing the formula`)
      }
      if (type === 'object') {
        if (!measure.formula && !props.objectId) {
          return new Error(`The ${ordinalize(i + 1)} measure passed to ${compName} does not include a 'formula' property. Measures must include 'formula' and 'label' properties at minimum.`)
        }
        if(!measure.label) {
          return new Error(`The ${ordinalize(i + 1)} measure passed to ${compName} does not include a 'label' property. Measures must include a 'label' property to correctly display tooltips and chart labels. This applies even if the chart uses a getObject, as tooltips will not have info on measure names.`)
        }
      }
    }
  },
  type: PropTypes.oneOf(Object.keys(charts))
}

export default Chart
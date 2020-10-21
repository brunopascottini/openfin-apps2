import React, {useState, useEffect, useRef, useCallback} from 'react'
import * as d3 from 'd3'

import PropTypes from 'prop-types'

import { validateDimensions, validateMeasures, calculateTextSpace } from 'helpers'

const { lasso } = require('d3-lasso')

const xValue = d => d.dimensions[0].value
const yValue = d => d.measures[0].value

function LineChart(props) {
  const { theme, lassoActive:lassoA, hasLasso, data:newData, width, height, selections, onDimensionClick, chartTitle, viewbox, yTickFormat, xTickFormat, xTickCount, yTickCount, TooltipComponent } = props
  const [chartData, setChartData] = useState([]) //setting the initial state
  const svgContainer = useRef()

  const lassoActive = useRef(lassoA)
  const toolTipRef = useRef()

  const [h, setH] = useState(0)
  const [h2, setH2] = useState(0)
  const [w, setW] = useState(0)
  const [scales, setScales] = useState({
    x: null,
    y: null,
    boxY: null,
    boxX: null
  })
  const [readyToRender, setReadyToRender] = useState(false)

  const xLabel = newData[0].dimensions[0].label
  const yLabel = newData[0].measures[0].label

  const [margin, setMargin] = useState({ 
    top: 30, 
    right: yLabel ? Math.min(Math.max(width * 0.07, 40), 80) : Math.min(Math.max(width * 0.05, 30), 60), 
    middle: 0,
    left: yLabel ? Math.min(Math.max(width * 0.1, 80), 130) : Math.min(Math.max(width * 0.05, 30), 60), 
    bottom: 20 
  })
  
  const scaleTo = viewbox === false ? 1 : Math.max(1, 23 / (w / chartData.length))

  useEffect(() => {
    if(newData.length > 0) {
      setChartData(newData.sort((a, b) => a.dimensions[0].value - b.dimensions[0].value))
    }
  }, [newData])

  const svg = useCallback(() => d3.select(svgContainer.current), [])

  useEffect(() => {
    const longestWord = newData.map(xValue).reduce((acc, str) => str.length > acc.length ? str : acc, xValue(newData[0]))
    let s = calculateTextSpace(longestWord, theme.axisText.fontSize, theme.axisText.fontFamily)
    s = Math.sqrt(Math.pow(s, 2) / 2)

    setMargin(curr => ({...curr, middle: s + (xLabel ? 60 : 20)}))
  }, [width, height, svg, newData, theme, xLabel])
  
  useEffect(() => {
    if(margin.middle) {
      const innerWidth = width - (margin.left + margin.right)
      setW(innerWidth)
      const sumMargin = scaleTo > 1 ? (margin.top + margin.middle + margin.bottom) : (margin.top + margin.middle)
      const innerHeight = height - sumMargin
      const viewboxHeight = scaleTo > 1 ? innerHeight * 0.175 : 0
      setH(innerHeight - viewboxHeight)
      setH2(viewboxHeight)

      setReadyToRender(true)
    }
  }, [width, height, svg, margin, scaleTo])

  useEffect(() => {
    const x = d3.scaleLinear()
      .range([0, w])
    
    const boxX = d3.scaleBand()
      .range([0, w])
      .padding(0.35)
      
    const y = d3.scaleLinear()
      .range([h, 0])

    const boxY = d3.scaleLinear()
      .range([h2, 0])

    setScales({ x, y, boxY, boxX })

  }, [w, h, h2])
  
  useEffect(() => {
    if(readyToRender) {
      const g = d3.select(svgContainer.current).select('.inner-box')

      const data = chartData   
      const xScale = scales.x
      const yScale = scales.y
      const boxYScale = scales.boxY
      const boxXScale = scales.boxX
      
      xScale.domain(d3.extent(data, d => xValue(d))).nice()
      boxXScale.domain(xScale.domain())

      const padLinear = ([x0, x1], k) => {
        const dx = (x1 - x0) * k / 2
        return [x0 - dx, x1 + dx]
      }

      yScale.domain(padLinear(d3.extent(data, d => yValue(d)), 0.7)).nice()
      boxYScale.domain(yScale.domain())

      const mainBars = g.select('.bars').selectAll('circle').data(data)
      const viewboxBars = g.select('.viewbox.bars').selectAll('circle').data(data)
      const allBars = g.selectAll('.bars').selectAll('circle').data(data)

      const percentiles = {
        lower: d3.quantile(data, 0.05, d => yValue(d)),
        upper: d3.quantile(data, 0.9, d => yValue(d))
      }

      const scaleExtent = [1, 8]

      // zoom
      const extent = [[0, margin.top], [w, h]]

      var zoom = d3.zoom()
        .scaleExtent(scaleExtent)
        .translateExtent(extent)
        .extent(extent)
        .filter(() => !d3.event.wheelDelta)

      const colorScale = theme.colorScales.sequential([percentiles.lower, percentiles.upper])

      const getOpacity = d => selections.includes(d.qElemNumber) ? 1 : 0.75
      const getStrokeColor = d => selections && selections.includes(d.qElemNumber) ? theme.selectionHighlight : 'none'

      const isViewbox = elemArray => elemArray[0].parentNode.matches('.viewbox')

      const getHeight = d => {
        return h - yScale(yValue(d)) > 0 ? h - yScale(yValue(d)) : 0
      }

      // brush
      const handleBrush = () => {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') return
        const s = d3.event.selection || boxXScale.range()

        xScale.range([0,w*scaleTo].map(x => x - s[0]*scaleTo))

        mainBars
          .attr('cx', (d, i, e) => isViewbox(e) ? boxXScale(xValue(d)) : xScale(xValue(d)))
          .style('opacity', getOpacity)
        viewboxBars
          .attr('opacity', d => boxXScale(xValue(d)) > s[0] && boxXScale(xValue(d)) < s[1] ? 1 : 0.7)
        g.select('.x.axis')
          .call(d3.axisBottom(xScale))

        g.select('.line')
          .transition()
          .duration(500)
          .attr('d', d3.line()
            .x(d => xScale(xValue(d)))
            .y(d => yScale(yValue(d)))
          )
      }

      const brush = d3.brushX()
        .extent([[0, h+margin.middle], [w, h+margin.middle+h2]])
        .on('brush end', handleBrush)
      g.select('.brush')
        .call(brush)
        .call(brush.move, boxXScale.range())
        .selectAll('.handle, .overlay')
          .attr('pointer-events', 'none')
      
      // zoom
      const handleZoom = () => {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'brush') return
        d3.event.transform.k = scaleTo
        xScale.range([0, w].map(d => d3.event.transform.applyX(d)))
        
        mainBars
          .attr('cx', (d, i, e) => isViewbox(e) ? boxXScale(xValue(d)) : xScale(xValue(d)))
          .style('opacity', getOpacity)
        g.select('.x.axis')
          .call(d3.axisBottom(xScale))
          .selectAll('text')
            .attr('transform', `rotate(-45) translate(-10, -6)`)
        const t = d3.event.transform
        g.select('.brush')
          .call(brush.move, boxXScale.range().map(t.invertX, t))

        g.select('.line')
          .transition()
          .duration(500)
          .attr('d', d3.line()
            .x(d => xScale(xValue(d)))
            .y(d => yScale(yValue(d)))
          )
      }

      if(lassoActive.current) {
        zoom.on('zoom', null)
      } else {
        zoom.on('zoom', handleZoom)
      }

      g.call(zoom)
      
      if(d3.zoomTransform(g).k !== scaleTo) {
        zoom.scaleTo(g, scaleTo, [0, 0])
      }

      const getViewboxHeight = d => (h2 - boxYScale(yValue(d)))> 0 ? (h2 - boxYScale(yValue(d))) : 0

      // Bars - ENTER
      allBars.enter()
        .append('circle')
        .merge(allBars)
        .transition()
        .duration(250)
        .attr('class', 'bar')
        .attr('r', (d, i, e) => isViewbox(e) ? 1 : 3)
        .attr('cx', (d, i, e) => isViewbox(e) ? boxXScale(xValue(d)) : xScale(xValue(d)))
        .attr('cy', (d, i, e) => isViewbox(e) ? boxYScale(yValue(d)) : yScale(yValue(d)))
        .attr('fill', d => colorScale(d3.max(data, yValue)))
        .attr('stroke', getStrokeColor)
        .attr('stroke-width', 1)
        .attr('clip-path', 'url(#inner-clip)')

      // Bars - EXIT
      allBars.exit()
        .transition()
        .duration(250)
        .attr('x', -13)
        .style('opacity', 0)
        .remove()

      g.select('.line')
        .datum(data)
        .transition()
        .duration(500)
        .attr('d', d3.line()
          .x(d => xScale(xValue(d)))
          .y(d => yScale(yValue(d)))
        )
        .attr('fill', 'none')
        .attr('stroke', colorScale(d3.median(data, yValue)))
        .attr('stroke-width', 1.3)
        
      const onLassoStart = () => {
        if(!lassoActive.current) return
        las.items()
        .attr('r', 3.5)
        .classed('not_possible', true)
          .classed('selected', false)
      }

      const onLassoDraw = () => {
        if(!lassoActive.current) return
        // Style the possible dots
        las.possibleItems()
          .classed('not_possible',false)
          .classed('possible',true)

        // Style the not possible dot
        las.notPossibleItems()
          .classed('not_possible',true)
          .classed('possible',false)
      }

      const onLassoEnd = () => {
        if(!lassoActive.current) return
        // Reset the color of all dots
        las.items()
          .classed('not_possible',false)
          .classed('possible',false)

        let selected = []

        // Style the selected dots
        las.selectedItems()
          .each(d => selected.push(d.qElemNumber))
        
        onLassoEnd(selected)

        // Reset the style of the not selected dots
        las.notSelectedItems()
      }

      if(g.select('.lasso').nodes().length === 0 && hasLasso) {
        var las = lasso(d3)
          .closePathSelect(true)
          .closePathDistance(100)
          .items(mainBars.data(data))
          .targetArea(g)

        las.on('start', onLassoStart)
        las.on('draw', onLassoDraw)
        las.on('end', onLassoEnd)
        
        g.call(las)
      }

      var tooltip = d3.select(toolTipRef.current)

      // Bars - Mouseover
      mainBars
        .on('mouseover', function(d) {
          d3.select(this)
            .style('opacity', 1)

          tooltip.select('.title').text(d.dimensions[0].value)
          tooltip.select('.content').text('')
          d.measures.forEach(x => {
            tooltip.select('.content')
              .append('span')
              .attr('class', 'measure')
              .html(`<span>${x.label}</span>&nbsp;&nbsp;&nbsp;<strong>${x.format(x.value)}</strong>`)
          })
          
          tooltip.style('opacity', 1)
        })
        .on('mousemove', function(d) {
          tooltip
            .style('transform', `translateX(calc(${margin.left + xScale(xValue(d))}px - 50%)) translateY(${yScale(yValue(d)) - 30}px)`)
        })
        .on('mouseout', function(d) {
          tooltip
            .style("opacity", 0)
          d3.select(this)
            .transition('restoreBarColor')
            .duration(150)
            .style('opacity', getOpacity)
        })
        .on('click', function(d) {
          onDimensionClick(d)
        })
    }

  }, [chartData, scales, w, h, h2, onDimensionClick, lassoActive, selections, theme, svg, hasLasso, margin, readyToRender, scaleTo])

  useEffect(() => {
    if(scales.y) {
      const g = d3.select(svgContainer.current)

      // y axis
      const yAxis = d3.axisLeft(scales.y)
      yAxis.tickFormat(chartData[0].measures[0].format)
      if(yTickCount) {
        yAxis.ticks(yTickCount)
      }
      g.select('.y.axis').call(yAxis)
        .transition()
        .duration(300)

      // x axis
      const xAxis = d3.axisBottom(scales.x)
      if(xTickFormat) {
        xAxis.tickFormat(xTickFormat)
      }
      if(xTickCount) {
        xAxis.ticks(xTickCount)
      }
      g.select('.x.axis')
      .call(xAxis)
        .transition()
        .duration(300)
        .attr('transform', `translate(0,${h})`)

        .attr('clip-path', 'url(#outer-clip)')
        .selectAll('text')
          .attr('transform', 'rotate(-45) translate(-10, -6)')
          .style('text-anchor', 'end')
          .attr('dx', '6')
          .attr('dy', '4')

      g.select('.x.axis').selectAll('.domain, .tick line')
        .attr('clip-path', 'url(#inner-clip)')

      // title
      g.select('.chart-title')
        .attr('transform', `translate(${w/2}, -35)`) 
        .style('text-anchor', 'middle')
        .style('font-size', '25px')
        .style('font-weight', 'bold')
    }
  })

  return (
    <>
      <svg 
        ref={svgContainer}
        width={width} 
        height={height}
      >
        <text 
          className='chart-title' 
          fill='#fff'
        >
          { chartTitle }
        </text>
        <text 
          transform={`translate(${w/2 + margin.left}, ${h + margin.middle})`}
          className="x-axis-label"
          textAnchor="middle"
        >
          { xLabel }
        </text>
        <text 
          className='y-axis-label' 
          transform={`translate(${margin.left*0.5 - (theme.labels.xAxis.fontSize || theme.labels.fontSize).replace(/\D/g,'')}, ${h/2 + margin.top}) rotate(-90)`}
          textAnchor="middle"
        >
          { yLabel }
        </text>
        <g 
          className='inner-box' 
          pointerEvents='all' 
          transform={`translate(${margin.left}, ${margin.top})`}
        >
          <rect 
            className='zoom-sensor' 
            transform={`translate(0, -${margin.top})`} 
            width={w} 
            height={height} 
            style={{fill: 'none'}} 
            pointerEvents='all'
          />

          <path className='line' clipPath='url(#inner-clip)'></path>
          <g className='bars' />
          <g className='x axis' />
          <g className='y axis' />
          { scaleTo !== 1 ? <>
            <g 
              className='viewbox' 
              transform={`translate(0, ${h + margin.middle})`}
              pointerEvents='none'
            >
              <rect 
                fill={theme.viewbox.backgroundFill}
                width={w}
                height={h2}
              />
              <g className='viewbox bars' />
            </g>
            <g className='brush' /> 
          </> : <></> }
          
          <clipPath id='inner-clip'>
            <rect 
              transform={`translate(0, -${margin.top})`} 
              width={w} 
              height={height}
            />
          </clipPath>
          <clipPath id='outer-clip'>
            <rect 
              transform={`translate(-8, -${margin.top})`} 
              width={w+8} 
              height={height}
            />
          </clipPath>
        </g>
      </svg>
      <TooltipComponent ref={toolTipRef} />
    </>
  )
}

LineChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.exact({
    dimensions: (props, propName, compName) => validateDimensions(props, propName, compName, 1, 1),
    measures: (props, propName, compName) => validateMeasures(props, propName, compName, 1, 1),
    qElemNumber: PropTypes.number.isRequired,
  })),
  height: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
  onDimensionClick: PropTypes.func.isRequired,
  selections: PropTypes.arrayOf(PropTypes.number).isRequired,
  xLabel: PropTypes.string,
  yLabel: PropTypes.string,
  title: PropTypes.string,
  dotColor: PropTypes.string,
  dotSizeRange: PropTypes.array,
  theme: PropTypes.object.isRequired
}

export default LineChart

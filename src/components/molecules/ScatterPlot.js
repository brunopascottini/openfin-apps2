import React, { useState, useEffect, useRef } from 'react'

import PropTypes from 'prop-types'
import isEqual from 'lodash.isequal'
import * as d3 from 'd3'

import { validateDimensions, validateMeasures } from 'helpers'

const xValue = d => d.measures[0].value
const yValue = d => d.measures[1].value
const sizeValue = d => d.measures[2] ? d.measures[2].value : 5

function ScatterPlot({ data:newData, width, height, onDimensionClick, selections, title, dotSizeRange, theme, xTickFormat, yTickFormat, xTickCount, yTickCount, TooltipComponent }) {
  const svgContainer = useRef()
  const toolTipRef = useRef()

  dotSizeRange = dotSizeRange || [4, 8]

  const [w, setW] = useState(0)
  const [h, setH] = useState(0)

  const [scales, setScales] = useState({
    x: null,
    y: null
  })
  
  const [data, setData] = useState(null)

  const xLabel = newData[0].measures[0].label
  const yLabel = newData[0].measures[1].label

  const margin = { left: yLabel ? 100 : 60, right: 30, top: title ? 50 : 15, bottom: xLabel ? 70 : 35 }

  useEffect(() => {
    setData(curr => isEqual(curr, newData) ? curr : newData)
  }, [newData])

  useEffect(() => {
    setW(width - (margin.left + margin.right))
    setH(height - (margin.top + margin.bottom))
  }, [width, height, margin])

  useEffect(() => {
    setScales({
      x: d3.scaleLinear(),
      y: d3.scaleLinear()
    })
  }, [])

  useEffect(() => {
    if(data && scales.x) {
      scales.x.domain([0, 1])
      scales.y.domain([0, d3.max(data, d => yValue(d))]).nice()
    }
  }, [data, scales])

  useEffect(() => {
    if(w && h) {
      scales.x.range([0, w])
      scales.y.range([h, 0])
    }
  }, [scales, w, h])

  useEffect(() => {
    if(scales.y) {
      const g = d3.select(svgContainer.current).select('.inner-box')
      
      const dotSizeScale = sizeValue(data[0]) ? d3.scaleLinear()
        .domain(d3.extent(data.map(d => sizeValue(d))))
        .range([dotSizeRange[0], dotSizeRange[1]]) : () => (dotSizeRange[0] + dotSizeRange[1]) * 0.4

      const colorScale = theme.colorScales.sequential(d3.extent(data.map(d => sizeValue(d))))

      // data points
      const points = g.select('.points').selectAll('circle').data(data)
      points.enter()
        .append('circle')
        .attr('cx', d => scales.x(xValue(d)))
        .attr('cy', h)
        .style('opacity', 0)
        .merge(points)
        .transition()
        .duration(800)
          .attr('class', 'point')
          .attr('cx', d => scales.x(xValue(d)))
          .attr('cy', d => scales.y(yValue(d)))
          .attr('r', d => selections.includes(d.qElemNumber) ? dotSizeScale(sizeValue(d))*1.15 : dotSizeScale(sizeValue(d)))
          .style('fill', d => colorScale(sizeValue(d)))
          .style('opacity', d => selections.includes(d.qElemNumber) ? 1 : 0.75)
          .style('stroke', d => selections.includes(d.qElemNumber) ? theme.selectionHighlight : null)
          .style('stroke-width', dotSizeRange[0] / 4 + 'px')

      points.exit()
        .transition()
        .duration(600)
        .style('opacity', 0)
        .attr('cy', h)
        .remove()
      
      // tooltips
      var tooltip = d3.select(toolTipRef.current)

      const circles = g.select('.points').selectAll('circle')

      // event handlers
      circles.on('mouseover', function(d) {

        tooltip.select('.title').text(d.dimensions[0].value)
          tooltip.select('.content').text('')
          d.measures.forEach(x => {
            tooltip.select('.content')
              .append('span')
              .attr('class', 'measure')
              .html(`<span>${x.label}</span>&nbsp;&nbsp;&nbsp;<strong>${x.format(x.value)}</strong>`)
          })
        tooltip
          .style("opacity", 1)

        d3.select(this)
          .attr('r', dotSizeScale(sizeValue(d))*1.15)
          .style('opacity', null)
      })
      circles.on('mousemove', function(d) {
        tooltip
          .style('transform', `translateX(calc(${margin.left + scales.x(xValue(d))}px - 50%)) translateY(calc(${(scales.y(yValue(d)))}px - 110%))`)
      })
      circles.on('mouseout', function(d) {
        tooltip
          .style("opacity", 0)
        d3.select(this)
          .attr('r', selections.includes(d.qElemNumber) ? dotSizeScale(sizeValue(d))*1.15 : dotSizeScale(sizeValue(d)))
          .style('stroke', selections.includes(d.qElemNumber) ? theme.selectionHighlight : null)
          .style('opacity', selections.includes(d.qElemNumber) ? 1 : 0.75)
      })
      circles.on('click', function(d) {
        onDimensionClick(d)
      })
    }
  }, [scales, w, h, data, onDimensionClick, selections, dotSizeRange, theme, margin])

  useEffect(() => {
    if(scales.y) {
      const g = d3.select(svgContainer.current).select('.inner-box')
      
      const xAxis = d3.axisBottom(scales.x)
        .tickSize(-h)
      xAxis.tickFormat(data[0].measures[0].format)
      if(xTickCount) {
        xAxis.ticks(xTickCount)
      }

      g.select('.x.axis').call(xAxis)
        .transition()
        .duration(400)
        .attr('transform', `translate(0,${h})`)
        .selectAll('text')
          .attr('transform', 'translate(0, 5)')

      const yAxis = d3.axisLeft(scales.y)
        .tickSize(-w)
      yAxis.tickFormat(data[0].measures[1].format)
      if(yTickCount) {
        yAxis.ticks(yTickCount)
      }

      g.select('.y.axis').call(yAxis)
        .style('opacity', 0)
        .transition()
        .duration(400)
        .style('opacity', 1)
        .selectAll('text')
          .attr('transform', 'translate(-5, 0)')
      g.select('.y.axis').enter()

      g.selectAll('.axis .tick:nth-of-type(1) line').style('stroke', theme.axisLines.stroke)
      g.selectAll('.axis text')
        .style('fill', theme.axisText.color)
      g.selectAll('.axis .domain')
        .style('display', 'none')
      g.selectAll('.axis .tick:not(:nth-of-type(1)) line')
        .attr('stroke', theme.gridLines ? theme.gridLines.stroke : null)
        .attr('stroke-width', theme.gridLines ? theme.gridLines.strokeWidth : null)
        .style('display', theme.gridLines ? 'auto' : 'none')
    }
  }, [data, w, h, scales, theme, xTickCount, xTickFormat, yTickCount, yTickFormat])

  return (
    <>
      <svg
        ref={svgContainer} 
        width={width} 
        height={height}
      >
        <g 
          className="inner-box" 
          pointerEvents="all" 
          transform={`translate(${margin.left}, ${margin.top})`}
        >
          <g className="x axis" />
          <g className="y axis" />
          <g className="points"></g>
          <text 
            className="x-axis-label"
            transform={`translate(${w/2}, ${h + (margin.bottom / 2) + 10})`}
            textAnchor="middle"
          >
            { xLabel }
          </text>
          <text 
            className="y-axis-label" 
            transform={`translate(${-60}, ${h/2}) rotate(-90)`}
            textAnchor="middle"
          >
            { yLabel }
          </text>
        </g>
        <text 
          className="chart-title"
          fill="#000" 
          transform={`translate(${width/2}, ${margin.top/2 + 3})`}
          textAnchor="middle"
        >
          { title }
        </text>
      </svg>
      <TooltipComponent ref={toolTipRef} />
    </>
  )
}

ScatterPlot.propTypes = {
  data: PropTypes.arrayOf(PropTypes.exact({
    dimensions: (props, propName, compName) => validateDimensions(props, propName, compName, 1, 1),
    measures: (props, propName, compName) => validateMeasures(props, propName, compName, 2, 3),
    qElemNumber: PropTypes.number.isRequired,
  })),
  height: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
  onDimensionClick: PropTypes.func.isRequired,
  selections: PropTypes.arrayOf(PropTypes.number).isRequired,
  xLabel: PropTypes.string,
  yLabel: PropTypes.string,
  title: PropTypes.string,
  dotSizeRange: PropTypes.array,
  theme: PropTypes.object.isRequired
}

export default ScatterPlot
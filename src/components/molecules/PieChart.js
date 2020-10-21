import React, { useState, useEffect, useRef } from 'react'

import * as d3 from 'd3'

const margin = { left: 0, top: 0, right: 0, bottom: 0 }

const getField = d => d.dimensions[0].value
const getValue = d => d.measures[0].value

export default function PieChart({ width, height, data, theme, TooltipComponent, onDimensionClick, selections }) {

  const svgContainer = useRef()
  const toolTipRef = useRef()

  const [offsetAngle, setOffsetAngle] = useState(0)
  
  useEffect(() => {
    if(data && data.length > 0) {

      const percentiles = {
        lower: d3.quantile(data, 0.05, d => getValue(d)),
        upper: d3.quantile(data, 0.9, d => getValue(d))
      }

      const colorScale = theme.colorScales.sequential([percentiles.upper, percentiles.lower])

      const g = d3.select(svgContainer.current).select('g')

      let arcData = d3.pie().padAngle(0.01).value(d => getValue(d))(data)

      arcData = arcData.map(d => ({
        ...d,
        startAngle: d.startAngle + offsetAngle,
        endAngle: d.endAngle + offsetAngle
      }))

      const paths = g.select('.paths').selectAll('path').data(arcData)
      
      const holeScale = 0.7
      const radius = Math.min(width, height) / 2
    
      const getArc = radius => d3.arc().innerRadius(radius * holeScale).outerRadius(radius - 1)

      const largeArc = getArc(radius)
      const smallArc = getArc(radius * 0.68)

      paths
        .attr('d', d => smallArc(d))
        .attr('stroke', d => selections.includes(d.data.qElemNumber) ? theme.selectionHighlight : 'transparent')

      const getPathOpacity = d => selections.includes(d.data.qElemNumber) ? 1 : 0.8

      paths.enter()
        .append('path')
        .attr('d', d => smallArc(d))
        .attr('fill', d => colorScale(d.value))
        .attr('stroke', d => selections.includes(d.data.qElemNumber) ? '#fff' : 'transparent')
        .attr('opacity', getPathOpacity)
        .append('text')
        .text(d => d.value)
        .attr("transform", d => `translate(${smallArc.centroid(d)})`)

      paths.exit()
        .remove()

      g.selectAll('.labels g').remove()
      
      const labels = g.select('.labels').selectAll('g').data(arcData)

      const getOpacity = d => Math.abs(largeArc.centroid(d)[1]) < radius*0.70 ? 1 : 0

      labels.enter()
        // .filter(d => Math.abs(largeArc.centroid(d)[1]) < radius*0.75)
        .append('g')
        .call(g => g.append('text')
          .text(d => getField(d.data))
          .attr('font-size', 8)
          .attr('fill', theme.axisText.color)
          .attr('opacity', getOpacity)
          .attr('transform', d => `translate(${largeArc.centroid(d)})`)
          .attr('text-anchor', d => largeArc.centroid(d)[0] > 0 ? 'start' : 'end')
        )
        .call(g => g.append('line')
          .attr('x1', d => getArc(radius*0.83).centroid(d)[0])
          .attr('y1', d => getArc(radius*0.83).centroid(d)[1])
          .attr('x2', d => getArc(radius*0.95).centroid(d)[0])
          .attr('y2', d => getArc(radius*0.95).centroid(d)[1])
          .attr('opacity', getOpacity)
          .attr('stroke', theme.axisText.color)
          .attr('stroke-width', 0.8)
        )

      var tooltip = d3.select(toolTipRef.current)
      
      paths
        .on('mouseover', function(d) {
          d3.select(this)
            .style('opacity', 1)

          tooltip.select('.title').text(getField(d.data))
          tooltip.select('.content').text('')
          tooltip.select('.content')
            .append('span')
            .attr('class', 'measure')
            .html(`<span>${getField(d.data)}</span>&nbsp;&nbsp;&nbsp;<strong>${Math.round(d.value)}</strong>`)
          
          tooltip.style('opacity', 1)
        })
        .on('mousemove', function(d) {
          const coords = smallArc.centroid(d)
          tooltip
            .style('transform', `translateX(calc(${coords[0] + width/2}px - 50%)) translateY(calc(${coords[1] + height/2 - 30}px - 50%))`)
        })
        .on('mouseout', function(d) {
          tooltip
            .style("opacity", 0)
          d3.select(this)
            .transition('restoreBarColor')
            .duration(150)
            .style('opacity', getPathOpacity)
        })
        .on('click', (d) => {
          onDimensionClick(d.data)
        })
    }
  }, [data, offsetAngle, selections, height, theme, onDimensionClick, width])

  const handleWheel = e => {
    const delt = e.deltaY
    setOffsetAngle(curr => curr + 0.1 * Math.sign(delt))
    d3.select(toolTipRef.current).style('opacity', 0)
  }

  return (
    <>
      <svg 
        ref={svgContainer}
        width={width} 
        height={height}
        onWheel={handleWheel}
      >
        <g
          transform={`translate(${margin.left + width/2}, ${margin.top + height/2})`}
        >
          <g className="paths"></g>
          <g className="labels"></g>
        </g>
      </svg>
      <TooltipComponent ref={toolTipRef} />
    </>
  )
}
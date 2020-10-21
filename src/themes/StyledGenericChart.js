import styled from 'styled-components'

export default styled.div`
  svg {
    background-color: ${({theme}) => theme.backgroundColor}
  }
  .axis {
    .tick line {
      stroke: ${({theme}) => theme.axisLines.stroke || (theme.gridLines ? theme.gridLines.stroke : null)};
      stroke-width: ${({theme}) => theme.gridLines ? theme.gridLines.strokeWidth : null};
      display: ${({theme}) => theme.gridLines ? 'auto' : 'none'}
    }
    text {
      fill: ${({theme}) => theme.axisText.color};
      font-family: '${({theme}) => theme.axisText.fontFamily}', sans-serif;
      font-size: ${({theme}) => theme.axisText.fontSize};
      font-weight: ${({theme}) => theme.axisText.fontWeight};
    }
    .domain {
      stroke: ${({theme}) => theme.axisLines.stroke};
    }
  }
  .brush .selection {
    fill: ${({theme}) => theme.viewbox.selectionFill};
    stroke: ${({theme}) => theme.viewbox.selectionStroke};
  }
  .x-axis-label {
    fill: ${({theme}) => theme.labels.xAxis.color || theme.labels.color};
    font-weight: ${({theme}) => theme.labels.xAxis.fontWeight || theme.labels.fontWeight};
    font-size: ${({theme}) => theme.labels.xAxis.fontSize || theme.labels.fontSize};
    font-family: '${({theme}) => theme.labels.xAxis.fontFamily || theme.labels.fontFamily}', sans-serif;
  }
  .y-axis-label {
    fill: ${({theme}) => theme.labels.yAxis.color || theme.labels.color};
    font-weight: ${({theme}) => theme.labels.yAxis.fontWeight || theme.labels.fontWeight};
    font-size: ${({theme}) => theme.labels.yAxis.fontSize || theme.labels.fontSize};
    font-family: '${({theme}) => theme.labels.yAxis.fontFamily || theme.labels.fontFamily}', sans-serif;
  }
`
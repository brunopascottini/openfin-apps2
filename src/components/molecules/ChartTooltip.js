import React from 'react'

import styled from 'styled-components'

const StyledTooltip = styled.div`
  position: absolute;
  pointer-events: none;
  top: 0;
  left: 0;
  opacity: ${props => props.show ? 1 : 0};
  padding: 6px 16px 7px 16px;
  font-size: 0.8em;
  background-color: rgba(30,30,30,0.65);
  color: #fff;
  border-radius: 3px;
  &::after {
    content: "";
    position: absolute;
    top: 100%;
    opacity: 1;
    left: 50%;
    transform: translateX(-50%);
    border-width: 9px;
    border-color: rgba(30,30,30,0.85) transparent transparent transparent;
    border-style: solid;
  }
  .title {
    font-size: 0.8em;
    font-weight: 600;
    display: block;
    margin-bottom: 5px;
  }
  .subtitle {
    font-size: 0.8em;
    color: #777;
  }
  .content {
    font-size: 0.7em;
    line-height: 1.4;
    .measure {
      display: flex;
      justify-content: space-between;
      strong {
        font-weight: 500;
      }
    }
  }
`

const ChartTooltip = React.forwardRef((props, ref) => (
  <StyledTooltip
    className="tooltip"
    ref={ref}
  >
    <span className="title">
      <span className="subtitle"></span>
    </span>
    <div className="content"></div>
  </StyledTooltip>
))

export default ChartTooltip
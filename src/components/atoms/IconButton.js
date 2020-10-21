import styled from 'styled-components'

const IconButton = styled.button`
  border: none;
  border-radius: 3px;
  margin: auto 3px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 30px;
  background-color: transparent;
  position: relative;
  outline: none;
  &:hover::after {
    position: absolute;
    content: "";
    left: 0; right: 0; top: 0; bottom: 0;
    background-color: rgba(0,0,0,0.05)
  }
  cursor: pointer;
  svg {
    fill: #666;
  }
  &:active svg {
    fill: #333;
  }
`

export default IconButton

export const CancelButton = styled(IconButton)`
  background-color: red;
  .MuiSvgIcon-root {
    fill: #fff !important;
  }
`

export const ConfirmButton = styled(IconButton)`
  background-color:  #00dc00;
  .MuiSvgIcon-root {
    fill: #fff !important;
  }
`
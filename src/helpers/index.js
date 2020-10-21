export function ordinalize(n) {
  var s=["th","st","nd","rd"],
  v=n%100
  return n+(s[(v-20)%10]||s[v]||s[0])
}

export function calculateTextSpace(str, fontSize, fontFamily) {
  const svg = document.createElement('svg')
  const el = document.createElement('text')
  el.appendChild(document.createTextNode(str))
  el.style.fontSize = fontSize
  el.style.fontFamily = fontFamily
  el.style.visibility = 'hidden'
  el.style.whiteSpace = 'nowrap'
  svg.appendChild(el)
  document.body.appendChild(svg)
  const { width } = el.getBoundingClientRect()
  document.body.removeChild(svg)
  return width
}

export const getApiFromType = type => {
  let path
  let object
  switch(type) {
    case 'cube':
      path = '/qHyperCubeDef'
      object = 'qHyperCube'
      break
    case 'list':
      path = '/qListObjectDef'
      object = 'qListObject'
      break
    default:
      throw new Error('NOT IMPLEMENTED')
  }
  return { path, object }
}

const validateLength = (props, propName, componentName, min, max) => {
  if(!props[propName]) {
    return new Error(`You must provide data with at least one ${propName} to ${componentName}`)
  }
  const length = props[propName].length
  const required = min === max ? `exactly ${min}` : `between ${min} and ${max}`
  if(length < min || length > max) {
    return new Error(`You must provide data with ${required} ${propName} to ${componentName}. Your data has ${length}`)
  }
  return null
}
  
export const validateDimensions = (props, propName, componentName, min, max) => {
  // for(const [i, x] of props[propName].entries()) {
  //   if(typeof x !== 'string') {
  //     return new Error(`${ordinalize(i + 1)} dimension passed to ${componentName} is not a string. Dimensions must be strings.`)
  //   }
  // }
  return validateLength(props, propName, componentName, min, max)
}

export const validateMeasures = (props, propName, componentName, min, max) => {
//   for(const [i, x] of props[propName].entries()) {
//     if(typeof x !== 'number') {
//       return new Error(`${ordinalize(i + 1)} measure passed to ${componentName} is not a number. Measures must be numbers.
// Please check your data array. Consider passing 'excludeNull' to dimensions to enable null supression`)
//     }
//   }
  return validateLength(props, propName, componentName, min, max)
}
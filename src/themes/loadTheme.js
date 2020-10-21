import * as d3 from 'd3'

const themeNames = ['standard', 'sunsetblue']

export { themeNames as themes }

const themes = themeNames.map(x => ({
  name: x,
  data: require(`./charts/${x}.json`)
}))

var interpolators = [
  // These are from d3-scale.
  "Viridis",
  "Inferno",
  "Magma",
  "Plasma",
  "Warm",
  "Cool",
  "Rainbow",
  "CubehelixDefault",
  // These are from d3-scale-chromatic
  "Blues",
  "Greens",
  "Greys",
  "Oranges",
  "Purples",
  "Reds",
  "BuGn",
  "BuPu",
  "GnBu",
  "OrRd",
  "PuBuGn",
  "PuBu",
  "PuRd",
  "RdPu",
  "YlGnBu",
  "YlGn",
  "YlOrBr",
  "YlOrRd"
]

function makeSafe(e) {
  const seqInt = typeof e.gradients.sequential === 'string' 
    ? d3['interpolate' + e.gradients.sequential] 
    : d3.interpolateRgbBasis(e.gradients.sequential)
  const seqScale = domain => d3.scaleSequential(seqInt).domain(domain)
  const divInt = typeof e.gradients.sequential === 'string' 
    ? d3['interpolate' + e.gradients.sequential] 
    : d3.interpolateRgbBasis(e.gradients.sequential)
  const divScale = domain => d3.scaleDiverging(divInt).domain(domain)
  return {
    backgroundColor: e.backgroundColor,
    axisText: e.axisText || {},
    axisLines: e.axisLines || {},
    gridLines: e.gridLines || false,
    labels: {
      ...e.labels,
      title: (e.labels && e.labels.title) || {},
      xAxis: (e.labels && e.labels.xAxis) || {},
      yAxis: (e.labels && e.labels.yAxis) || {},
    },
    gradients: {
      sequential: (e.gradients && e.gradients.sequential) || {
        '0': '#020024',
        '37': '#090979',
        '100': '#00d4ff'
      },
      diverging: (e.gradients && e.gradients.diverging) || {
        '0': '#e42d21',
        '47': '#e8e0bb',
        '100': '#56d73c'
      }
    },
    selectionHighlight: e.selectionHighlight || '#737373',
    colorScales: {
      sequential: seqScale,
      diverging: divScale
    },
    viewbox: e.viewbox || {
      backgroundFill: "none",
      selectionFill: "rgba(0,0,0,0.1)",
      selectionStroke: "#ddd"
    }
  }
}

export default function loadTheme(themeName) {
  let theme = themes.find(x => x.name === themeName)
  if(!theme) {
    return makeSafe(themes[0].data)
  }
  return makeSafe(theme.data)
}
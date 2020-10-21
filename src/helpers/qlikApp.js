const enigma = require('enigma.js')
const schema = require('enigma.js/schemas/12.20.0.json')

let config = {
  host: 'localhost',
  isSecure: false,
  port: 4848,
  prefix: '',
  appId: 'Consumer Sales.qvf',
  identity: new URLSearchParams(window.location.search).get('identity') || 'openfin',
}

// config = {
//   host: "sense1.calibrateconsulting.com",
//   isSecure: true,
//   port: 443,
//   prefix: "",
//   appId: "6729311b-f919-4bd2-93a8-872f7271856c",
// }

const session = enigma.create({
  schema,
  url: `ws${config.isSecure ? 's' : ''}://${config.host}:${config.port}/${config.prefix ? `${config.prefix}/` : ''}app/engineData/identity/${config.identity}`,
  // createSocket: (url) => new WebSocket(url),
})

export function openSession() {
  return new Promise((resolve, reject) => {
    session
      .open()
      .then((qlik) => {
        qlik.openDoc(config.appId).then((qDoc) => {
          resolve(qDoc)
        })
      })
      .catch((err) => {
        reject(err)
      })
    session.on('opened', () => {
      console.log('session; opened')
    })
    session.on('closed', () => {
      console.log('session; closed')
    })
    session.on('suspended', (evt) => {
      // qlik ended
      console.log('session; suspended', evt)
    })
    session.on('resumed', () => {
      console.log('session; resumed')
    })
    session.on('notification:*', (eventName, data) => console.log(`notification:${eventName}`, data))
    // session.on('traffic:sent', (req) => console.log('traffic:sent', req));
    // session.on('traffic:received', (res) => console.log('traffic: received', res));
    session.on('socket-error', (res) => {
      console.log('socket-error', res)
    })
  })
}

export function closeSession() {
  session.close()
}

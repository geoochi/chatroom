import http from 'http'
import { WebSocketServer } from 'ws'
import fs from 'fs'
const server = http.createServer()

function t() {
  return new Date().toLocaleString()
}

// basic HTTP/HTTPS response
server.on('request', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
  })
  // res.end('WebSocket server is running. Please return to the WebSocket client page.')
  res.end(fs.readFileSync('index.html'))
})

// create WebSocket server instance
const wss = new WebSocketServer({ server })

// listen connection event
wss.on('connection', ws => {
  console.log(`[${t()}] new client connected`)

  // listen message event
  ws.on('message', message => {
    console.log(`[${t()}] received: ${message.toString()}`)

    // send reply message
    ws.send(`${message}`)
  })

  // listen close event
  ws.on('close', () => {
    console.log(`[${t()}] client disconnected`)
  })

  // send welcome message
  ws.send('welcome to the websocket server!')
})

// start server
server.listen(3000, () => {
  console.log(`WebSocket server is running on ws://localhost:3000`)
  console.log(`Http server is running on http://localhost:3000`)
})

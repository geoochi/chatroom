import http from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import fs from 'fs'

const server = http.createServer()

// Chat history and connected clients storage
interface ChatMessage {
  time: string
  content: string
}
const chatHistory: ChatMessage[] = []
const clients = new Set<WebSocket>()

function t() {
  return new Date().toLocaleString()
}

// Broadcast message to all connected clients
function broadcast(message: string) {
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message)
    }
  })
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

  // Add client to the set
  clients.add(ws)

  // Send chat history to new client
  ws.send(
    JSON.stringify({
      type: 'history',
      messages: chatHistory,
    })
  )

  // listen message event
  ws.on('message', message => {
    const currentTime = t()
    console.log(`[${currentTime}] received: ${message.toString()}`)

    // Store message in chat history
    const newMessage = {
      time: currentTime,
      content: message.toString(),
    }
    chatHistory.push(newMessage)

    // Broadcast message to all clients
    broadcast(
      JSON.stringify({
        type: 'message',
        message: newMessage,
      })
    )
  })

  // listen close event
  ws.on('close', () => {
    console.log(`[${t()}] client disconnected`)
    clients.delete(ws)
  })

  // send welcome message
  const welcomeMsg = {
    time: t(),
    content: 'welcome to the chat room!',
  }
  chatHistory.push(welcomeMsg)
  ws.send(
    JSON.stringify({
      type: 'message',
      message: welcomeMsg,
    })
  )
})

// start server
server.listen(3000, () => {
  console.log(`WebSocket server is running on ws://localhost:3000`)
  console.log(`Http server is running on http://localhost:3000`)
})

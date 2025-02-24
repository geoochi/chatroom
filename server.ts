import http from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import fs from 'fs'
import Database from 'better-sqlite3'

const server = http.createServer()

// Chat history and connected clients storage
interface ChatMessage {
  time: string
  content: string
}

const clients = new Set<WebSocket>()

// Initialize SQLite database
const db = new Database('db/chat.db')

// Create messages table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    time TEXT NOT NULL,
    content TEXT NOT NULL
  )
`)

// Prepare statements
const insertMessage = db.prepare(
  'INSERT INTO messages (time, content) VALUES (?, ?)'
)
const getAllMessages = db.prepare(
  'SELECT time, content FROM messages ORDER BY id ASC'
)

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

// Load chat history from database
function loadChatHistory(): ChatMessage[] {
  try {
    return getAllMessages.all() as ChatMessage[]
  } catch (error) {
    console.error('Error loading chat history:', error)
    return []
  }
}

// Save message to database
function saveMessage(message: ChatMessage) {
  try {
    insertMessage.run(message.time, message.content)
  } catch (error) {
    console.error('Error saving message:', error)
  }
}

// basic HTTP/HTTPS response
server.on('request', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
  })
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
  const chatHistory = loadChatHistory()
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

    // Create new message
    const newMessage = {
      time: currentTime,
      content: message.toString(),
    }

    // Save to database
    saveMessage(newMessage)

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
  // saveMessage(welcomeMsg)
  ws.send(
    JSON.stringify({
      type: 'message',
      message: welcomeMsg,
    })
  )
})

// Handle process termination
process.on('SIGINT', () => {
  db.close()
  console.log('Database connection closed.')
  process.exit(0)
})

// start server
server.listen(3000, () => {
  console.log(`WebSocket server is running on ws://localhost:3000`)
  console.log(`Http server is running on http://localhost:3000`)
})

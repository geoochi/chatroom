import http from 'http'
import { WebSocketServer } from 'ws'
import fs from 'fs'
const server = http.createServer()

// 添加基本的 HTTP/HTTPS 响应
server.on('request', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
  })
  // res.end('WebSocket 服务器正在运行。请返回到 WebSocket 客户端页面。')
  res.end(fs.readFileSync('index.html'))
})

// 创建 WebSocket 服务器实例
const wss = new WebSocketServer({ server })

// 监听连接事件
wss.on('connection', ws => {
  console.log('新的客户端连接')

  // 监听消息事件
  ws.on('message', message => {
    console.log('收到消息:', message.toString())

    // 发送回复消息
    ws.send(`服务器收到消息: ${message}`)
  })

  // 监听关闭事件
  ws.on('close', () => {
    console.log('客户端断开连接')
  })

  // 发送欢迎消息
  ws.send('欢迎连接到 WebSocket 服务器！')
})

// 启动服务器
server.listen(3000, () => {
  console.log('WebSocket 服务器运行在 ws://localhost:3000')
  console.log('Http 服务器运行在 http://localhost:3000')
})

const path = require('path')
const express = require('express')
const http = require('http')
const socketio = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
  socket.broadcast.emit('message', 'a user just joined!');
  socket.on('message chat', (msg) => {
    // socket.broadcast.emit('message chat', msg);
    io.emit('message chat', msg);
  });

  socket.on('disconnect', () => {
    io.emit('message', 'a user has left!');
  })
})

server.listen(port, () => {
  console.log(`Server is up on port ${port}!`)
})

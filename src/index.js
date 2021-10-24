const path = require('path');
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage } = require('./utils/messages');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

io.on('connection', (socket) => {
  socket.emit('messageChat', generateMessage('Welcome!'));
  socket.broadcast.emit('message', 'a user just joined!');
  socket.on('chatMessage', (msg, callback) => {
    const filter = new Filter();
    if(filter.isProfane(msg)) {
      return callback('Profanity is not allowed!');
    }

    io.emit('messageChat', generateMessage(msg));
    callback();
  });

  socket.on('sendLocation', (coords, callback) => {
    io.emit('locationMessage', generateMessage(`https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`));

    callback();
  });

  socket.on('disconnect', () => {
    io.emit('message', generateMessage('a user has left!'));
  });
})

server.listen(port, () => {
  console.log(`Server is up on port ${port}!`)
});

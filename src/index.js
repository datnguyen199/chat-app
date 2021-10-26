const path = require('path');
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

io.on('connection', (socket) => {
  socket.on('join', ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });

    if(error) {
      return callback(error);
    }

    socket.join(user.room);

    socket.emit('messageChat', generateMessage('Welcome!'));
    socket.broadcast.to(user.room).emit('messageChat', generateMessage(`${user.username} joined!`));

    callback();
  })

  socket.on('chatMessage', (msg, callback) => {
    const filter = new Filter();
    if(filter.isProfane(msg)) {
      return callback('Profanity is not allowed!');
    }

    io.to('rrr').emit('messageChat', generateMessage(msg));
    callback();
  });

  socket.on('sendLocation', (coords, callback) => {
    io.emit('locationMessage', generateMessage(`https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`));

    callback();
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if(user) {
      io.to(user.room).emit('disconnectMessage', generateMessage(`${user.username} has left!`));
    }
  });
})

server.listen(port, () => {
  console.log(`Server is up on port ${port}!`)
});

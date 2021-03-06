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

// const chatNamespace = io.of("/chats");
io.on('connection', (socket) => {
  socket.on('join', ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });

    if(error) {
      return callback(error);
    }

    socket.join(user.room);

    socket.emit('messageChat', generateMessage('Welcome!'));
    socket.broadcast.to(user.room).emit('messageChat', generateMessage(`${user.username} joined!`));
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    });

    callback();
  })

  socket.on('chatMessage', (msg, callback) => {
    const filter = new Filter();
    if(filter.isProfane(msg)) {
      return callback('Profanity is not allowed!');
    }

    const user = getUser(socket.id);
    if(!user) {
      return callback('Cannot get user!');
    }

    io.to(user.room).emit('messageChat', generateMessage(msg, user.username));
    callback();
  });

  socket.on('sendLocation', (coords, callback) => {
    const user = getUser(socket.id);
    if(!user) {
      return callback('Cannot get user!');
    }

    io.to(user.room).emit('locationMessage', generateMessage(`https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`, user.username));

    callback();
  });

  socket.on('typing', ({ username, room, isTyping }, callback) => {
    socket.broadcast.to(room).emit('typing', username.trim().toLowerCase(), isTyping);
  });

  socket.on('delete-typing', ({ username, room }, callback) => {
    socket.broadcast.to(room).emit('delete-typing', username.trim().toLowerCase());
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if(user) {
      io.to(user.room).emit('disconnectMessage', generateMessage(`${user.username} has left!`));
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      });
    }
  });
})

server.listen(port, () => {
  console.log(`Server is up on port ${port}!`)
});

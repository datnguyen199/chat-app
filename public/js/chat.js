var socket = io();

var form = document.getElementById('form');
var input = document.getElementById('input');
var message = document.getElementById('messages');

form.addEventListener('submit', function(e){
  e.preventDefault();
  if(input.value) {
    socket.emit('message chat', input.value);
    input.value = '';
  }
})

socket.on('message chat', function(msg) {
  var item = document.createElement('li');
  item.textContent = msg;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
});

socket.on('message', (msg) => {
  console.log(msg);
});

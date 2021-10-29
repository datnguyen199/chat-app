var socket = io();

var form = document.getElementById('message-form');
var input = document.getElementById('input');
var message = document.getElementById('messages');
var sendMessageButton = document.getElementById('send-message');
var sendLocaltionButton = document.getElementById('send-location');
var messages = document.getElementById('display-messages');
var messageTemplate = document.getElementById('message-template').innerHTML;
var locationTemplate = document.getElementById('location-template').innerHTML;
var sidebartTemplate = document.getElementById('sidebar-template').innerHTML;
var typingTemplate = document.getElementById('user-typing-template').innerHTML;

let { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });
var isTyping = true;
var countKeyUp = 0;

const autoscroll = () => {
  const $newMessage = messages.lastElementChild;
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
  const visibleHeight = messages.offsetHeight;
  const containerHeight = messages.scrollHeight;
  const scrollOffset = messages.scrollTop + visibleHeight;
  if(containerHeight - newMessageHeight <= scrollOffset) {
    messages.scrollTop = messages.scrollHeight;
  }
}

input.addEventListener('keyup', function(e) {
  if(input.value && (e.keyCode !== 13 || e.key !== 'Enter')) {
    countKeyUp++;
    if(countKeyUp == 1) {
      isTyping = true;
    } else {
      isTyping = false;
    }
    socket.emit('typing', { username, room, isTyping });
  }
});

input.addEventListener('keyup', function(e) {
  if((e.which == 8 || e.which == 46) && input.value == "") {
    countKeyUp = 0;
    isTyping = false;
    socket.emit('delete-typing', { username, room });
  }
})

form.addEventListener('submit', function(e){
  e.preventDefault();
  if(input.value) {
    socket.emit('chatMessage', input.value, (error) => {
      if(error) {
        messages.insertAdjacentHTML('beforeend', `<p>${error}</p>`);
        return;
      }
    });
    input.value = '';
    input.focus();
  }
});

function successLocation(pos) {
  var crd = pos.coords;

  socket.emit('sendLocation', { latitude: crd.latitude, longitude: crd.longitude }, () => {
    sendLocaltionButton.removeAttribute('disabled');
  });
}

function errorLocation(err) {
  console.warn(`ERROR(${err.code}): ${err.message}`);
}

sendLocaltionButton.addEventListener('click', function() {
  sendLocaltionButton.setAttribute('disabled', 'disabled');

  if(!navigator.geolocation) {
    return alert('Geolocation is not supported!');
  }

  navigator.geolocation.getCurrentPosition(successLocation, errorLocation);
})

socket.on('messageChat', function(msg) {
  const html = Mustache.render(messageTemplate, {
    username: msg.username,
    msg: `${msg.text}`,
    createdAt: moment(msg.createdAt).format('h:mm A')
  });
  let firstTypingElement = document.querySelector(('[id^="typing-"]'));

  countKeyUp = 0;
  isTyping = true;
  if(firstTypingElement) {
    firstTypingElement.insertAdjacentHTML('beforebegin', html);
  } else {
    messages.insertAdjacentHTML('beforeend', html);
  }

  let element = document.getElementById(`typing-${msg.username}`);
  if(element) element.remove();
  autoscroll();
});

socket.on('delete-typing', function(username) {
  let element = document.getElementById(`typing-${username}`);
  if(element) element.remove();
  autoscroll();
});

socket.on('locationMessage', function(url) {
  const html = Mustache.render(locationTemplate, {
    username: url.username,
    url: url.text,
    createdAt: moment(url.createdAt).format('h:mm A')
  });
  messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('typing', function(username, isTyping) {
  const html = Mustache.render(typingTemplate, {
    username: username
  });
  if(isTyping) {
    messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
  }
})

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebartTemplate, {
    room,
    users
  });

  document.querySelector('#sidebar').innerHTML = html;
})

socket.on('disconnectMessage', (msg) => {
  messages.insertAdjacentHTML('beforeend', `<p>${msg.text} at ${moment(msg.createdAt).format('h:mm A')}</p>`);
  autoscroll();
});

socket.emit('join', { username, room }, (error) => {
  if(error) {
    alert(error);
    location.href = '/'
  }
});

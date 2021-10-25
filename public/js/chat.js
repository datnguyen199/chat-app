var socket = io();

var form = document.getElementById('message-form');
var input = document.getElementById('input');
var message = document.getElementById('messages');
var sendMessageButton = document.getElementById('send-message');
var sendLocaltionButton = document.getElementById('send-location');
var messages = document.getElementById('display-messages');
var messageTemplate = document.getElementById('message-template').innerHTML;
var locationTemplate = document.getElementById('location-template').innerHTML;

let { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

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
    console.log('location shared!')
  });
  // console.log('Your current position is:');
  // console.log(`Latitude : ${crd.latitude}`);
  // console.log(`Longitude: ${crd.longitude}`);
  // console.log(`More or less ${crd.accuracy} meters.`);
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
    msg: `${msg.text}`,
    createdAt: moment(msg.createdAt).format('h:mm A')
  });
  messages.insertAdjacentHTML('beforeend', html);
  // var item = document.createElement('li');
  // item.textContent = msg;
  // messages.appendChild(item);
  // window.scrollTo(0, document.body.scrollHeight);
});

socket.on('locationMessage', function(url) {
  const html = Mustache.render(locationTemplate, {
    url: url.text,
    createdAt: moment(url.createdAt).format('h:mm A')
  });
  messages.insertAdjacentHTML('beforeend', html);
});

socket.on('disconnectMessage', (msg) => {
  messages.insertAdjacentHTML('beforeend', `<p>${msg.text} at ${moment(msg.createdAt).format('h:mm A')}</p>`);
});

socket.emit('join', { username, room }, (error) => {
  if(error) {
    alert(error);
    location.href = '/'
  }
});

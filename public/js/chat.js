var socket = io();

var form = document.getElementById('form');
var input = document.getElementById('input');
var message = document.getElementById('messages');
var sendLocaltionButton = document.getElementById('send-location');

form.addEventListener('submit', function(e){
  e.preventDefault();
  if(input.value) {
    socket.emit('message chat', input.value, (error) => {
      if(error) {
        return console.log(error);
      }
    });
    input.value = '';
  }
});

function successLocation(pos) {
  var crd = pos.coords;

  socket.emit('send location', { latitude: crd.latitude, longitude: crd.longitude }, () => {
    console.log('location shared!')
  });
  console.log('Your current position is:');
  console.log(`Latitude : ${crd.latitude}`);
  console.log(`Longitude: ${crd.longitude}`);
  console.log(`More or less ${crd.accuracy} meters.`);
}

function errorLocation(err) {
  console.warn(`ERROR(${err.code}): ${err.message}`);
}

sendLocaltionButton.addEventListener('click', function() {
  if(!navigator.geolocation) {
    return alert('Geolocation is not supported!');
  }

  navigator.geolocation.getCurrentPosition(successLocation, errorLocation);
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

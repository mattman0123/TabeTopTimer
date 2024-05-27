let timerInterval;
let remainingTime = 0;
let running = false;
let endTime = null;

const socket = io();

function updateTimerDisplay() {
  if (remainingTime <= 0) {
    document.getElementById('timer-display').innerText = '00:00:00';
    clearInterval(timerInterval);
    running = false;
    toggleButtons();
    return;
  }

  const seconds = Math.floor(remainingTime / 1000) % 60;
  const minutes = Math.floor(remainingTime / (1000 * 60)) % 60;
  const hours = Math.floor(remainingTime / (1000 * 60 * 60));
  document.getElementById('timer-display').innerText =
    `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

socket.on('timerUpdate', (state) => {
  running = state.running;
  remainingTime = state.remainingTime;
  endTime = state.endTime;

  if (running) {
    startTimerInterval();
  } else {
    clearInterval(timerInterval);
    updateTimerDisplay();
  }
  toggleButtons();
});

socket.on('backgroundUpdate', (imageUrl) => {
  const decodedUrl = decodeURIComponent(imageUrl);
  document.body.style.backgroundImage = `url(${decodedUrl})`;
});

function toggleTimer() {
  const timeInput = document.getElementById('time-input').value.trim();
  const timePattern = /^(\d{1,2}):([0-5]\d):([0-5]\d)$/;

  if (!timePattern.test(timeInput)) {
    alert('Please enter a valid time in HH:MM:SS format.');
    return;
  }

  const [_, hours, minutes, seconds] = timeInput.match(timePattern);
  const initialTime = (parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds)) * 1000;

  socket.emit('startTimer', initialTime);
}

function resumeTimer() {
  if (!running && remainingTime > 0) {
    socket.emit('resumeTimer');
  }
}

function pauseTimer() {
  if (running && remainingTime > 0) {
    socket.emit('pauseTimer');
  }
}

function resetTimer() {
  socket.emit('resetTimer');
  document.getElementById('start-button').style.display = 'inline-block';
  document.getElementById('pause-button').style.display = 'none';
  document.getElementById('play-button').style.display = 'none';
}

function startTimerInterval() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    remainingTime = endTime - Date.now();
    updateTimerDisplay();
  }, 1000);
}

document.getElementById('bg-image-input').addEventListener('change', function(event) {
  const file = event.target.files[0];
  const formData = new FormData();
  formData.append('bgImage', file);

  fetch('/upload', {
    method: 'POST',
    body: formData,
  })
  .then(response => response.json())
  .then(data => {
    const decodedUrl = decodeURIComponent(data.imageUrl);
    document.body.style.backgroundImage = `url(${decodedUrl})`;
    document.getElementById('bg-image-input').value = '';
  })
  .catch(error => {
    console.error('Error uploading image:', error);
  });
});

function toggleMenu() {
  const buttonsContainer = document.getElementById('buttons-container');
  if (buttonsContainer.style.display === 'none' || buttonsContainer.style.display === '') {
    buttonsContainer.style.display = 'flex';
  } else {
    buttonsContainer.style.display = 'none';
  }
}

function toggleButtons() {
  if (running) {
    document.getElementById('start-button').style.display = 'none';
    document.getElementById('pause-button').style.display = 'inline-block';
    document.getElementById('play-button').style.display = 'none';
  } else if (remainingTime > 0) {
    document.getElementById('start-button').style.display = 'none';
    document.getElementById('pause-button').style.display = 'none';
    document.getElementById('play-button').style.display = 'inline-block';
  } else {
    document.getElementById('start-button').style.display = 'inline-block';
    document.getElementById('pause-button').style.display = 'none';
    document.getElementById('play-button').style.display = 'none';
  }
}

function generateQRCode() {
  const hostname = document.getElementById('hostname').value.trim();
  if (!hostname) {
    alert('Please enter a valid hostname.');
    return;
  }

  const url = `http://${hostname}`;
  const qrcodeCanvas = document.getElementById('qrcode');
  
  QRCode.toCanvas(qrcodeCanvas, url, function (error) {
    if (error) console.error(error);
    console.log('QR code generated!');
  });
}

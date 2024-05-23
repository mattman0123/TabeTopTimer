const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  }
});

const upload = multer({ storage: storage });

let timerState = {
  running: false,
  remainingTime: 0,
  endTime: null,
};

let backgroundImage = null;

app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/upload', upload.single('bgImage'), (req, res) => {
  if (backgroundImage) {
    fs.unlinkSync(path.join(__dirname, backgroundImage));
  }
  backgroundImage = `uploads/${req.file.filename}`;
  const imageUrl = `/${backgroundImage}`;
  io.emit('backgroundUpdate', imageUrl);
  res.json({ imageUrl });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'password') {
    req.session.isAdmin = true;
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

app.post('/logout', (req, res) => {
  req.session.isAdmin = false;
  res.json({ success: true });
});

app.get('/admin', (req, res) => {
  if (req.session.isAdmin) {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  } else {
    res.redirect('/');
  }
});

io.on('connection', (socket) => {
  socket.emit('timerUpdate', timerState);
  if (backgroundImage) {
    const imageUrl = `/${backgroundImage}`;
    socket.emit('backgroundUpdate', imageUrl);
  }

  socket.on('startTimer', (initialTime) => {
    if (!timerState.running) {
      timerState.running = true;
      timerState.remainingTime = initialTime;
      timerState.endTime = Date.now() + initialTime;
      io.emit('timerUpdate', timerState);
    }
  });

  socket.on('pauseTimer', () => {
    if (timerState.running) {
      timerState.running = false;
      timerState.remainingTime = timerState.endTime - Date.now();
      io.emit('timerUpdate', timerState);
    }
  });

  socket.on('resumeTimer', () => {
    if (!timerState.running && timerState.remainingTime > 0) {
      timerState.running = true;
      timerState.endTime = Date.now() + timerState.remainingTime;
      io.emit('timerUpdate', timerState);
    }
  });
  
  socket.on('resetTimer', () => {
    timerState.running = false;
    timerState.remainingTime = 0;
    timerState.endTime = null;
    io.emit('timerUpdate', timerState);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(3000, () => {
  console.log('Server is listening on port 3000');
});

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const createTables = require('./db/schema');
const authRoutes = require('./routes/auth');
const guestRoutes = require('./routes/guests');
const checkinRoutes = require('./routes/checkin');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:5173',
  'https://wedding-attendance-ten.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
};

const io = new Server(server, {
  cors: corsOptions
});

app.use(cors(corsOptions));
app.use(express.json());

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/checkin', checkinRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Wedding Attendance API is running' });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('guest_checked_in', (data) => {
    io.emit('guest_checked_in', data);
  });
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await createTables();
});
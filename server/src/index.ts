import dotenv from 'dotenv';
dotenv.config();
import app from './app';
import connectDB from './db/db';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
// Use require to avoid TypeScript including files outside of `rootDir` during compile
// @ts-ignore
import { initSocket } from './socket/chat.socket';
import { addUserSocket, removeUserSocket } from './socket/socketManager';
import { startMonthlyBillJob } from './cronJob/startMonthlyCronJob.job';
import { startTokenExpiryJob } from './cronJob/token-expiry.job';
import { seedGuestUsers } from './utils/seedGuestUsers';

const port = parseInt(process.env.PORT || '5000', 10);

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'https://tiffinwala-kkw.vercel.app',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

initSocket(io);

io.on('connection', (socket: Socket) => {
  console.log('Connected:', socket.id);

  socket.on('register', (userId: string) => {
    addUserSocket(userId, socket.id);
  });

  socket.on('disconnect', () => {
    removeUserSocket(socket.id);
  });
});

connectDB()
  .then(async () => {
    await seedGuestUsers();
    startMonthlyBillJob();
    startTokenExpiryJob();
    httpServer.listen(port, () => {
      console.log(`Server running on  http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.log('MongoDB connection error', err);
    process.exit(1);
  });

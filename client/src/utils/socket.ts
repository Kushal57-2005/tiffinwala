// src/utils/socket.ts
import { io, Socket } from 'socket.io-client';

const URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export const socket: Socket = io(URL, {
  autoConnect: false, // connect manually after login
  withCredentials: true,
});

// Helper to join a chat room
export const joinChatRoom = (customerId: string, vendorId: string) => {
  socket.emit('joinRoom', { customerId, vendorId });
};

// Helper to send a message
export const sendChatMessage = (payload: {
  customerId: string;
  vendorId: string;
  senderId: string;
  senderRole: 'customer' | 'vendor';
  text: string;
}) => {
  socket.emit('sendMessage', payload);
};

// Connect socket (call after login)
export const connectSocket = () => {
  if (!socket.connected) socket.connect();
};

// Disconnect socket (call on logout)
export const disconnectSocket = () => {
  if (socket.connected) socket.disconnect();
};

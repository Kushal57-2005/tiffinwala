import { Server, Socket } from 'socket.io';
import mongoose from 'mongoose';
import { Order } from '../models/Order.model';
import { Message } from '../models/Message.model';
import { Customer } from '../models/Customer.model';
import { Vendor } from '../models/Vendor.model';
import { User } from '../models/User.model';
import {
  setIoInstance,
  addUserSocket,
  removeUserSocket,
  getUserSockets,
} from './socketManager';
import { createNotification } from '../utils/notification';

export const initSocket = (io: Server) => {
  // Force User schema registration for populated fields
  const _ = User;

  // Initialize the socket manager with the Server instance
  setIoInstance(io);

  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Register active user connections (handles string payload or nested object)
    socket.on('register', (data: any) => {
      const userId =
        typeof data === 'object' && data !== null ? data.userId : data;
      if (userId) {
        addUserSocket(userId, socket.id);
      }
    });

    // ─── JOIN ROOM ───────────────────────────────────────────────
    socket.on(
      'joinRoom',
      async ({
        customerId,
        vendorId,
      }: {
        customerId: string;
        vendorId: string;
      }) => {
        try {
          // Unlock check — must have at least one order between them
          const orderExists = await Order.findOne({
            customerId: new mongoose.Types.ObjectId(customerId),
            vendorId: new mongoose.Types.ObjectId(vendorId),
          }).lean();

          if (!orderExists) {
            socket.emit('roomError', {
              message: 'Place an order first to chat with this vendor',
            });
            return;
          }

          const roomId = `${customerId}_${vendorId}`;
          socket.join(roomId);
          console.log(`Socket ${socket.id} joined room ${roomId}`);

          socket.emit('joinedRoom', { roomId });
        } catch (err) {
          console.error('joinRoom error:', err);
          socket.emit('roomError', { message: 'Failed to join room' });
        }
      },
    );

    // ─── SEND MESSAGE ────────────────────────────────────────────
    socket.on(
      'sendMessage',
      async ({
        customerId,
        vendorId,
        senderId,
        senderRole,
        text,
      }: {
        customerId: string;
        vendorId: string;
        senderId: string;
        senderRole: 'customer' | 'vendor';
        text: string;
      }) => {
        try {
          if (!text?.trim()) {
            socket.emit('messageError', { message: 'Message cannot be empty' });
            return;
          }

          const roomId = `${customerId}_${vendorId}`;

          // Check sender is actually in this room
          if (!socket.rooms.has(roomId)) {
            socket.emit('messageError', {
              message: 'Join the room before sending messages',
            });
            return;
          }

          const message = await Message.create({
            customerId: new mongoose.Types.ObjectId(customerId),
            vendorId: new mongoose.Types.ObjectId(vendorId),
            senderId: new mongoose.Types.ObjectId(senderId),
            senderRole,
            text: text.trim(),
            isRead: false,
            isComplaint: false,
            complaintStatus: 'none',
          });

          // Broadcast to everyone in the room (including sender)
          io.to(roomId).emit('receiveMessage', message);

          // Notify receiver & update conversations lists
          try {
            let customerDoc: any = null;
            let vendorDoc: any = null;

            if (senderRole === 'customer') {
              const [cDoc, vDoc] = await Promise.all([
                Customer.findById(customerId).populate('userId', 'firstName').lean() as any,
                Vendor.findById(vendorId).lean() as any,
              ]);
              customerDoc = cDoc;
              vendorDoc = vDoc;
              const senderName = customerDoc?.userId?.firstName || 'Customer';
              await createNotification({
                userId: vendorDoc?.userId,
                title: 'New Message 💬',
                message: `New message from ${senderName}`,
                type: 'chat',
                data: { customerId, vendorId, messageId: message._id.toString() },
              });
            } else {
              const [vDoc, cDoc] = await Promise.all([
                Vendor.findById(vendorId).lean() as any,
                Customer.findById(customerId).lean() as any,
              ]);
              customerDoc = cDoc;
              vendorDoc = vDoc;
              const senderName = vendorDoc?.businessName || 'Vendor';
              await createNotification({
                userId: customerDoc?.userId,
                title: 'New Message 💬',
                message: `New message from ${senderName}`,
                type: 'chat',
                data: { customerId, vendorId, messageId: message._id.toString() },
              });
            }

            // Real-time conversation list updates
            const custUserId = customerDoc?.userId?._id || customerDoc?.userId;
            const vendUserId = vendorDoc?.userId;
            const notifyUsers = [custUserId, vendUserId].filter(Boolean);
            for (const uId of notifyUsers) {
              const userSockets = getUserSockets(uId.toString());
              userSockets.forEach((sId) => {
                io.to(sId).emit('conversationUpdate', {
                  customerId,
                  vendorId,
                  latestMessage: message.text,
                  latestMessageTime: message.createdAt,
                  senderRole,
                });
              });
            }
          } catch (notifErr) {
            // Don't fail message send if notification fails
            console.error('Notification / Conversation update failed:', notifErr);
          }
        } catch (err) {
          console.error('sendMessage error:', err);
          socket.emit('messageError', { message: 'Failed to send message' });
        }
      },
    );

    // ─── TYPING INDICATOR (bonus — useful for chat UI) ───────────
    socket.on(
      'typing',
      ({
        customerId,
        vendorId,
        senderRole,
      }: {
        customerId: string;
        vendorId: string;
        senderRole: 'customer' | 'vendor';
      }) => {
        const roomId = `${customerId}_${vendorId}`;
        // Broadcast to the OTHER person in the room only
        socket.to(roomId).emit('partnerTyping', { senderRole });
      },
    );

    socket.on(
      'stopTyping',
      ({ customerId, vendorId }: { customerId: string; vendorId: string }) => {
        const roomId = `${customerId}_${vendorId}`;
        socket.to(roomId).emit('partnerStoppedTyping');
      },
    );

    // ─── DISCONNECT ──────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      removeUserSocket(socket.id);
    });
  });
};

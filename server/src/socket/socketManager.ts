import { Server } from 'socket.io';

// In-memory mapping of: userId -> Set of socketIds
const userSocketsMap = new Map<string, Set<string>>();

// In-memory mapping of: socketId -> userId (for quick reverse lookup on disconnect)
const socketToUserMap = new Map<string, string>();

// Global Socket.io Server instance reference
let ioInstance: Server | null = null;

/**
 * Sets the active Socket.io Server instance
 */
export const setIoInstance = (io: Server) => {
  ioInstance = io;
  console.log('[SocketManager] Io instance set successfully.');
};

/**
 * Associates a socketId with a userId
 */
export const addUserSocket = (userId: string, socketId: string) => {
  if (!userId || !socketId) return;

  const userIdStr = userId.toString();

  if (!userSocketsMap.has(userIdStr)) {
    userSocketsMap.set(userIdStr, new Set<string>());
  }

  userSocketsMap.get(userIdStr)!.add(socketId);
  socketToUserMap.set(socketId, userIdStr);

  console.log(`[SocketManager] Registered socket [${socketId}] for user [${userIdStr}]. Total active sockets for user: ${userSocketsMap.get(userIdStr)!.size}`);
};

/**
 * Removes a socketId from all maps
 */
export const removeUserSocket = (socketId: string) => {
  const userId = socketToUserMap.get(socketId);
  if (!userId) return;

  socketToUserMap.delete(socketId);

  const sockets = userSocketsMap.get(userId);
  if (sockets) {
    sockets.delete(socketId);
    console.log(`[SocketManager] Deregistered socket [${socketId}] for user [${userId}]. Remaining active sockets: ${sockets.size}`);

    // If no active connections are left for the user, clean up memory
    if (sockets.size === 0) {
      userSocketsMap.delete(userId);
      console.log(`[SocketManager] User [${userId}] has disconnected all devices. Cleaned up in-memory map.`);
    }
  }
};

/**
 * Gets all active socketIds for a given userId
 */
export const getUserSockets = (userId: string): string[] => {
  if (!userId) return [];
  const sockets = userSocketsMap.get(userId.toString());
  return sockets ? Array.from(sockets) : [];
};

/**
 * Sends a real-time notification to all active devices of a user
 */
export const sendRealtimeNotification = (userId: string, notificationPayload: any) => {
  if (!userId) return;

  const userIdStr = userId.toString();
  const sockets = getUserSockets(userIdStr);

  if (sockets.length > 0 && ioInstance) {
    console.log(`[SocketManager] Sending realtime notification to user [${userIdStr}] on ${sockets.length} active socket(s).`);
    sockets.forEach((socketId) => {
      ioInstance!.to(socketId).emit('newNotification', notificationPayload);
    });
  } else {
    console.log(`[SocketManager] No active sockets or Server instance found for user [${userIdStr}]. Skipping realtime emission.`);
  }
};

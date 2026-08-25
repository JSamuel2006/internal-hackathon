import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const socketService = {
  connect: (token: string): Socket => {
    if (socket) {
      if (socket.connected) return socket;
      socket.connect();
      return socket;
    }
    
    socket = io('http://localhost:4000', {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      console.log('[SOCKET] Connected to real-time sync server');
    });

    socket.on('disconnect', (reason) => {
      console.log('[SOCKET] Disconnected from sync server:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('[SOCKET] Connection error:', error);
    });

    return socket;
  },

  getSocket: (): Socket | null => socket,

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  }
};

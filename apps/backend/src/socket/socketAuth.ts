import jwt from 'jsonwebtoken';
import { env } from '../configuration/environment.js';
import { Socket } from 'socket.io';

export interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export function authenticateSocket(socket: AuthenticatedSocket, next: (err?: Error) => void) {
  let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;

  if (token && typeof token === 'string' && token.startsWith('Bearer ')) {
    token = token.slice(7);
  }

  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    socket.user = {
      id: decoded.sub,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
}

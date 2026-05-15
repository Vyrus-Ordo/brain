import { io, Socket } from 'socket.io-client';

let _socket: Socket | null = null;

export function getSocket(): Socket {
  if (!_socket) {
    const url = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';
    _socket = io(url, {
      transports: ['websocket', 'polling'],
    });
  }
  return _socket;
}

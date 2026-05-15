import { Server, Socket } from 'socket.io';

export function setupSocket(io: Server): void {
  io.on('connection', (socket: Socket) => {
    socket.on('join-sala', ({ roomCode }: { roomCode: string }) => {
      socket.join(roomCode);
    });

    // Relay broadcast:jogador_respondeu → todos na sala (incluindo remetente)
    socket.on('broadcast:jogador_respondeu', (data: unknown) => {
      const rooms = [...socket.rooms].filter((r) => r !== socket.id);
      rooms.forEach((room) => io.to(room).emit('jogador_respondeu', data));
    });

    // Relay broadcast:todos_responderam → todos na sala (incluindo remetente)
    // O host já chama revealAnswer() diretamente; o guard no frontend evita duplo-disparo
    socket.on('broadcast:todos_responderam', (data: unknown) => {
      const rooms = [...socket.rooms].filter((r) => r !== socket.id);
      rooms.forEach((room) => io.to(room).emit('todos_responderam', data));
    });

    // Relay broadcast:proxima_pergunta → todos na sala
    socket.on('broadcast:proxima_pergunta', (data: unknown) => {
      const rooms = [...socket.rooms].filter((r) => r !== socket.id);
      rooms.forEach((room) => io.to(room).emit('proxima_pergunta', data));
    });
  });
}

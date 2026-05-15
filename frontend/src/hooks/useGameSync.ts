import { useEffect, useState, useMemo } from 'react';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';
import { useNavigate } from 'react-router-dom';

export const useGameSync = (roomCode: string | null) => {
  const [room, setRoom] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!roomCode) return;

    let isMounted = true;
    const socket = getSocket();

    const onSalaAtualizada = (sala: any) => {
      if (!isMounted) return;
      setRoom(sala);
      const currentPath = window.location.pathname;
      if (sala.estado === 'em_andamento' && currentPath.includes('/lobby/')) {
        navigate(`/jogo/${roomCode}`);
      }
      if (sala.estado === 'finalizada' && currentPath.includes('/jogo/')) {
        navigate(`/final/${roomCode}`);
      }
    };

    const onTodosResponderam = (payload: any) => {
      if (!isMounted) return;
      window.dispatchEvent(new CustomEvent('brain:todos_responderam', { detail: payload }));
    };

    const onJogadorRespondeu = (payload: any) => {
      if (!isMounted) return;
      window.dispatchEvent(new CustomEvent('brain:jogador_respondeu', { detail: payload }));
    };

    const onProximaPergunta = (payload: any) => {
      if (!isMounted) return;
      window.dispatchEvent(new CustomEvent('brain:proxima_pergunta', { detail: payload }));
    };

    socket.on('sala:atualizada', onSalaAtualizada);
    socket.on('todos_responderam', onTodosResponderam);
    socket.on('jogador_respondeu', onJogadorRespondeu);
    socket.on('proxima_pergunta', onProximaPergunta);
    socket.emit('join-sala', { roomCode });

    api
      .getSala(roomCode)
      .then((data) => { if (isMounted) setRoom(data); })
      .catch((err) => console.error('Error fetching room:', err));

    return () => {
      isMounted = false;
      socket.off('sala:atualizada', onSalaAtualizada);
      socket.off('todos_responderam', onTodosResponderam);
      socket.off('jogador_respondeu', onJogadorRespondeu);
      socket.off('proxima_pergunta', onProximaPergunta);
    };
  }, [roomCode, navigate]);

  // Adaptador estável que emula a API channel.send() do Supabase Realtime
  const channel = useMemo(
    () => ({
      send: (msg: { type: string; event: string; payload?: any }) => {
        if (msg.type === 'broadcast') {
          getSocket().emit(`broadcast:${msg.event}`, msg.payload ?? {});
        }
      },
    }),
    [],
  );

  return { room, channel };
};

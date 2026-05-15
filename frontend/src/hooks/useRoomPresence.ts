import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';

export interface Player {
  id: string;
  player_id: string;
  apelido: string;
  pontuacao: number;
  is_host: boolean;
}

export const useRoomPresence = (roomCode: string | null) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomCode) return;

    let isMounted = true;
    const socket = getSocket();

    const onJogadoresAtualizado = (updatedPlayers: Player[]) => {
      if (isMounted) setPlayers(updatedPlayers);
    };

    socket.on('jogadores:atualizado', onJogadoresAtualizado);
    socket.emit('join-sala', { roomCode });

    (async () => {
      try {
        const room = await api.getSala(roomCode);
        if (!isMounted) return;
        const playersData = await api.getJogadores(room.id);
        if (!isMounted) return;
        setPlayers(playersData || []);
        setLoading(false);
      } catch (err: any) {
        if (isMounted) {
          console.error('Error fetching players:', err);
          setError(err.message);
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
      socket.off('jogadores:atualizado', onJogadoresAtualizado);
    };
  }, [roomCode]);

  return { players, loading, error };
};

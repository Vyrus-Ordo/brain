import { useState } from 'react';
import { api } from '../lib/api';
import { useGame } from '../contexts/GameContext';
import { useNavigate } from 'react-router-dom';

export const useJoinRoom = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { state, dispatch } = useGame();
  const navigate = useNavigate();

  const joinRoom = async (code: string) => {
    if (!state.playerName || !state.playerId) {
      setError('Identificação do jogador ausente.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const roomCode = code.toUpperCase();
      const room = await api.getSala(roomCode);

      if (room.estado !== 'lobby') {
        throw new Error('A partida já foi iniciada ou finalizada.');
      }

      await api.upsertJogador(room.id, {
        player_id: state.playerId,
        apelido: state.playerName,
        is_host: room.host_id === state.playerId,
      });

      dispatch({
        type: 'JOIN_ROOM',
        payload: { roomCode, isHost: room.host_id === state.playerId },
      });

      navigate(`/lobby/${roomCode}`);
    } catch (err: any) {
      console.error('Error joining room:', err);
      setError(err.message || 'Erro ao entrar na sala.');
    } finally {
      setLoading(false);
    }
  };

  return { joinRoom, loading, error };
};

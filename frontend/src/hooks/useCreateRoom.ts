import { useState } from 'react';
import { api } from '../lib/api';
import { useGame } from '../contexts/GameContext';
import { useNavigate } from 'react-router-dom';

interface RoomConfig {
  theme: string;
  totalQuestions: number;
  timerSeconds: number;
}

export const useCreateRoom = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { state, dispatch } = useGame();
  const navigate = useNavigate();

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const createRoom = async (config: RoomConfig) => {
    if (!state.playerName || !state.playerId) {
      setError('Player data missing');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const roomCode = generateCode();

      const room = await api.createSala({
        codigo: roomCode,
        tema: config.theme,
        total_perguntas: config.totalQuestions,
        timer_segundos: config.timerSeconds,
        host_id: state.playerId,
      });

      await api.upsertJogador(room.id, {
        player_id: state.playerId,
        apelido: state.playerName,
        is_host: true,
      });

      dispatch({ type: 'JOIN_ROOM', payload: { roomCode, isHost: true } });
      navigate(`/lobby/${roomCode}`);
    } catch (err: any) {
      console.error('Error creating room:', err);
      setError(err.message || 'Erro ao criar sala');
    } finally {
      setLoading(false);
    }
  };

  return { createRoom, loading, error };
};

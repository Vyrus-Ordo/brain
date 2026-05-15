import { useState } from 'react';
import { api } from '../lib/api';

export const useStartGame = () => {
  const [loading, setLoading] = useState(false);

  const startGame = async (roomCode: string) => {
    setLoading(true);
    try {
      const room = await api.getSala(roomCode);
      await api.updateEstado(room.id, 'em_andamento');
    } catch (err) {
      console.error('Error starting game:', err);
    } finally {
      setLoading(false);
    }
  };

  return { startGame, loading };
};

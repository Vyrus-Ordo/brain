import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export const useRanking = (roomCode: string | null) => {
  const [ranking, setRanking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRanking = async () => {
    if (!roomCode) return;
    setLoading(true);
    try {
      const room = await api.getSala(roomCode);
      const players = await api.getRanking(room.id);
      setRanking(players || []);
    } catch (err) {
      console.error('Error fetching ranking:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRanking();
  }, [roomCode]);

  return { ranking, loading, refetch: fetchRanking };
};

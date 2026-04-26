import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useRanking = (roomCode: string | null) => {
  const [ranking, setRanking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRanking = async () => {
    if (!roomCode) return;
    setLoading(true);

    try {
      const { data: room } = await supabase
        .from('salas')
        .select('id')
        .eq('codigo', roomCode)
        .single();

      if (room) {
        const { data: players, error } = await supabase
          .from('jogadores')
          .select('*')
          .eq('sala_id', room.id)
          .order('pontuacao', { ascending: false });

        if (error) throw error;
        setRanking(players || []);
      }
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

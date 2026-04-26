import { useState } from 'react';
import { supabase } from '../lib/supabase';

export const useStartGame = () => {
  const [loading, setLoading] = useState(false);

  const startGame = async (roomCode: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('salas')
        .update({ estado: 'em_andamento' })
        .eq('codigo', roomCode);

      if (error) throw error;
    } catch (err) {
      console.error('Error starting game:', err);
    } finally {
      setLoading(false);
    }
  };

  return { startGame, loading };
};

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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

    let channel: any = null;
    let isMounted = true;

    const setupRealtime = async () => {
      try {
        // 1. Get Room ID first
        const { data: room, error: roomError } = await supabase
          .from('salas')
          .select('id')
          .eq('codigo', roomCode)
          .single();

        if (!isMounted) return;
        if (roomError) throw roomError;
        const roomId = room.id;

        // 2. Initial fetch
        const { data: playersData, error: playersError } = await supabase
          .from('jogadores')
          .select('*')
          .eq('sala_id', roomId)
          .order('joined_at', { ascending: true });

        if (!isMounted) return;
        if (playersError) throw playersError;
        setPlayers(playersData || []);
        setLoading(false);

        // 3. Subscribe to changes
        channel = supabase.channel(`room_players_${roomCode}`);
        
        channel
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'jogadores',
              filter: `sala_id=eq.${roomId}`
            },
            (payload: any) => {
              if (payload.eventType === 'INSERT') {
                setPlayers(prev => [...prev, payload.new as Player]);
              } else if (payload.eventType === 'UPDATE') {
                setPlayers(prev => prev.map(p => p.id === payload.new.id ? (payload.new as Player) : p));
              } else if (payload.eventType === 'DELETE') {
                setPlayers(prev => prev.filter(p => p.id === payload.old.id));
              }
            }
          )
          .subscribe();

      } catch (err: any) {
        if (isMounted) {
          console.error('Error fetching players:', err);
          setError(err.message);
          setLoading(false);
        }
      }
    };

    setupRealtime();

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [roomCode]);

  return { players, loading, error };
};

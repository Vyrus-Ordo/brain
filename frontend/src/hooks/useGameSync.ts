import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export const useGameSync = (roomCode: string | null) => {
  const [room, setRoom] = useState<any>(null);
  const [channel, setChannel] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!roomCode) return;

    let isMounted = true;
    let roomChannel: any = null;

    const fetchRoom = async () => {
      const { data } = await supabase
        .from('salas')
        .select('*')
        .eq('codigo', roomCode)
        .single();

      if (isMounted && data) {
        setRoom(data);
      }
    };

    fetchRoom();

    roomChannel = supabase.channel(`sala:${roomCode}`, {
      config: {
        broadcast: { self: true },
      },
    });
    
    roomChannel
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'salas',
          filter: `codigo=eq.${roomCode}`
        },
        (payload: any) => {
          if (!isMounted) return;
          const newEstado = payload.new.estado;
          setRoom(payload.new);
          
          const currentPath = window.location.pathname;

          // Se o estado mudou para 'em_andamento' e estamos no lobby, navegamos
          if (newEstado === 'em_andamento' && currentPath.includes('/lobby/')) {
            navigate(`/jogo/${roomCode}`);
          }
          
          // Se o estado mudou para 'finalizada' e estamos no jogo, navegamos
          if (newEstado === 'finalizada' && currentPath.includes('/jogo/')) {
            navigate(`/final/${roomCode}`);
          }
        }
      )
      .on('broadcast', { event: 'todos_responderam' }, (payload: any) => {
        if (!isMounted) return;
        window.dispatchEvent(new CustomEvent('brain:todos_responderam', { detail: payload.payload }));
      })
      .on('broadcast', { event: 'jogador_respondeu' }, () => {
        if (!isMounted) return;
        window.dispatchEvent(new CustomEvent('brain:jogador_respondeu'));
      })
      .on('broadcast', { event: 'proxima_pergunta' }, (payload: any) => {
        if (!isMounted) return;
        window.dispatchEvent(new CustomEvent('brain:proxima_pergunta', { detail: payload.payload }));
      })
      .subscribe();

    setChannel(roomChannel);

    return () => {
      isMounted = false;
      if (roomChannel) {
        supabase.removeChannel(roomChannel);
      }
    };
  }, [roomCode, navigate]);

  return { room, channel };
};

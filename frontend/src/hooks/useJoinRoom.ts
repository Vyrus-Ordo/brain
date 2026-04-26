import { useState } from 'react';
import { supabase } from '../lib/supabase';
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

      // 1. Buscar a sala pelo código
      const { data: room, error: roomError } = await supabase
        .from('salas')
        .select('*')
        .eq('codigo', roomCode)
        .single();

      if (roomError || !room) {
        throw new Error('Sala não encontrada.');
      }

      if (room.estado !== 'lobby') {
        throw new Error('A partida já foi iniciada ou finalizada.');
      }

      // 2. Inserir o jogador na sala (ou atualizar se já estiver lá)
      // O UNIQUE(sala_id, player_id) garante que não haja duplicatas
      const { error: playerError } = await supabase
        .from('jogadores')
        .upsert({
          sala_id: room.id,
          player_id: state.playerId,
          apelido: state.playerName,
          is_host: room.host_id === state.playerId
        }, {
          onConflict: 'sala_id, player_id'
        });

      if (playerError) throw playerError;

      // 3. Atualizar contexto e navegar
      dispatch({ 
        type: 'JOIN_ROOM', 
        payload: { 
          roomCode: roomCode, 
          isHost: room.host_id === state.playerId 
        } 
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

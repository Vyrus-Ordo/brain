import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useGame } from '../contexts/GameContext';

export const useSubmitAnswer = () => {
  const [loading, setLoading] = useState(false);
  const { state } = useGame();

  const submitAnswer = async (roomId: string, questionId: string, round: number, answerIndex: number | null) => {
    if (!state.playerId) return null;

    setLoading(true);
    try {
      // 1. Inserir resposta
      const { data, error } = await supabase
        .from('respostas_rodada')
        .insert({
          sala_id: roomId,
          player_id: state.playerId,
          pergunta_id: questionId,
          rodada: round,
          resposta_index: answerIndex
        })
        .select('is_correct')
        .single();

      if (error) throw error;

      // 2. Se correto, atualizar pontuação (permitido por RLS anon)
      if (data.is_correct) {
        // Buscar pontuação atual
        const { data: player } = await supabase
          .from('jogadores')
          .select('id, pontuacao')
          .eq('sala_id', roomId)
          .eq('player_id', state.playerId)
          .single();

        if (player) {
          await supabase
            .from('jogadores')
            .update({ pontuacao: player.pontuacao + 1 })
            .eq('id', player.id);
        }
      }
      return data.is_correct;
    } catch (err) {
      console.error('Error submitting answer:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { submitAnswer, loading };
};

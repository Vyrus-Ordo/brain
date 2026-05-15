import { useState } from 'react';
import { api } from '../lib/api';
import { useGame } from '../contexts/GameContext';

export const useSubmitAnswer = () => {
  const [loading, setLoading] = useState(false);
  const { state } = useGame();

  const submitAnswer = async (
    roomId: string,
    questionId: string,
    round: number,
    answerIndex: number | null,
  ) => {
    if (!state.playerId) return null;

    setLoading(true);
    try {
      const { is_correct } = await api.submitResposta(roomId, {
        player_id: state.playerId,
        pergunta_id: questionId,
        rodada: round,
        resposta_index: answerIndex,
      });
      return is_correct;
    } catch (err) {
      console.error('Error submitting answer:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { submitAnswer, loading };
};

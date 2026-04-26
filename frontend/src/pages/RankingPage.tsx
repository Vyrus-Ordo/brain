import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PlayerListItem from '../components/brain/PlayerListItem';

// Mock data for initial implementation
const MOCK_PLAYERS = [
  { id: '1', name: 'Eduardo (Você)', score: 13, isHost: true, isCurrentPlayer: true },
  { id: '2', name: 'Marcos', score: 10, isHost: false, isCurrentPlayer: false },
  { id: '3', name: 'Jessica', score: 14, isHost: false, isCurrentPlayer: false },
  { id: '4', name: 'Felipe', score: 8, isHost: false, isCurrentPlayer: false },
];

import { useRanking } from '../hooks/useRanking';
import { useGame } from '../contexts/GameContext';
import { useGameSync } from '../hooks/useGameSync';

const RankingPage: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  
  const { ranking, loading } = useRanking(roomCode || null);
  const { room } = useGameSync(roomCode || null);
  const [countdown, setCountdown] = useState(4);

  const hasNavigated = React.useRef(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (!hasNavigated.current) {
      hasNavigated.current = true;
      // Verificar se era a última pergunta
      if (state.currentRound >= (room?.total_perguntas || 10)) {
        // Se for o host, atualiza o status da sala para finalizada
        if (state.isHost && room?.estado !== 'finalizada' && room?.id) {
          import('../lib/supabase').then(({ supabase }) => {
            supabase.from('salas').update({ estado: 'finalizada' }).eq('id', room.id).then();
          });
        }
        navigate(`/final/${roomCode}`);
      } else {
        // Próxima rodada
        dispatch({ type: 'SET_ROUND', payload: state.currentRound + 1 });
        navigate(`/jogo/${roomCode}`);
      }
    }
  }, [countdown, navigate, roomCode, state.currentRound, room, state.isHost, dispatch]);

  return (
    <div className="min-h-screen bg-background flex flex-col animate-fade-in">
      <div className="max-w-md mx-auto px-4 py-8 flex flex-col flex-grow w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-foreground">Ranking</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest tabular-nums">
            após pergunta {state.currentRound}
          </p>
        </div>

        {/* Lista de Jogadores Ordenada */}
        <div className="flex flex-col gap-3 flex-grow">
          {loading ? (
             <div className="animate-shimmer bg-surface-2 h-20 rounded-[14px]" />
          ) : (
            ranking.map((player, index) => (
              <PlayerListItem
                key={player.id}
                name={player.apelido + (player.player_id === state.playerId ? ' (Você)' : '')}
                score={player.pontuacao}
                isHost={player.is_host}
                isCurrentPlayer={player.player_id === state.playerId}
                position={index + 1}
                index={index}
              />
            ))
          )}
        </div>

        {/* Rodapé */}
        <div className="mt-auto pt-4">
          <p className="text-sm text-muted-foreground text-center mb-2">
            Próxima pergunta em <span className="font-mono tabular-nums font-bold text-foreground">{countdown}</span>...
          </p>
          
          {/* Barra de Progresso Linear */}
          <div className="h-1 w-full bg-surface-2 rounded-full overflow-hidden">
            <div className="h-full bg-primary animate-shrink" />
          </div>

        </div>
      </div>
    </div>
  );
};

export default RankingPage;


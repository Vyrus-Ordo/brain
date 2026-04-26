import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import PlayerListItem from '../components/brain/PlayerListItem';
import PrimaryButton from '../components/brain/PrimaryButton';
import SecondaryButton from '../components/brain/SecondaryButton';

// Mock data for testing tie logic and podium
const MOCK_FINAL_RANKING = [
  { id: '3', name: 'Jessica', score: 850, isHost: false, isCurrentPlayer: false },
  { id: '1', name: 'Eduardo (Você)', score: 850, isHost: true, isCurrentPlayer: true },
  { id: '2', name: 'Marcos', score: 680, isHost: false, isCurrentPlayer: false },
  { id: '4', name: 'Felipe', score: 540, isHost: false, isCurrentPlayer: false },
];

import { useRanking } from '../hooks/useRanking';

const FinalRankingPage: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  
  const { ranking, loading } = useRanking(roomCode || null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setShowConfetti(true);
  }, []);

  const handlePlayAgain = () => {
    // Reset game state but keep player info
    dispatch({ type: 'JOIN_ROOM', payload: { roomCode: '', isHost: false } }); // Clear room
    navigate('/inicio');
  };

  const handleExit = () => {
    dispatch({ type: 'RESET' });
    navigate('/');
  };

  // Sorting just in case (hook already returns sorted but safety first)
  const sortedPlayers = [...ranking].sort((a, b) => b.pontuacao - a.pontuacao);
  
  const maxScore = sortedPlayers[0]?.pontuacao || 0;
  const winners = sortedPlayers.filter(p => p.pontuacao === maxScore);
  const isTie = winners.length > 1;

  const top3 = sortedPlayers.slice(0, 3);

  // Layout logic for podium
  const second = top3[1];
  const first = top3[0];
  const third = top3[2];

  return (
    <div className="min-h-screen bg-background flex flex-col animate-fade-in relative overflow-hidden">
      {/* Confetti Overlay */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-0">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-bounce-soft"
              style={{
                backgroundColor: i % 3 === 0 ? 'var(--primary)' : i % 3 === 1 ? 'var(--correct)' : 'var(--gold)',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                opacity: 0.7
              }}
            />
          ))}
        </div>
      )}

      <div className="max-w-md mx-auto px-4 py-8 flex flex-col flex-grow w-full relative z-10">
        <h1 className="text-4xl font-display font-bold text-foreground text-center mb-12 animate-slide-up">
          Fim de jogo!
        </h1>

        {/* Pódio */}
        <div className="flex items-end justify-center gap-3 mb-12 animate-slide-up" style={{ animationDelay: '200ms' }}>
          {/* 2º Lugar */}
          {second && (
            <div className="flex flex-col items-center flex-1">
              <div className="mb-2 text-center">
                <p className={`text-xs font-semibold truncate w-20 ${second.pontuacao === maxScore ? 'text-gold' : 'text-foreground'}`}>
                  {second.pontuacao === maxScore && '👑 '}{second.apelido}
                </p>
                <p className={`font-mono text-sm font-bold ${second.pontuacao === maxScore ? 'text-gold' : 'text-silver'}`}>
                  {second.pontuacao}
                </p>
              </div>
              <div className="w-full bg-surface rounded-t-[14px] h-20 flex items-center justify-center border-t border-x border-border shadow-sm">
                <span className={`font-display font-bold text-2xl ${second.pontuacao === maxScore ? 'text-gold' : 'text-silver'}`}>
                  {second.pontuacao === maxScore ? '1' : '2'}
                </span>
              </div>
            </div>
          )}

          {/* 1º Lugar */}
          {first && (
            <div className="flex flex-col items-center flex-1">
              <div className="mb-2 text-center">
                <div className="text-2xl animate-bounce-soft mb-1">👑</div>
                <p className="text-sm font-bold text-gold truncate w-24">{first.apelido}</p>
                <p className="font-mono text-base font-bold text-gold">{first.pontuacao}</p>
              </div>
              <div 
                className="w-full bg-surface rounded-t-[14px] h-32 flex items-center justify-center border-t border-x border-border relative"
                style={{ boxShadow: '0 0 60px -10px var(--gold)' }}
              >
                <span className="font-display font-bold text-gold text-4xl">1</span>
              </div>
            </div>
          )}

          {/* 3º Lugar */}
          {third && (
            <div className="flex flex-col items-center flex-1">
              <div className="mb-2 text-center">
                <p className={`text-xs font-semibold truncate w-20 ${third.pontuacao === maxScore ? 'text-gold' : 'text-foreground'}`}>
                   {third.pontuacao === maxScore && '👑 '}{third.apelido}
                </p>
                <p className={`font-mono text-sm font-bold ${third.pontuacao === maxScore ? 'text-gold' : 'text-bronze'}`}>
                  {third.pontuacao}
                </p>
              </div>
              <div className="w-full bg-surface rounded-t-[14px] h-14 flex items-center justify-center border-t border-x border-border shadow-sm">
                <span className={`font-display font-bold text-xl ${third.pontuacao === maxScore ? 'text-gold' : 'text-bronze'}`}>
                  {third.pontuacao === maxScore ? '1' : '3'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Lista completa para visibilidade de todos */}
        <div className="flex flex-col gap-3 mb-8 animate-fade-in" style={{ animationDelay: '400ms' }}>
          {loading ? (
             <div className="animate-shimmer bg-surface-2 h-20 rounded-[14px]" />
          ) : (
            sortedPlayers.map((player, index) => (
              <PlayerListItem
                key={player.id}
                name={player.apelido + (player.player_id === state.playerId ? ' (Você)' : '')}
                score={player.pontuacao}
                isHost={player.is_host}
                isCurrentPlayer={player.player_id === state.playerId}
                position={index + 1}
                index={index}
                isWinner={player.pontuacao === maxScore}
              />
            ))
          )}
        </div>

        {/* Rodapé */}
        <div className="mt-auto flex flex-col gap-3">
          <PrimaryButton label="Jogar novamente" onClick={handlePlayAgain} />
          <SecondaryButton label="Sair" onClick={handleExit} />
        </div>
      </div>
    </div>
  );
};

export default FinalRankingPage;


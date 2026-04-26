import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import FeedbackIcon from '../components/brain/FeedbackIcon';

interface LocationState {
  result: 'correct' | 'wrong' | 'timeout';
}

import { useRoomPresence } from '../hooks/useRoomPresence';
import { useGame } from '../contexts/GameContext';

const ResultPage: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { state: gameState } = useGame();
  const pageState = location.state as LocationState || { result: 'timeout' };
  
  const [countdown, setCountdown] = useState(4);
  const { players } = useRoomPresence(roomCode || null);

  const currentPlayer = players.find(p => p.player_id === gameState.playerId);
  const finalScore = currentPlayer?.pontuacao || 0;
  const pointsVariation = pageState.result === 'correct' ? 1 : pageState.result === 'timeout' ? -1 : 0;

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      navigate(`/ranking/${roomCode}`);
    }
  }, [countdown, navigate, roomCode]);

  // Background overlay class
  const bgOverlay = pageState.result === 'correct' ? 'bg-correct/5' : pageState.result === 'wrong' ? 'bg-wrong/5' : '';

  return (
    <div className={`min-h-screen bg-background ${bgOverlay} flex flex-col items-center justify-center animate-fade-in`}>
      <div className="max-w-md mx-auto px-4 flex flex-col items-center justify-center gap-6 text-center">
        {/* Feedback Icon with Glow (Glow is handled inside the component) */}
        <FeedbackIcon type={pageState.result} />

        {/* Texto Principal */}
        <div className="animate-fade-in" style={{ animationDelay: '150ms' }}>
          <h1 className={`text-2xl font-display font-bold ${
            pageState.result === 'correct' ? 'text-correct' : 
            pageState.result === 'wrong' ? 'text-wrong' : 
            'text-muted-foreground'
          }`}>
            {pageState.result === 'correct' ? 'Correto!' : 
             pageState.result === 'wrong' ? 'Errado' : 
             'Tempo esgotado'}
          </h1>
        </div>

        {/* Variação de Pontos */}
        <div className="animate-fade-in" style={{ animationDelay: '250ms' }}>
          <p className={`font-mono text-lg tabular-nums ${
            pointsVariation > 0 ? 'text-correct' : 
            pointsVariation < 0 ? 'text-wrong' : 
            'text-muted-foreground'
          }`}>
            {pointsVariation > 0 ? `+${pointsVariation} ponto` : 
             pointsVariation < 0 ? `${pointsVariation} ponto` : 
             'sem alteração'}
          </p>
        </div>

        {/* Pontuação Atual */}
        <div className="animate-fade-in" style={{ animationDelay: '350ms' }}>
          <p className="text-base text-muted-foreground font-sans">
            Sua pontuação: <span className="font-mono tabular-nums font-bold text-foreground">{finalScore}</span>
          </p>
        </div>

        {/* Contador Regressivo */}
        <div className="animate-fade-in" style={{ animationDelay: '450ms' }}>
          <div className="h-10 w-10 bg-surface-2 rounded-full flex items-center justify-center">
            <span className="font-mono text-sm text-muted-foreground tabular-nums">
              {countdown}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;

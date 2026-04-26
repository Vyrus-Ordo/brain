import React from 'react';
import { useParams } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import BrainLogo from '../components/brain/BrainLogo';
import CodeDisplay from '../components/brain/CodeDisplay';
import PlayerListItem from '../components/brain/PlayerListItem';
import PrimaryButton from '../components/brain/PrimaryButton';

import { useRoomPresence } from '../hooks/useRoomPresence';
import { useGameSync } from '../hooks/useGameSync';
import { useStartGame } from '../hooks/useStartGame';

const LobbyPage: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  // const navigate = useNavigate();
  const { state } = useGame();
  
  const { players, loading: playersLoading } = useRoomPresence(roomCode || null);
  const { room } = useGameSync(roomCode || null);
  const { startGame, loading: startingGame } = useStartGame();

  const handleStartGame = async () => {
    if (roomCode) {
      await startGame(roomCode);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col animate-fade-in">
      <div className="max-w-md mx-auto px-4 py-8 flex flex-col flex-grow w-full">
        {/* Topo */}
        <div className="flex items-center justify-between mb-6">
          <BrainLogo size="sm" />
          <div className="flex gap-2 flex-wrap justify-end">
            <span className="bg-surface-2 rounded-md px-2 py-1 text-xs text-muted-foreground capitalize">
              {room?.tema || '...'}
            </span>
            <span className="bg-surface-2 rounded-md px-2 py-1 text-xs text-muted-foreground">
              {room?.total_perguntas || '...'}p
            </span>
            <span className="bg-surface-2 rounded-md px-2 py-1 text-xs text-muted-foreground">
              {room?.timer_segundos || '...'}s
            </span>
          </div>
        </div>

        {/* CodeDisplay */}
        <div className="mb-6">
          <CodeDisplay code={roomCode || 'ERROR'} />
        </div>

        {/* Lista de jogadores */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-semibold text-foreground text-glow-none">Jogadores</h2>
          <span className="text-xs text-muted-foreground tabular-nums">
            {players.length} / 8
          </span>
        </div>

        <div className="flex flex-col gap-3 flex-grow">
          {playersLoading ? (
            <div className="animate-shimmer bg-surface-2 h-20 rounded-[14px]" />
          ) : (
            players.map((player, index) => (
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

        {/* Rodapé fixo */}
        <div className="mt-auto pt-6">
          {state.isHost ? (
            <PrimaryButton
              label={startingGame ? "Iniciando..." : "Iniciar partida"}
              onClick={handleStartGame}
              disabled={startingGame}
            />
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-2">Aguardando o host iniciar...</p>
              <div className="flex justify-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: '200ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: '400ms' }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LobbyPage;

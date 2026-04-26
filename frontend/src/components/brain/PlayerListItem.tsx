import React from 'react';

interface PlayerListItemProps {
  position: number;
  name: string;
  score: number;
  isCurrentPlayer?: boolean;
  isHost?: boolean;
  isWinner?: boolean;
  index: number;
}

const PlayerListItem: React.FC<PlayerListItemProps> = ({
  position,
  name,
  score,
  isCurrentPlayer,
  isHost,
  isWinner,
  index,
}) => {
  const getPositionColor = () => {
    if (position === 1) return 'text-gold';
    if (position === 2) return 'text-silver';
    if (position === 3) return 'text-bronze';
    return 'text-muted-foreground';
  };

  return (
    <div
      className={`
        flex items-center justify-between p-4 rounded-[14px] bg-surface
        ${isCurrentPlayer ? 'border-2 border-primary bg-primary/5' : 'border-2 border-transparent'}
        animate-slide-up
      `}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-center gap-4">
        <span className={`font-display font-bold text-xl w-6 ${getPositionColor()}`}>
          {position}
        </span>
        
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {isWinner && <span>👑</span>}
            <span className="font-sans font-semibold text-foreground">
              {name}
            </span>
            {isCurrentPlayer && (
              <div className="h-2.5 w-2.5 bg-correct rounded-full animate-pulse-dot" />
            )}
          </div>
          
          {isHost && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/15 px-2 py-0.5 rounded-md w-fit">
              Host
            </span>
          )}
        </div>
      </div>

      <div className="text-right">
        <span className="font-mono font-bold text-primary text-xl tabular-nums">
          {score.toLocaleString()}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground block">
          Pontos
        </span>
      </div>
    </div>
  );
};

export default PlayerListItem;

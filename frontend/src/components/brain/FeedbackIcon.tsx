import React from 'react';

interface FeedbackIconProps {
  type: 'correct' | 'wrong' | 'timeout';
}

const FeedbackIcon: React.FC<FeedbackIconProps> = ({ type }) => {
  const configs = {
    correct: {
      icon: '✓',
      color: 'var(--correct)',
      textColor: 'text-correct',
      bgColor: 'rgba(0, 230, 118, 0.18)', // Fallback for color-mix or literal
    },
    wrong: {
      icon: '✗',
      color: 'var(--wrong)',
      textColor: 'text-wrong',
      bgColor: 'rgba(255, 79, 79, 0.18)',
    },
    timeout: {
      icon: '⏱',
      color: 'var(--muted-foreground)',
      textColor: 'text-muted-foreground',
      bgColor: 'rgba(107, 122, 153, 0.18)',
    },
  };

  const config = configs[type];

  return (
    <div
      className={`
        relative w-24 h-24 rounded-full flex items-center justify-center
        text-4xl font-bold animate-pop ${config.textColor}
      `}
      style={{
        backgroundColor: `color-mix(in oklab, ${config.color} 18%, transparent)`,
        boxShadow: `0 0 60px -10px ${config.color}`,
      }}
    >
      {config.icon}
    </div>
  );
};

export default FeedbackIcon;

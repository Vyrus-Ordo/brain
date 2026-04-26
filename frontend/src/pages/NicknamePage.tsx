import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import BrainLogo from '../components/brain/BrainLogo';
import PrimaryButton from '../components/brain/PrimaryButton';

const NicknamePage: React.FC = () => {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const { dispatch } = useGame();
  const navigate = useNavigate();

  const handleEnter = () => {
    const trimmed = nickname.trim();
    if (trimmed.length < 2 || trimmed.length > 16) {
      setError('Apelido deve ter entre 2 e 16 caracteres.');
      return;
    }

    dispatch({ type: 'SET_PLAYER_NAME', payload: trimmed });
    navigate('/inicio');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNickname(e.target.value);
    if (error) setError('');
  };

  const isInvalid = nickname.trim().length < 2 || nickname.trim().length > 16;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in" style={{ animationDuration: '400ms' }}>
        <div className="flex justify-center mb-2 transform scale-90 animate-fade-in" style={{ animationDuration: '400ms' }}>
          <BrainLogo size="lg" />
        </div>
        
        <p className="text-base text-muted-foreground text-center mb-8">
          Quiz em tempo real com seus amigos
        </p>

        <div 
          className="bg-surface rounded-[18px] p-5 shadow-lg animate-slide-up" 
          style={{ animationDelay: '150ms', animationFillMode: 'both' }}
        >
          <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
            Como quer ser chamado?
          </label>
          
          <div className="mb-4">
            <input
              type="text"
              value={nickname}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === 'Enter' && !isInvalid && handleEnter()}
              placeholder="Seu apelido"
              className={`w-full bg-surface-2 h-14 rounded-[14px] px-4 text-foreground font-sans outline-none focus:ring-1 focus:ring-primary transition-all ${
                error ? 'border border-wrong' : ''
              }`}
              autoFocus
            />
            {error && (
              <p className="text-wrong text-sm mt-2 animate-fade-in">
                {error}
              </p>
            )}
          </div>

          <PrimaryButton 
            label="Entrar" 
            onClick={handleEnter} 
            disabled={isInvalid}
          />
        </div>
      </div>
    </div>
  );
};

export default NicknamePage;

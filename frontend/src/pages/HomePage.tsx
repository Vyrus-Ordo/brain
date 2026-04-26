import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import BrainLogo from '../components/brain/BrainLogo';
import PrimaryButton from '../components/brain/PrimaryButton';
import SecondaryButton from '../components/brain/SecondaryButton';
import { useJoinRoom } from '../hooks/useJoinRoom';

const HomePage: React.FC = () => {
  const { state } = useGame();
  const navigate = useNavigate();
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  // const [error, setError] = useState('');
  const { joinRoom, loading: isLoading, error: joinError } = useJoinRoom();

  const handleCreateRoom = () => {
    navigate('/criar');
  };

  const handleJoinRoom = async () => {
    if (roomCode.length < 6) return;
    await joinRoom(roomCode);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase();
    if (value.length <= 6) {
      setRoomCode(value);
    }
  };

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="max-w-md mx-auto px-4 py-8 flex flex-col items-center">
        <div className="mb-8">
          <BrainLogo size="md" />
        </div>

        <h1 className="text-2xl font-display font-bold text-foreground mb-8 w-full">
          Olá, {state.playerName}!
        </h1>

        <div className="flex flex-col gap-3 w-full">
          <PrimaryButton 
            label="Criar sala" 
            onClick={handleCreateRoom} 
          />
          
          {!showJoinInput ? (
            <SecondaryButton 
              label="Entrar com código" 
              onClick={() => setShowJoinInput(true)} 
            />
          ) : (
            <div className="flex flex-col gap-3 animate-slide-up" style={{ animationDuration: '300ms' }}>
              <div className="relative">
                <input
                  type="text"
                  value={roomCode}
                  onChange={handleCodeChange}
                  placeholder="------"
                  maxLength={6}
                  className="w-full bg-surface-2 h-14 rounded-[14px] px-4 text-center font-mono text-primary text-2xl tracking-[0.3rem] uppercase outline-none focus:ring-1 focus:ring-primary transition-all"
                  autoFocus
                />
                {joinError && (
                  <p className="text-wrong text-sm mt-2 animate-fade-in text-center">
                    {joinError}
                  </p>
                )}
              </div>
              
              <PrimaryButton 
                label={isLoading ? "Entrando..." : "Entrar"} 
                onClick={handleJoinRoom}
                disabled={roomCode.length < 6 || isLoading}
              />
              
              <button 
                onClick={() => setShowJoinInput(false)}
                className="text-muted-foreground text-xs uppercase tracking-widest hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;

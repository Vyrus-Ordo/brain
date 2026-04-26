import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import PrimaryButton from '../components/brain/PrimaryButton';
import SegmentedControl from '../components/brain/SegmentedControl';
import { useCreateRoom } from '../hooks/useCreateRoom';

const THEMES = [
  { id: 'historia', label: 'História', emoji: '🏛️' },
  { id: 'esportes', label: 'Esportes', emoji: '⚽' },
  { id: 'tecnologia', label: 'Tecnologia', emoji: '💻' },
  { id: 'filmes', label: 'Filmes', emoji: '🎬' },
  { id: 'geral', label: 'Conhecimentos Gerais', emoji: '🌍' },
];

const QUESTIONS_OPTIONS = ["5", "10", "15", "20"];
const TIME_OPTIONS = ["5s", "15s", "30s"];

const CreateRoomPage: React.FC = () => {
  const { dispatch } = useGame();
  const navigate = useNavigate();
  
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [numQuestions, setNumQuestions] = useState("10");
  const [timePerQuestion, setTimePerQuestion] = useState("15s");
  const { createRoom, loading: isLoading, error } = useCreateRoom();

  const handleCreate = async () => {
    if (!selectedTheme) return;

    await createRoom({
      theme: selectedTheme,
      totalQuestions: parseInt(numQuestions),
      timerSeconds: parseInt(timePerQuestion)
    });
  };

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={() => navigate('/inicio')}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Configurar sala
          </h1>
          <div className="w-8" /> {/* Spacer to center title */}
        </div>

        {/* Theme Selection */}
        <div className="mb-6 animate-slide-up" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
          <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-3">
            Escolha o tema
          </label>
          <div className="grid grid-cols-2 gap-2">
            {THEMES.map((theme, index) => (
              <div
                key={theme.id}
                onClick={() => setSelectedTheme(theme.id)}
                className={`
                  bg-surface rounded-[14px] p-4 flex flex-col items-center gap-2 cursor-pointer transition-all duration-150 hover:brightness-110 border-2
                  ${selectedTheme === theme.id ? 'border-primary bg-primary/5' : 'border-transparent'}
                  ${index === THEMES.length - 1 && index % 2 === 0 ? 'col-span-2' : ''}
                `}
              >
                <span className="text-2xl">{theme.emoji}</span>
                <span className={`text-sm font-sans ${selectedTheme === theme.id ? 'text-primary' : 'text-foreground'}`}>
                  {theme.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Questions Selection */}
        <div className="mb-6 animate-slide-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
          <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-3">
            Perguntas
          </label>
          <SegmentedControl 
            options={QUESTIONS_OPTIONS.map(opt => ({ label: opt, value: opt }))}
            value={numQuestions}
            onChange={setNumQuestions}
          />
        </div>

        {/* Time Selection */}
        <div className="mb-8 animate-slide-up" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
          <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-3">
            Tempo por pergunta
          </label>
          <SegmentedControl 
            options={TIME_OPTIONS.map(opt => ({ label: opt, value: opt }))}
            value={timePerQuestion}
            onChange={setTimePerQuestion}
          />
        </div>

        {/* Footer */}
        <div className="mt-8">
          {error && (
            <p className="text-wrong text-sm mt-2 text-center animate-fade-in mb-4">
              {error}
            </p>
          )}
          <PrimaryButton 
            label={isLoading ? "Criando..." : "Criar sala"} 
            onClick={handleCreate}
            disabled={!selectedTheme || isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateRoomPage;

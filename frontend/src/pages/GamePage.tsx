import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { useQuestions } from '../hooks/useQuestions';
import { useSubmitAnswer } from '../hooks/useSubmitAnswer';
import { useGameSync } from '../hooks/useGameSync';
import { useRoomPresence } from '../hooks/useRoomPresence';
import { api } from '../lib/api';
import TimerBar from '../components/brain/TimerBar';

type AnswerState = 'normal' | 'selected' | 'correct' | 'wrong' | 'neutral';

const GamePage: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  // DEBUG: Log de montagem da página
  useEffect(() => {
    // ...removido debug...
  }, [roomCode]);
  const navigate = useNavigate();
  const { state } = useGame();

  const { room, channel: roomChannel } = useGameSync(roomCode || null);
  const { players } = useRoomPresence(roomCode || null);
  const { questions, loading: loadingQuestions } = useQuestions(room?.tema || null, room?.total_perguntas || 10);
  const { submitAnswer } = useSubmitAnswer();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);

  const currentQuestion = questions[state.currentRound - 1];

  // Usar refs para ter acesso aos valores mais recentes dentro de callbacks estáveis
  const showFeedbackRef = useRef(showFeedback);
  const selectedIdRef = useRef(selectedId);
  const currentQuestionRef = useRef(currentQuestion);

  useEffect(() => { showFeedbackRef.current = showFeedback; }, [showFeedback]);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);
  useEffect(() => { currentQuestionRef.current = currentQuestion; }, [currentQuestion]);

  // ─── revealAnswer DEVE ser definida ANTES dos useEffects que a usam ───

  // O índice correto será recebido via evento/broadcast do backend
  const revealAnswer = useCallback((correctIdx: number | null) => {
    if (showFeedbackRef.current) return;
    setShowFeedback(true);
    setIsLocked(true);
    setCorrectIndex(correctIdx);

    setTimeout(() => {
      const currentSelected = selectedIdRef.current;
      let result: string;
      if (currentSelected === correctIdx) {
        result = 'correct';
      } else if (currentSelected === null) {
        result = 'timeout';
      } else {
        result = 'wrong';
      }
      navigate(`/resultado/${roomCode}`, { state: { result } });
    }, 2000);
  }, [navigate, roomCode]);


  // ─── Listener do broadcast "todos_responderam" ───

  // Listener para evento que traz o índice correto da resposta
  useEffect(() => {
    const handleRoundEnded = (event: any) => {
      // ...removido debug...
      // Espera que o backend/host envie { correctIndex: number }
      const correctIdx = event?.detail?.correctIndex;
      revealAnswer(typeof correctIdx === 'number' ? correctIdx : null);
    };
    window.addEventListener('brain:todos_responderam', handleRoundEnded);
    return () => window.removeEventListener('brain:todos_responderam', handleRoundEnded);
  }, [revealAnswer]);

  // ─── Listener do broadcast "proxima_pergunta" para avançar rodada ───
  const { dispatch } = useGame();
  useEffect(() => {
    const handleProximaPergunta = (event: any) => {
      // ...removido debug...
      // O payload pode conter o número da próxima rodada
      const nextRound = event?.detail?.currentRound;
      if (typeof nextRound === 'number') {
        dispatch({ type: 'SET_ROUND', payload: nextRound });
      } else {
        // fallback: incrementa
        dispatch({ type: 'SET_ROUND', payload: state.currentRound + 1 });
      }
      setSelectedId(null);
      setShowFeedback(false);
      setIsLocked(false);
      setCorrectIndex(null);
    };
    window.addEventListener('brain:proxima_pergunta', handleProximaPergunta);
    return () => window.removeEventListener('brain:proxima_pergunta', handleProximaPergunta);
  }, [dispatch, state.currentRound]);

  // ─── Lógica do Host: verificar se todos responderam ───
  useEffect(() => {
    if (!state.isHost || !room || !currentQuestion || showFeedback) {
      // ...removido debug...
      return;
    }

    let isMounted = true;
    // let channel: any = null;

    const checkAnswers = async () => {
      try {
        const { count } = await api.countRespostas(room.id, state.currentRound);

      if (isMounted && count >= players.length && players.length > 0) {
        const { indice_correto: correctIdx } = await api.getCorrectAnswer(currentQuestion.id);

        // Broadcast para todos os jogadores
        // ...removido debug...
        if (roomChannel) {
          roomChannel.send({
            type: 'broadcast',
            event: 'todos_responderam',
            payload: { correctIndex: correctIdx }
          });
        }
        revealAnswer(typeof correctIdx === 'number' ? correctIdx : null);
      }
      } catch (err) {
        console.error('[DEBUG] Error checking answers:', err);
      }
    };

    // Escutar novas respostas via broadcast (disparado pelo submitAnswer)
    const handleJogadorRespondeu = () => {
      checkAnswers();
    };

    window.addEventListener('brain:jogador_respondeu', handleJogadorRespondeu);

    // Verificação inicial (caso já tenha respondido antes)
    checkAnswers();

    return () => {
      isMounted = false;
      window.removeEventListener('brain:jogador_respondeu', handleJogadorRespondeu);
    };
  }, [state.isHost, room, currentQuestion, players.length, state.currentRound, showFeedback, roomChannel, revealAnswer]);

  const handleSelect = async (index: number) => {
    if (isLocked || !currentQuestion || !room) return;

    setSelectedId(index);
    setIsLocked(true);

    await submitAnswer(room.id, currentQuestion.id, state.currentRound, index);
    if (roomChannel) {
      roomChannel.send({
        type: 'broadcast',
        event: 'jogador_respondeu',
        payload: { playerId: state.playerId }
      });
    }
  };

  const handleExpire = async () => {
    if (showFeedback || isLocked || !currentQuestion || !room) {
      // ...removido debug...
      return;
    }
    // ...removido debug...
    setIsLocked(true);
    await submitAnswer(room.id, currentQuestion.id, state.currentRound, null);
    if (roomChannel) {
      roomChannel.send({
        type: 'broadcast',
        event: 'jogador_respondeu',
        payload: { playerId: state.playerId }
      });
    }
  };

  const getOptionState = (index: number): AnswerState => {
    if (!showFeedback) {
      if (selectedId === index) return 'selected';
      return 'normal';
    }
    if (index === correctIndex) return 'correct';
    if (selectedId === index && index !== correctIndex) return 'wrong';
    return 'neutral';
  };

  if (loadingQuestions) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-shimmer w-full max-w-md h-64 rounded-[18px] bg-surface-2 mx-4" />
      </div>
    );
  }

  // Se as perguntas carregaram, mas não há pergunta para a rodada atual
  if (!currentQuestion) {
    // Evita loop, avança para a próxima fase se não houver mais perguntas disponíveis
    if (state.isHost && room?.estado !== 'finalizada' && room?.id) {
      api.updateEstado(room.id, 'finalizada').catch(console.error);
    }
    // Redireciona para o ranking final após um curto delay para garantir atualização
    setTimeout(() => navigate(`/final/${roomCode}`), 0);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Finalizando jogo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col animate-fade-in">
      <div className="max-w-md mx-auto px-4 py-6 flex flex-col flex-grow w-full">
        {/* Topo */}
        <div className="mb-3">
          <label className="text-xs uppercase tracking-widest text-muted-foreground tabular-nums">
            PERGUNTA {state.currentRound} DE {room?.total_perguntas || 10}
          </label>
        </div>

        <div className="mb-6">
          <TimerBar
            key={currentQuestion?.id || state.currentRound}
            duration={room?.timer_segundos || 15}
            onExpire={handleExpire}
          />
        </div>

        {/* Card da Pergunta */}
        <div className="bg-surface rounded-[18px] p-6 mb-6 flex-grow flex items-center justify-center animate-fade-in">
          <p className="text-xl font-sans text-foreground leading-relaxed text-center">
            {currentQuestion.texto}
          </p>
        </div>

        {/* Área de Respostas */}
        <div className="flex flex-col gap-2 mb-4">
          {currentQuestion.opcoes.map((option, index) => {
            const optionState = getOptionState(index);

            let classes =
              'h-14 w-full rounded-[14px] font-sans font-medium px-4 flex items-center justify-between transition-all duration-200 ';

            if (isLocked) classes += 'pointer-events-none ';

            switch (optionState) {
              case 'selected':
                classes += 'bg-primary text-primary-foreground scale-[1.02] shadow-cta';
                break;
              case 'correct':
                classes += 'bg-correct text-primary-foreground animate-pop';
                break;
              case 'wrong':
                classes += 'bg-wrong text-foreground animate-pop';
                break;
              case 'neutral':
                classes += 'bg-surface-2 text-muted-foreground opacity-50';
                break;
              default:
                classes += 'bg-surface-2 text-foreground hover:brightness-110';
            }

            // Caso especial: resposta correta que não foi selecionada
            if (showFeedback && index === correctIndex && selectedId !== index) {
              classes =
                'h-14 w-full rounded-[14px] font-sans font-medium px-4 flex items-center justify-between transition-all duration-200 pointer-events-none bg-correct/20 text-correct border border-correct animate-pop';
            }

            return (
              <button
                key={index}
                onClick={() => handleSelect(index)}
                className={`${classes} animate-slide-up`}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <span>{option}</span>
                {optionState === 'correct' && (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {optionState === 'wrong' && (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                )}
                {showFeedback && index === correctIndex && selectedId !== index && (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        {/* Mensagem Pós-Resposta */}
        {isLocked && (
          <div className="animate-fade-in flex flex-col items-center">
            <p className="text-sm text-muted-foreground text-center mb-2">
              {showFeedback ? 'Carregando resultado...' : 'Aguardando os outros...'}
            </p>
            {!showFeedback && (
              <div className="flex justify-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: '200ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: '400ms' }} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GamePage;

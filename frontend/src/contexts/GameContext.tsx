import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

interface GameState {
  playerId: string | null;
  playerName: string | null;
  roomCode: string | null;
  isHost: boolean;
  currentRound: number;
}

type GameAction =
  | { type: 'SET_PLAYER_NAME'; payload: string }
  | { type: 'JOIN_ROOM'; payload: { roomCode: string; isHost: boolean } }
  | { type: 'SET_ROUND'; payload: number }
  | { type: 'RESET' };

const initialState: GameState = {
  playerId: null,
  playerName: null,
  roomCode: null,
  isHost: false,
  currentRound: 1,
};

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'SET_PLAYER_NAME': {
      const existingId = localStorage.getItem('brain_playerId');
      const playerId = existingId || crypto.randomUUID();
      if (!existingId) localStorage.setItem('brain_playerId', playerId);
      localStorage.setItem('brain_playerName', action.payload);
      
      return {
        ...state,
        playerId,
        playerName: action.payload,
      };
    }
    case 'JOIN_ROOM':
      localStorage.setItem('brain_roomCode', action.payload.roomCode);
      localStorage.setItem('brain_isHost', action.payload.isHost ? 'true' : 'false');
      return {
        ...state,
        roomCode: action.payload.roomCode,
        isHost: action.payload.isHost,
      };
    case 'SET_ROUND':
      return {
        ...state,
        currentRound: action.payload,
      };
    case 'RESET':
      localStorage.removeItem('brain_playerName');
      localStorage.removeItem('brain_roomCode');
      localStorage.removeItem('brain_isHost');
      return {
        ...initialState,
        playerId: state.playerId, // Keep ID for session consistency if desired
      };
    default:
      return state;
  }
};

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Load from localStorage on mount
  useEffect(() => {
    const savedName = localStorage.getItem('brain_playerName');
    if (savedName) {
      dispatch({ type: 'SET_PLAYER_NAME', payload: savedName });
    }
    
    const savedRoomCode = localStorage.getItem('brain_roomCode');
    const savedIsHost = localStorage.getItem('brain_isHost') === 'true';
    if (savedRoomCode) {
      dispatch({ 
        type: 'JOIN_ROOM', 
        payload: { roomCode: savedRoomCode, isHost: savedIsHost } 
      });
    }
  }, []);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

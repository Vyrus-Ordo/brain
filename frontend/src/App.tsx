import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GameProvider, useGame } from './contexts/GameContext';
import NicknamePage from './pages/NicknamePage';
import HomePage from './pages/HomePage';
import CreateRoomPage from './pages/CreateRoomPage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import ResultPage from './pages/ResultPage';
import RankingPage from './pages/RankingPage';
import FinalRankingPage from './pages/FinalRankingPage';

// Route Guard
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { state } = useGame();
  const location = useLocation();

  if (!state.playerName) {
    // Redirect to nickname page if no name is set
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/" element={<NicknamePage />} />

      {/* Protected Routes */}
      <Route
        path="/inicio"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/criar"
        element={
          <ProtectedRoute>
            <CreateRoomPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lobby/:roomCode"
        element={
          <ProtectedRoute>
            <LobbyPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/jogo/:roomCode"
        element={
          <ProtectedRoute>
            <GamePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resultado/:roomCode"
        element={
          <ProtectedRoute>
            <ResultPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ranking/:roomCode"
        element={
          <ProtectedRoute>
            <RankingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/final/:roomCode"
        element={
          <ProtectedRoute>
            <FinalRankingPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
          <AppRoutes />
        </div>
      </BrowserRouter>
    </GameProvider>
  );
}

export default App;

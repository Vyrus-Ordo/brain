import React from 'react';

const PagePlaceholder: React.FC<{ name: string }> = ({ name }) => (
  <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
    <h1 className="text-2xl font-display font-bold mb-4">{name}</h1>
    <p className="text-muted-foreground">Em desenvolvimento...</p>
  </div>
);

export const NicknamePage = () => <PagePlaceholder name="Tela de Apelido (/)" />;
export const HomePage = () => <PagePlaceholder name="Tela de Início (/inicio)" />;
export const CreateRoomPage = () => <PagePlaceholder name="Configurar Sala (/criar)" />;
export const LobbyPage = () => <PagePlaceholder name="Lobby (/lobby)" />;
export const GamePage = () => <PagePlaceholder name="Jogo (/jogo)" />;
export const ResultPage = () => <PagePlaceholder name="Resultado (/resultado)" />;
export const RankingPage = () => <PagePlaceholder name="Ranking Parcial (/ranking)" />;
export const FinalRankingPage = () => <PagePlaceholder name="Ranking Final (/final)" />;

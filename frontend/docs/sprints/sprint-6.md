# Sprint 6: Integração Realtime

**Objetivo:** Substituir todos os dados estáticos por sincronização em tempo real via Supabase.

## 🛠 Atividades de Desenvolvimento (Prompts para IA)

### 1. Hooks de Integração

- Implementar hooks customizados conforme seção 7 da spec:
  - `useCreateRoom`, `useJoinRoom`.
  - `useRoomPresence` (Realtime Presence).
  - `useGameSync` (Escuta de eventos: nova_pergunta, todos_responderam, etc.).
  - `useSubmitAnswer`, `useRanking`.

### 2. Integração com Telas

- Substituir os mocks das Sprints 4 e 5 pelos hooks reais.
- Garantir que a transição entre telas (`Lobby -> Jogo -> Resultado -> Ranking`) seja disparada por eventos do Supabase Realtime, e não apenas temporizadores locais.

### 3. Polish Final

- Refinar estados de loading (`animate-shimmer`).
- Validar tratamento de erros de rede e desconexão.

## ✅ Critérios de Aceite (Definição de Pronto)

- [X] Um jogador pode criar uma sala e outros podem entrar usando o código.
- [X] A lista de jogadores no lobby atualiza instantaneamente para todos.
- [X] Quando o Host clica em "Iniciar", todos os jogadores navegam simultaneamente.
- [ ] Respostas são persistidas e o ranking é calculado corretamente pelo backend/hooks.

## 🧪 Testes Manuais Sugeridos (Crítico)

- Abrir 3 abas do navegador:
    1. Aba A: Host.
    2. Aba B: Player 1.
    3. Aba C: Player 2.
- Realizar um jogo completo e validar se todos terminam na mesma tela de pódio com os resultados corretos.

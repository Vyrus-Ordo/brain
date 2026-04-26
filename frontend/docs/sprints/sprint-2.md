# Sprint 2: Infraestrutura & Design System (Part 2)

**Objetivo:** Concluir a biblioteca de componentes e estabelecer a arquitetura de dados e navegação.

## 🛠 Atividades de Desenvolvimento (Prompts para IA)

### 1. Componentes Complexos

- Criar `src/components/brain/TimerBar.tsx` (uso de `requestAnimationFrame`, cores dinâmicas por tempo restante).
- Criar `src/components/brain/PlayerListItem.tsx` (states para host, player atual, vencedor, badges).
- Criar `src/components/brain/FeedbackIcon.tsx` (ícones animados de acerto/erro/timeout).
- Criar `src/components/brain/CodeDisplay.tsx` (estilo mono, botão de copiar com feedback visual).

### 2. Estado Global (GameContext)

- Implementar `GameContext` + `useReducer` em `src/contexts/GameContext.tsx`.
- Incluir persistência de `playerId` e `playerName` no `localStorage`.
- Definir ações básicas: `SET_PLAYER_NAME`, `JOIN_ROOM`, `RESET`.

### 3. Roteamento

- Configurar `react-router-dom` v6 em `src/App.tsx`.
- Implementar as 8 rotas especificadas.
- Adicionar Guards (ex: redirecionar para `/` se não houver `playerName`).

## ✅ Critérios de Aceite (Definição de Pronto)

- [X] TimerBar diminui de forma suave e troca de cor (azul -> amarelo -> vermelho).
- [X] PlayerListItem exibe o dot pulsante para jogadores online.
- [X] O Context mantém os dados mesmo após refresh da página (via localStorage).
- [X] Tentar acessar `/inicio` sem apelido redireciona para `/`.

## 🧪 Testes Manuais Sugeridos

- Validar se o botão de copiar no `CodeDisplay` realmente coloca o texto na área de transferência.
- Testar a mudança de cores do `TimerBar` ajustando a duração manualmente.

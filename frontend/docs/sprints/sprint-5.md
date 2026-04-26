# Sprint 5: Ranking & Persistência

**Objetivo:** Implementar o encerramento do jogo com impacto visual e preparar a conexão com o backend.

## 🛠 Atividades de Desenvolvimento (Prompts para IA)

### 1. Tela 7 — Ranking Parcial (`/ranking`)

- Lista de jogadores ordenada por score decrescente.
- Barra de progresso linear no rodapé indicando tempo para a próxima pergunta.
- Animação de stagger (`slide-up`) na lista.

### 2. Tela 8 — Ranking Final (`/final`)

- Implementar o Pódio (Top 3) com alturas variadas e badges de ouro/prata/bronze.
- Adicionar efeito de confete (`brain-confetti`) ao montar a tela.
- Implementar lógica de empate no 1º lugar (todos com cor gold e coroa 👑).

### 3. Supabase Client Setup

- Criar `src/lib/supabase.ts` e configurar o cliente.
- Configurar variáveis de ambiente `.env` (URL e Anon Key).

## ✅ Critérios de Aceite (Definição de Pronto)

- [x] O pódio da tela final é visualmente impactante e respeita o design system.
- [x] O botão "Jogar novamente" reinicia o estado global e volta para `/inicio`.
- [x] A tela de ranking parcial ordena os jogadores corretamente.
- [x] Projeto configurado para ler variáveis de ambiente sem expor chaves no código.

## 🧪 Testes Manuais Sugeridos

- Forçar um empate no 1º lugar via mock para validar o layout do pódio.
- Validar se o confete não causa queda de performance (lag) em mobile.

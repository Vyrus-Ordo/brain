# Sprint 4: Loop de Jogo (Mocked)

**Objetivo:** Construir a experiência core do jogo (espera, pergunta e feedback) usando dados estáticos (mocks) para garantir perfeição na UI.

## 🛠 Atividades de Desenvolvimento (Prompts para IA)

### 1. Tela 4 — Lobby (`/lobby`)

- Exibir `CodeDisplay` e lista de jogadores.
- Implementar estados diferenciais para Host (botão iniciar) e Player (mensagem de espera).
- Usar mock de array de jogadores para testar o scroll e layout.

### 2. Tela 5 — Pergunta (`/jogo`)

- Implementar a tela mais crítica do app.
- Gerenciar estados dos botões de resposta: Normal, Selecionado, Correto, Errado, Neutro.
- Integrar `TimerBar` e disparar timeout se o tempo acabar.
- Bloquear interações após a resposta ser enviada.

### 3. Tela 6 — Resultado da Rodada (`/resultado`)

- Exibir `FeedbackIcon` grande com glow contextual (verde/vermelho).
- Mostrar variação de pontos e pontuação atual.
- Implementar timer regressivo de 4 segundos para navegação automática.

## ✅ Critérios de Aceite (Definição de Pronto)

- [X] A tela de pergunta exibe o gabarito (certo/errado) após a seleção.
- [X] Botões de resposta ficam com `pointer-events-none` após o clique.
- [X] A tela de resultado tem animações de `pop` e `fade-in` sincronizadas.
- [X] Transição automática da Tela 6 para a próxima fase.

## 🧪 Testes Manuais Sugeridos

- Validar se o botão "Iniciar" só habilita com 3+ jogadores (simular mudando o mock).
- Testar a leitura da pergunta e alternativas em telas pequenas (iPhone SE).

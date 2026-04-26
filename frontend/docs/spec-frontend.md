# 📋 SPEC FRONTEND — Brain (Quiz Multiplayer)

### Versão 2.1 | Alinhada ao Brain Design System

> **Fonte da verdade visual:** `src/styles.css` + `src/components/brain/`
> Nenhum componente desta spec usa cor literal, hex ou rgb. Toda cor é token semântico.

---

## 1. Visão Geral do Projeto

**Nome:** Brain
**Tipo:** Web App — Mobile First (responsivo)
**Stack:** React + Vite + Tailwind CSS + Supabase (client SDK)
**Hospedagem:** Vercel
**Autenticação:** Sem login — apelido temporário por sessão

O Brain é um jogo de quiz multiplayer síncrono. Jogadores entram por código de sala de 6 letras, respondem perguntas simultâneas com timer e competem por pontuação em tempo real.

---

## 2. Design System — Referência Rápida

> Documento completo esta na rai do projeto em `brain-design-system.md`. Esta seção é um resumo operacional para uso nos prompts de IA.

### Tokens de cor (usar sempre via classe Tailwind ou var())

| Token semântico     | Classe Tailwind           | Uso                                      |
|---------------------|---------------------------|------------------------------------------|
| Background          | `bg-background`           | Fundo global                             |
| Surface             | `bg-surface`              | Cards, listas                            |
| Surface 2           | `bg-surface-2`            | Inputs, botões neutros, segmentos        |
| Foreground          | `text-foreground`         | Texto principal                          |
| Muted Foreground    | `text-muted-foreground`   | Labels, textos secundários               |
| Border              | `border-border`           | Divisores                                |
| Primary             | `bg-primary` / `text-primary` | CTA, logo, foco, código da sala      |
| Primary Foreground  | `text-primary-foreground` | Texto sobre fundo primary                |
| Correct             | `text-correct` / `bg-correct` | Acerto, dot online                   |
| Wrong               | `text-wrong` / `bg-wrong` | Erro                                     |
| Warning             | `text-warning`            | Timer expirando (25–50%)                 |
| Gold/Silver/Bronze  | `text-gold` / `text-silver` / `text-bronze` | Pódio              |

### Tipografia

| Uso                        | Classes Tailwind                                        |
|----------------------------|---------------------------------------------------------|
| Logo (home)                | `text-6xl font-display font-extrabold text-primary`     |
| Logo (interno)             | `text-4xl font-display font-bold text-primary`          |
| Título de tela             | `text-2xl font-display font-bold text-foreground`       |
| Texto de UI / botões       | `font-sans` (default)                                   |
| Código da sala             | `font-mono text-4xl font-bold tracking-[0.5rem] text-primary` |
| Timer / scores             | `font-mono text-2xl font-bold tabular-nums`             |
| Caption / label            | `text-xs uppercase tracking-widest text-muted-foreground` |

### Raios, espaçamento e sombras

| Elemento                  | Token / Classe                                          |
|---------------------------|---------------------------------------------------------|
| Botão primário/secundário | `rounded-[14px]`                                        |
| Card de jogador           | `rounded-[14px]`                                        |
| SegmentedControl          | `rounded-[10px]`                                        |
| CodeDisplay / modais      | `rounded-[18px]`                                        |
| Badge / pílula            | `rounded-md`                                            |
| Dot / avatar              | `rounded-full`                                          |
| Padding interno de card   | `p-4` ou `p-5`                                          |
| Gap em listas             | `gap-3`                                                 |
| Gap em botões de resposta | `gap-2`                                                 |
| Sombra CTA                | `box-shadow: 0 8px 30px -10px color-mix(in oklab, var(--color-primary) 60%, transparent)` |
| Sombra feedback           | `box-shadow: 0 0 60px -10px var(--color-correct)`       |
| Glow logo                 | `text-shadow: 0 0 30px color-mix(in oklab, var(--color-primary) 40%, transparent)` |

### Animações disponíveis

| Classe                 | Duração       | Uso                                     |
|------------------------|---------------|-----------------------------------------|
| `animate-fade-in`      | 300ms         | Entrada de telas e blocos               |
| `animate-slide-up`     | 400ms         | Itens de lista com stagger              |
| `animate-pop`          | 400ms         | FeedbackIcon, badges                    |
| `animate-pulse-dot`    | 1.4s loop     | Indicador online                        |
| `animate-shimmer`      | 1.6s loop     | Skeleton / carregando                   |
| `animate-bounce-soft`  | 1.4s loop     | Ênfase em CTAs ociosas                  |
| `brain-confetti`       | —             | Tela final (vitória)                    |

**Regra de stagger em listas:** `animationDelay = index * 80ms`

### Componentes disponíveis em `src/components/brain/`

| Componente         | Props principais                                        |
|--------------------|---------------------------------------------------------|
| `BrainLogo`        | `size: "sm" \| "md" \| "lg"`                            |
| `PrimaryButton`    | `label`, `onClick`, `disabled`                          |
| `SecondaryButton`  | `label`, `onClick`                                      |
| `SegmentedControl` | `options`, `selected`, `onChange`                       |
| `TimerBar`         | `duration`, `onExpire` — usa `requestAnimationFrame`    |
| `PlayerListItem`   | `position`, `name`, `score`, `isCurrentPlayer`, `isHost`, `isWinner` |
| `FeedbackIcon`     | `type: "correct" \| "wrong" \| "timeout"`               |
| `CodeDisplay`      | `code`                                                  |

---

## 3. Arquitetura de Telas

```
/            → Tela de Apelido
/inicio      → Tela de Início
/criar       → Tela de Configuração da Sala (host only)
/lobby       → Tela de Lobby
/jogo        → Tela de Pergunta
/resultado   → Tela de Resultado da Rodada
/ranking     → Tela de Ranking Parcial
/final       → Tela de Ranking Final
```

**Guard global:** qualquer rota sem `playerName` no contexto redireciona para `/`.
**Padrão de container:** `max-w-md mx-auto px-4 py-8` em todas as telas.

---

## ⚠️ Aviso Crítico — Ordem de Implementação

> **Leia antes de usar qualquer prompt desta spec.**

Os prompts de tela referenciam componentes de `src/components/brain/` como se já existissem no projeto. Isso é intencional — garante que a IA gere código que consome os componentes em vez de reinventá-los inline.

**Se você usar os prompts de tela antes de criar os componentes**, a IA vai improvisar implementações próprias para `BrainLogo`, `TimerBar`, `PlayerListItem` etc. diretamente dentro de cada tela. O resultado será código inconsistente, com estilos divergentes entre telas e sem aderência ao design system.

**A ordem correta é sempre:**

```
1. src/styles.css + tailwind.config  (tokens e fontes)
2. Componentes de src/components/brain/  (todos os 8)
3. Estado global (GameContext)
4. Roteamento
5. Telas (na ordem da seção 9)
6. Hooks Supabase
7. Integração Realtime
```

**Isso vale para qualquer ferramenta de IA** — Cursor, v0, Bolt, Claude Code, ChatGPT ou qualquer outra. A ferramenta não importa; a sequência importa.

Se precisar recomeçar ou refatorar uma tela isolada, inclua no prompt o trecho de spec do componente relevante (seção 5) para que a IA saiba exatamente como o componente se comporta.

---

## 4. Telas — Detalhamento e Prompts de IA

---

### TELA 1 — Apelido (`/`)

**Descrição:**
Primeira tela. Pede apenas um apelido temporário para jogar — sem cadastro, sem senha.

**Estrutura:**

```
bg-background (tela inteira)
  └─ container max-w-md mx-auto px-4
       ├─ BrainLogo size="lg" (centralizado, com glow)
       ├─ tagline: "Quiz em tempo real com seus amigos"
       │    text-base text-muted-foreground text-center mb-8
       └─ card bg-surface rounded-[18px] p-5
            ├─ label "Como quer ser chamado?"
            │    text-xs uppercase tracking-widest text-muted-foreground mb-2
            ├─ input
            │    bg-surface-2 rounded-[14px] h-14 px-4
            │    text-foreground font-sans
            │    placeholder text-muted-foreground
            │    focus: ring-1 ring-primary
            │    border-wrong + mensagem text-wrong text-sm se inválido
            └─ PrimaryButton label="Entrar" (desabilitado se input vazio)
```

**Validação:**

- Mínimo 2 caracteres, máximo 16
- Sem espaços no início ou fim
- Erro inline abaixo do input com `text-wrong text-sm`

**Comportamento:**

- Ao confirmar: salvar `playerName` e `playerId` (uuid gerado) no Context + localStorage
- Navegar para `/inicio`

**Animações:**

- `BrainLogo`: `animate-fade-in` com scale 0.9→1 em 400ms
- Card: `animate-slide-up` com delay 150ms

---

**📌 PROMPT DE IA — TELA 1:**

```
Crie a tela inicial do app Brain (quiz multiplayer mobile-first) seguindo rigorosamente o Brain Design System.

IMPORTANTE — regras absolutas do design system:
- Nunca use cor literal (#hex, rgb). Sempre use tokens: bg-background, bg-surface, bg-surface-2, text-foreground, text-muted-foreground, text-primary, bg-primary, text-primary-foreground, border-border, text-wrong, border-wrong
- Fontes: font-display (Syne) para logo, font-sans (DM Sans) para UI, font-mono (JetBrains Mono) para números
- Raios: rounded-[14px] em botões e cards padrão, rounded-[18px] em cards maiores
- Botões: h-14 w-full rounded-[14px], disabled com opacity-40

Estrutura da tela (bg-background, container max-w-md mx-auto px-4 py-8, centralizado verticalmente):

1. BrainLogo size="lg" — componente de src/components/brain/BrainLogo, centralizado
2. Tagline abaixo do logo: "Quiz em tempo real com seus amigos" — text-base text-muted-foreground text-center mb-8
3. Card bg-surface rounded-[18px] p-5 com:
   - Label "Como quer ser chamado?" — text-xs uppercase tracking-widest text-muted-foreground mb-2
   - Input: bg-surface-2 h-14 rounded-[14px] px-4 text-foreground, placeholder "Seu apelido" em text-muted-foreground, focus com ring-1 ring-primary
   - Mensagem de erro abaixo do input: text-wrong text-sm, visível apenas quando inválido
   - PrimaryButton de src/components/brain/PrimaryButton com label="Entrar", disabled quando input vazio ou inválido

Validação: mínimo 2 chars, máximo 16, sem espaços nas bordas. Erro: "Apelido deve ter entre 2 e 16 caracteres."

Animação de entrada: BrainLogo com animate-fade-in + scale 0.9→1 em 400ms; card com animate-slide-up delay 150ms.

Ao confirmar: salvar playerName e playerId (crypto.randomUUID()) em React Context e localStorage. Navegar para /inicio.
```

---

### TELA 2 — Início (`/inicio`)

**Descrição:**
Hub de entrada. Dois caminhos: criar sala (host) ou entrar com código.

**Estrutura:**

```
bg-background
  └─ container max-w-md mx-auto px-4 py-8
       ├─ BrainLogo size="md"
       ├─ saudação: "Olá, {playerName}!"
       │    text-2xl font-display font-bold text-foreground mb-8
       └─ flex flex-col gap-3
            ├─ PrimaryButton label="Criar sala"
            └─ SecondaryButton label="Entrar com código"
                 └─ [ao clicar: revelar com animate-slide-up]
                      ├─ input de código
                      │    bg-surface-2 h-14 rounded-[14px] px-4
                      │    font-mono text-primary text-center tracking-[0.3rem] uppercase
                      │    maxLength=6, somente letras, auto-uppercase
                      └─ PrimaryButton label="Entrar" disabled se length < 6
```

**Comportamento:**

- "Criar sala" → navegar para `/criar`
- Input de código: aceita apenas letras A-Z, converte para maiúsculo automaticamente, limite 6
- "Entrar" do código: chama `useJoinRoom`, navega para `/lobby` se sucesso
- Erros de entrada exibidos como `text-wrong text-sm` abaixo do input

---

**📌 PROMPT DE IA — TELA 2:**

```
Crie a tela de início do app Brain seguindo o Brain Design System.

IMPORTANTE — regras absolutas:
- Apenas tokens semânticos. Zero cores literais.
- Usar componentes de src/components/brain/ onde existirem.

Estrutura (bg-background, container max-w-md mx-auto px-4 py-8):

1. BrainLogo size="md" centralizado no topo
2. Saudação "Olá, {playerName}!" — text-2xl font-display font-bold text-foreground, mb-8, playerName vem do Context
3. flex flex-col gap-3:
   a. PrimaryButton label="Criar sala" → navega para /criar
   b. SecondaryButton label="Entrar com código" → ao clicar, revela com animate-slide-up (300ms) um bloco abaixo:
      - Input: bg-surface-2 h-14 rounded-[14px] px-4 text-center font-mono text-primary tracking-[0.3rem] uppercase, placeholder "------", maxLength=6, aceita apenas /[A-Z]/i (filter no onChange, converte para maiúsculo)
      - Mensagem de erro text-wrong text-sm abaixo do input (ex: "Sala não encontrada", "Sala cheia", "Partida já iniciada")
      - PrimaryButton label="Entrar" disabled quando input.length < 6, com loading state enquanto busca a sala

Ao "Entrar": chamar hook useJoinRoom(code, playerName). Sucesso → navegar para /lobby/:roomCode. Erro → exibir mensagem específica no campo.

Animação de entrada da tela: animate-fade-in 300ms.
```

---

### TELA 3 — Configuração da Sala (`/criar`)

**Descrição:**
Exclusiva do host. Define tema, total de perguntas e timer antes de criar a sala.

**Estrutura:**

```
bg-background
  └─ container max-w-md mx-auto px-4 py-8
       ├─ header: botão voltar (←) + título "Configurar sala"
       │    text-2xl font-display font-bold text-foreground
       │
       ├─ seção "Tema" (mb-6)
       │    label: text-xs uppercase tracking-widest text-muted-foreground mb-3
       │    grid 2 colunas gap-2 (último item centralizado se ímpar)
       │    cada card: bg-surface rounded-[14px] p-4 flex flex-col items-center gap-2
       │      estado padrão: border-2 border-transparent
       │      estado selecionado: border-2 border-primary bg-primary/5
       │      ícone emoji text-2xl + label text-sm font-sans
       │      label selecionado: text-primary; padrão: text-foreground
       │
       ├─ seção "Número de perguntas" (mb-6)
       │    label: text-xs uppercase tracking-widest text-muted-foreground mb-3
       │    SegmentedControl options=["5","10","15","20"]
       │
       ├─ seção "Tempo por pergunta" (mb-8)
       │    label: text-xs uppercase tracking-widest text-muted-foreground mb-3
       │    SegmentedControl options=["5s","15s","30s"]
       │
       └─ PrimaryButton label="Criar sala"
            disabled se tema ou perguntas ou timer não selecionados
```

**Temas disponíveis:**

| Emoji | Label                 | Valor                |
|-------|-----------------------|----------------------|
| 🏛️   | História              | `historia`           |
| ⚽    | Esportes              | `esportes`           |
| 💻    | Tecnologia            | `tecnologia`         |
| 🎬    | Filmes                | `filmes`             |
| 🌍    | Conhecimentos Gerais  | `conhecimentos_gerais` |

**Comportamento:**

- Ao criar: chamar `useCreateRoom(config)`, navegar para `/lobby/:roomCode`

**Animações:**

- Cada seção entra com `animate-slide-up` e stagger de 100ms entre seções

---

**📌 PROMPT DE IA — TELA 3:**

```
Crie a tela de configuração de sala do app Brain seguindo o Brain Design System. Tela exclusiva do host.

IMPORTANTE — regras absolutas:
- Zero cores literais. Apenas tokens semânticos.
- SegmentedControl e PrimaryButton de src/components/brain/.

Estrutura (bg-background, container max-w-md mx-auto px-4 py-8, scroll vertical):

Header:
- Botão voltar: ícone ← text-muted-foreground, hover text-foreground, sem fundo
- Título "Configurar sala": text-2xl font-display font-bold text-foreground, centralizado
- Layout flex justify-between items-center mb-8

Seção "Tema" (mb-6):
- Label "Escolha o tema": text-xs uppercase tracking-widest text-muted-foreground mb-3
- Grid 2 colunas gap-2. 5 cards de tema (o 5º centralizado na linha sozinho):
  Cada card: bg-surface rounded-[14px] p-4 flex flex-col items-center gap-2 cursor-pointer
  border-2 border-transparent por padrão
  Selecionado: border-2 border-primary bg-primary/5
  Conteúdo: emoji text-2xl + label text-sm font-sans (text-foreground padrão, text-primary quando selecionado)
  Temas: 🏛️ História | ⚽ Esportes | 💻 Tecnologia | 🎬 Filmes | 🌍 Conhecimentos Gerais
  Hover: brightness-105 (filter), transição 150ms

Seção "Número de perguntas" (mb-6):
- Label "Perguntas": text-xs uppercase tracking-widest text-muted-foreground mb-3
- SegmentedControl de src/components/brain/ com options=["5","10","15","20"]

Seção "Tempo por pergunta" (mb-8):
- Label "Tempo por pergunta": text-xs uppercase tracking-widest text-muted-foreground mb-3
- SegmentedControl de src/components/brain/ com options=["5s","15s","30s"]

Rodapé:
- PrimaryButton label="Criar sala", disabled (opacity-40) até tema + perguntas + timer selecionados

Animação: cada seção com animate-slide-up e stagger 100ms entre elas.
Ao criar: chamar useCreateRoom({ theme, totalQuestions, timerSeconds }). Navegar para /lobby/:roomCode.
```

---

### TELA 4 — Lobby (`/lobby/:roomCode`)

**Descrição:**
Sala de espera. Código em destaque para o host compartilhar. Lista de jogadores atualiza em tempo real.

**Estrutura:**

```
bg-background
  └─ container max-w-md mx-auto px-4 py-8 flex flex-col min-h-screen
       ├─ BrainLogo size="sm" + chips de config da sala
       │    chips: bg-surface-2 rounded-md px-2 py-1
       │           text-xs text-muted-foreground
       │           (tema · Xp · Ys)
       │
       ├─ CodeDisplay code={roomCode}  ← componente de src/components/brain/
       │    (exibe código + botão copiar)
       │
       ├─ header da lista: "Jogadores" (text-sm font-semibold text-foreground)
       │    + contador "{n} / 8" (text-xs text-muted-foreground)
       │    layout flex justify-between items-center mb-3
       │
       ├─ flex flex-col gap-3 (lista de jogadores, flex-grow)
       │    PlayerListItem para cada jogador
       │    (animate-slide-up com stagger index * 80ms na entrada)
       │
       └─ rodapé fixo (mt-auto pt-4)
            SE host:
              PrimaryButton label="Iniciar partida"
              disabled + label "Aguardando jogadores (mín. 3)" se < 3 jogadores
            SE não host:
              texto "Aguardando o host iniciar..."
              text-sm text-muted-foreground text-center
              com animate-shimmer aplicado a um indicador de loading sutil
```

**Realtime:**

- Assinar canal `sala:{roomCode}` ao montar
- Escutar `jogador_entrou` → adicionar à lista com `animate-slide-up`
- Escutar `jogador_saiu` → remover da lista
- Escutar `partida_iniciada` → navegar todos para `/jogo/:roomCode`

---

**📌 PROMPT DE IA — TELA 4:**

```
Crie a tela de lobby do app Brain seguindo o Brain Design System.

IMPORTANTE — regras absolutas:
- Zero cores literais. Tokens semânticos apenas.
- Usar CodeDisplay e PlayerListItem de src/components/brain/.

Estrutura (bg-background, container max-w-md mx-auto px-4 py-8, flex flex-col min-h-screen):

Topo:
- BrainLogo size="sm" + linha de chips (flex gap-2 flex-wrap):
  Chips: bg-surface-2 rounded-md px-2 py-1 text-xs text-muted-foreground
  Conteúdo: tema da sala · nº de perguntas · tempo por pergunta
  Layout flex items-center justify-between mb-6

CodeDisplay:
- Componente src/components/brain/CodeDisplay com prop code={roomCode}
- mb-6

Lista de jogadores:
- Header flex justify-between items-center mb-3:
  "Jogadores" text-sm font-semibold text-foreground
  "{n} / 8" text-xs text-muted-foreground
- flex flex-col gap-3 flex-grow:
  PlayerListItem de src/components/brain/ para cada jogador
  Cada item entra com animate-slide-up, animationDelay = index * 80ms

Rodapé fixo mt-auto pt-4:
- SE isHost === true:
    PrimaryButton label="Iniciar partida"
    Quando players.length < 3: disabled=true, label="Aguardando jogadores (mín. 3)"
    Quando players.length >= 3: disabled=false, label="Iniciar partida"
- SE isHost === false:
    div text-center text-sm text-muted-foreground
    "Aguardando o host iniciar..."
    Indicador de loading: 3 dots com animate-pulse-dot em sequência

Realtime: ao montar, assinar canal Supabase 'sala:{roomCode}'. Escutar:
- 'jogador_entrou' → atualizar lista
- 'jogador_saiu' → remover da lista
- 'partida_iniciada' → navegar para /jogo/:roomCode

Ao clicar "Iniciar partida": chamar useStartGame(roomId).
```

---

### TELA 5 — Pergunta (`/jogo/:roomCode`)

**Descrição:**
Tela principal. Timer + pergunta + 3 botões de resposta. É a tela com maior impacto e deve ser executada com máxima precisão.

**Estrutura:**

```
bg-background
  └─ container max-w-md mx-auto px-4 py-6 flex flex-col min-h-screen
       ├─ barra de progresso
       │    text-xs text-muted-foreground uppercase tracking-widest
       │    "PERGUNTA {n} DE {total}"
       │    mb-3
       │
       ├─ TimerBar  ← componente de src/components/brain/
       │    duration={timerSeconds}
       │    onExpire={handleExpire}
       │    mb-6
       │
       ├─ card da pergunta (flex-grow flex items-center)
       │    bg-surface rounded-[18px] p-5 mb-6
       │    texto da pergunta: text-xl font-sans text-foreground
       │    leading-relaxed text-center
       │
       └─ flex flex-col gap-2 (3 botões de resposta)
```

**Estados dos botões de resposta:**

| Estado                        | Classes                                                  |
|-------------------------------|----------------------------------------------------------|
| Normal (aguardando)           | `bg-surface-2 text-foreground rounded-[14px] h-14 w-full font-sans font-medium` |
| Hover (normal)                | `brightness-110` via filter                              |
| Selecionado (aguard. validação)| `bg-primary text-primary-foreground scale-[1.02]`        |
| Correto (pós-validação)       | `bg-correct text-primary-foreground` + ícone ✓ à direita |
| Errado selecionado            | `bg-wrong text-foreground` + ícone ✗ à direita           |
| Correto não selecionado       | `bg-correct/20 text-correct border border-correct`       |
| Neutro pós-resposta           | `bg-surface-2 text-muted-foreground opacity-50`          |
| Timer esgotado (não respondeu)| todos neutros + correto em `bg-correct/20 text-correct`  |

**Pós-resposta:**

- Todos os botões bloqueados (`pointer-events-none`)
- Texto `text-muted-foreground text-sm text-center` + dots animados: "Aguardando os outros..."
- Após 2s exibindo gabarito: navegar para `/resultado/:roomCode`

**Animações:**

- Entrada da pergunta: `animate-fade-in` 300ms
- Botões: `animate-slide-up` com stagger `index * 80ms`
- Feedback nos botões: `animate-pop` 400ms

---

**📌 PROMPT DE IA — TELA 5:**

```
Crie a tela de pergunta do app Brain seguindo o Brain Design System. É a tela mais crítica — execute com máxima precisão.

IMPORTANTE — regras absolutas:
- Zero cores literais. Tokens semânticos apenas.
- TimerBar de src/components/brain/ (usa requestAnimationFrame internamente).
- tabular-nums em qualquer número em tempo real.

Estrutura (bg-background, container max-w-md mx-auto px-4 py-6, flex flex-col min-h-screen):

Topo:
- Label "PERGUNTA {currentRound} DE {totalRounds}": text-xs uppercase tracking-widest text-muted-foreground mb-3
- TimerBar de src/components/brain/TimerBar com props duration={timerSeconds} onExpire={handleExpire}
  mb-6

Card da pergunta:
- bg-surface rounded-[18px] p-5 mb-6
- Texto: text-xl font-sans text-foreground leading-relaxed text-center
- flex-grow com flex items-center justify-center

Área de respostas — flex flex-col gap-2:
3 botões, cada um: h-14 w-full rounded-[14px] font-sans font-medium px-4
flex items-center justify-between (texto à esq, ícone à dir)

Estados dos botões (aplicar via className condicional):
- Normal: bg-surface-2 text-foreground
- Hover (apenas no estado normal): filter brightness-110, transição 150ms
- Selecionado aguardando: bg-primary text-primary-foreground scale-[1.02]
- Correto revelado: bg-correct text-primary-foreground animate-pop + ícone ✓ à direita
- Errado selecionado: bg-wrong text-foreground animate-pop + ícone ✗ à direita
- Correto não selecionado pelo jogador: bg-correct/20 text-correct border border-correct
- Neutro pós-resposta: bg-surface-2 text-muted-foreground opacity-50
Após qualquer resposta ou timeout: pointer-events-none em todos os botões.

Mensagem pós-resposta (aparecer com animate-fade-in abaixo dos botões):
"Aguardando os outros..." text-sm text-muted-foreground text-center
3 dots com animate-pulse-dot em sequência (delay 0ms, 200ms, 400ms)

Animação entrada: pergunta com animate-fade-in 300ms; botões com animate-slide-up stagger index * 80ms.

Realtime: escutar evento 'todos_responderam' no canal 'sala:{roomCode}' → mostrar gabarito 2s → navegar para /resultado/:roomCode.
Timeout local (TimerBar.onExpire): registrar timeout → mostrar gabarito → aguardar evento Realtime ou navegar após 3s.
```

---

### TELA 6 — Resultado da Rodada (`/resultado/:roomCode`)

**Descrição:**
Feedback individual. Impactante, rápida — fica na tela por 3 a 5 segundos.

**Estrutura:**

```
bg-background
  └─ container max-w-md mx-auto px-4 py-8
       flex flex-col items-center justify-center min-h-screen gap-4
       │
       ├─ FeedbackIcon type={answerResult}  ← src/components/brain/
       │    (96×96, animate-pop, glow na cor do resultado)
       │
       ├─ texto principal
       │    text-2xl font-display font-bold
       │    correct → text-correct "Correto!"
       │    wrong   → text-wrong "Errado"
       │    timeout → text-muted-foreground "Tempo esgotado"
       │
       ├─ variação de pontos
       │    font-mono text-lg tabular-nums
       │    correct → text-correct "+1 ponto"
       │    wrong   → text-muted-foreground "sem alteração"
       │    timeout → text-wrong "−1 ponto"
       │
       ├─ pontuação atual
       │    "Sua pontuação: {score}"
       │    text-base text-muted-foreground font-sans
       │
       └─ contador regressivo
            círculo 40×40 bg-surface-2 rounded-full
            número: font-mono text-sm text-muted-foreground tabular-nums
            decrementa de 4 até 0, então navega para /ranking/:roomCode
```

**Fundo contextual:**

- `correct`: `bg-correct/5` como background + glow `box-shadow: 0 0 60px -10px var(--color-correct)` no FeedbackIcon
- `wrong`: `bg-wrong/5` como background
- `timeout`: sem variação de fundo

**Animações:**

- FeedbackIcon: `animate-pop` (já embutido no componente)
- Texto principal: `animate-fade-in` delay 150ms
- Variação de pontos: `animate-fade-in` delay 250ms
- Pontuação: `animate-fade-in` delay 350ms
- Contador: `animate-fade-in` delay 450ms

---

**📌 PROMPT DE IA — TELA 6:**

```
Crie a tela de resultado de rodada do app Brain seguindo o Brain Design System. Fica visível por ~4 segundos — deve ser impactante e imediata.

IMPORTANTE — regras absolutas:
- Zero cores literais. Tokens semânticos.
- FeedbackIcon de src/components/brain/FeedbackIcon (animate-pop embutido).
- font-mono + tabular-nums em todo número.

Estrutura (bg-background com overlay sutil: bg-correct/5 se correto, bg-wrong/5 se errado, sem overlay se timeout):
Container max-w-md mx-auto px-4, flex flex-col items-center justify-center min-h-screen gap-6.

1. FeedbackIcon de src/components/brain/FeedbackIcon
   prop type: "correct" | "wrong" | "timeout" (vem do Context)

2. Texto principal — text-2xl font-display font-bold:
   correct: text-correct "Correto!"
   wrong: text-wrong "Errado"
   timeout: text-muted-foreground "Tempo esgotado"
   animate-fade-in delay 150ms

3. Variação de pontos — font-mono text-lg tabular-nums:
   correct: text-correct "+1 ponto"
   wrong: text-muted-foreground "sem alteração"
   timeout: text-wrong "−1 ponto"
   animate-fade-in delay 250ms

4. Pontuação atual — text-base text-muted-foreground:
   "Sua pontuação: {myScore}" — font-mono tabular-nums para o número
   animate-fade-in delay 350ms

5. Contador regressivo:
   Círculo h-10 w-10 bg-surface-2 rounded-full flex items-center justify-center
   Número dentro: font-mono text-sm text-muted-foreground tabular-nums
   Começa em 4, decrementa a cada segundo. Ao chegar em 0: navegar para /ranking/:roomCode
   animate-fade-in delay 450ms

Ao montar: registrar resposta no Supabase via useSubmitAnswer se ainda não registrado.
```

---

### TELA 7 — Ranking Parcial (`/ranking/:roomCode`)

**Descrição:**
Ranking de todos os jogadores após cada rodada. Exibido por 4 segundos, depois volta para `/jogo`.

**Estrutura:**

```
bg-background
  └─ container max-w-md mx-auto px-4 py-8 flex flex-col min-h-screen
       ├─ header
       │    "Ranking" text-2xl font-display font-bold text-foreground
       │    "após pergunta {n}" text-xs text-muted-foreground uppercase tracking-widest
       │    mb-6
       │
       ├─ flex flex-col gap-3 flex-grow
       │    PlayerListItem para cada jogador (ordenado por score DESC)
       │    stagger: animationDelay = index * 80ms + animate-slide-up
       │
       └─ rodapé mt-auto
            "Próxima pergunta em {n}..." text-sm text-muted-foreground text-center mb-2
            barra de progresso linear:
              h-1 bg-surface-2 rounded-full
              preenchimento bg-primary, transition-all linear
              esgota em 4 segundos → navegar para /jogo/:roomCode
```

**Realtime:**

- Escutar `partida_finalizada` → navegar para `/final/:roomCode` em vez de `/jogo`

---

**📌 PROMPT DE IA — TELA 7:**

```
Crie a tela de ranking parcial do app Brain seguindo o Brain Design System. Exibida por 4 segundos entre perguntas.

IMPORTANTE — regras absolutas:
- Zero cores literais. Tokens semânticos.
- PlayerListItem de src/components/brain/PlayerListItem.
- font-mono + tabular-nums nos scores.

Estrutura (bg-background, container max-w-md mx-auto px-4 py-8, flex flex-col min-h-screen):

Header mb-6:
- "Ranking" text-2xl font-display font-bold text-foreground
- "após pergunta {currentRound}" text-xs uppercase tracking-widest text-muted-foreground

Lista flex flex-col gap-3 flex-grow:
- PlayerListItem de src/components/brain/ para cada jogador
- Ordenado por score DESC
- Props: position, name, score, isCurrentPlayer, isHost
- Cada item: animate-slide-up com animationDelay = index * 80ms

Rodapé mt-auto:
- "Próxima pergunta em {countdown}..." text-sm text-muted-foreground text-center mb-2
  O número {countdown} em font-mono tabular-nums
- Barra de progresso: h-1 w-full bg-surface-2 rounded-full overflow-hidden
  Preenchimento interno: h-full bg-primary, largura parte de 100% até 0% em 4s (transition linear)
  Ao chegar em 0: navegar para /jogo/:roomCode

Realtime: escutar 'partida_finalizada' → navegar para /final/:roomCode.
Buscar scores atualizados via useRanking(roomId) ao montar.
```

---

### TELA 8 — Ranking Final (`/final/:roomCode`)

**Descrição:**
Tela de encerramento. A mais impactante visualmente — confete, pódio, celebração.

**Estrutura:**

```
bg-background (com brain-confetti ao montar)
  └─ container max-w-md mx-auto px-4 py-8 flex flex-col min-h-screen
       ├─ "Fim de jogo!" text-4xl font-display font-bold text-foreground text-center mb-8
       │    animate-slide-up 600ms
       │
       ├─ pódio (top 3) — flex items-end justify-center gap-3 mb-8
       │    2º lugar (coluna esquerda, h-20):
       │      avatar inicial + apelido text-sm text-foreground
       │      score font-mono font-bold text-silver tabular-nums
       │      plataforma bg-surface rounded-t-[14px] h-20 flex items-center justify-center
       │        "2" font-display font-bold text-silver text-2xl
       │    1º lugar (coluna centro, h-28):
       │      👑 animate-bounce-soft
       │      avatar inicial + apelido text-sm text-foreground
       │      score font-mono font-bold text-gold tabular-nums
       │      plataforma bg-surface rounded-t-[14px] h-28 flex items-center justify-center
       │        "1" font-display font-bold text-gold text-3xl
       │        glow: box-shadow 0 0 60px -10px var(--color-gold) (inline style)
       │    3º lugar (coluna direita, h-14):
       │      avatar inicial + apelido text-sm text-foreground
       │      score font-mono font-bold text-bronze tabular-nums
       │      plataforma bg-surface rounded-t-[14px] h-14 flex items-center justify-center
       │        "3" font-display font-bold text-bronze text-xl
       │
       ├─ lista completa — flex flex-col gap-3 mb-8
       │    PlayerListItem com isWinner para quem tiver pontuação máxima
       │    animate-fade-in delay 400ms
       │
       └─ rodapé fixo mt-auto flex flex-col gap-3
            PrimaryButton label="Jogar novamente" → navegar para /inicio
            SecondaryButton label="Sair" → navegar para /
```

**Empate:**

- Todos os jogadores com pontuação máxima recebem `isWinner=true` no `PlayerListItem`
- `👑` aparece antes do nome de cada um deles
- Pódio mostra todos os empatados na posição 1 (adaptar layout se necessário)

**Animações:**

- `brain-confetti` ao montar (duração livre)
- "Fim de jogo!": `animate-slide-up` 600ms
- Pódio: `animate-slide-up` delay 200ms
- Lista: `animate-fade-in` delay 400ms
- `👑` do 1º: `animate-bounce-soft` loop

---

**📌 PROMPT DE IA — TELA 8:**

```
Crie a tela de ranking final do app Brain seguindo o Brain Design System. É a tela de celebração — use as animações disponíveis ao máximo.

IMPORTANTE — regras absolutas:
- Zero cores literais. Tokens semânticos (text-gold, text-silver, text-bronze, bg-surface, etc.).
- PlayerListItem de src/components/brain/.
- font-mono + tabular-nums em scores.
- Sombras e glows sempre via color-mix ou var(--color-...).

Estrutura (bg-background, container max-w-md mx-auto px-4 py-8, flex flex-col min-h-screen):

Ao montar: disparar animação brain-confetti (partículas em text-primary, text-correct, text-gold caindo).

Título "Fim de jogo!" — text-4xl font-display font-bold text-foreground text-center mb-8
animate-slide-up 600ms

Pódio (animate-slide-up delay 200ms):
- flex items-end justify-center gap-3 mb-8
- 3 colunas para 1º, 2º, 3º lugar:
  - Acima da plataforma: apelido text-sm text-foreground text-center + score em font-mono font-bold tabular-nums
    1º: text-gold + ícone 👑 acima com animate-bounce-soft
    2º: text-silver
    3º: text-bronze
  - Plataforma bg-surface rounded-t-[14px] flex items-center justify-center:
    1º: h-28 — número "1" text-3xl font-display font-bold text-gold, inline style box-shadow glow dourado
    2º: h-20 — número "2" text-2xl font-display font-bold text-silver
    3º: h-14 — número "3" text-xl font-display font-bold text-bronze
- Se empate no 1º: todos os empatados recebem tratamento gold + 👑

Lista completa (animate-fade-in delay 400ms):
- flex flex-col gap-3 mb-8
- PlayerListItem para todos os jogadores, ordenado por score DESC
- isWinner=true para quem tiver pontuação máxima

Rodapé fixo mt-auto flex flex-col gap-3:
- PrimaryButton label="Jogar novamente" → navegar para /inicio
- SecondaryButton label="Sair" → navegar para /

Ao montar: chamar useRanking(roomId) para scores finais.
```

---

## 5. Componentes — Spec de Implementação

Todos em `src/components/brain/`. Referência completa no design system. Resumo operacional abaixo.

### `BrainLogo`

```tsx
// Tamanhos: sm=text-2xl | md=text-4xl | lg=text-6xl
// font-display font-extrabold text-primary
// ponto final em text-foreground
// text-shadow glow via color-mix(in oklab, var(--color-primary) 40%, transparent)
<BrainLogo size="lg" />
// Renderiza: <span>Brain<span className="text-foreground">.</span></span>
```

### `PrimaryButton`

```tsx
// h-14 w-full rounded-[14px] bg-primary text-primary-foreground font-semibold
// hover: filter brightness-110 | active: scale-[0.99] | disabled: opacity-40 cursor-not-allowed
// box-shadow: 0 8px 30px -10px color-mix(in oklab, var(--color-primary) 60%, transparent)
<PrimaryButton label="Criar sala" onClick={fn} disabled={false} />
```

### `SecondaryButton`

```tsx
// h-14 w-full rounded-[14px] bg-transparent border-2 border-primary text-primary font-semibold
// hover: bg-primary/10 | active: scale-[0.99] | disabled: opacity-40
<SecondaryButton label="Entrar com código" onClick={fn} />
```

### `SegmentedControl`

```tsx
// flex w-full gap-1 p-1 bg-surface-2 rounded-[10px]
// cada opção: flex-1 h-12 rounded-[10px] font-sans font-medium
// selecionado: bg-primary text-primary-foreground + sombra
// não selecionado: text-muted-foreground, hover: text-foreground
<SegmentedControl
  options={["5", "10", "15", "20"]}
  selected="10"
  onChange={(val) => setTotal(val)}
/>
```

### `TimerBar`

```tsx
// Barra h-1.5 bg-surface-2 rounded-full + preenchimento que encolhe (requestAnimationFrame)
// Cor do preenchimento: >50% → bg-primary | 25-50% → bg-warning | <25% → bg-wrong
// Número de segundos: font-mono text-2xl tabular-nums, cor muda junto com barra
// onExpire dispara quando chega a 0
<TimerBar duration={15} onExpire={handleExpire} />
```

### `PlayerListItem`

```tsx
// Card: p-4 rounded-[14px] bg-surface
// isCurrentPlayer: border-2 border-primary bg-primary/5
// position 1/2/3: text-gold/silver/bronze | demais: text-muted-foreground
// Online dot: h-2.5 w-2.5 bg-correct rounded-full animate-pulse-dot
// isWinner: prefixo 👑 antes do nome
// isHost: badge bg-primary/15 text-primary text-xs uppercase tracking-widest rounded-md px-2
// score: font-mono font-bold text-primary tabular-nums
// entrada: animate-slide-up com animationDelay prop
<PlayerListItem
  position={1}
  name="Fulano"
  score={7}
  isCurrentPlayer={true}
  isHost={false}
  isWinner={false}
  animationDelay={80}
/>
```

### `FeedbackIcon`

```tsx
// Disco 96×96 rounded-full
// correct: fundo color-mix(correct 18%), ícone ✓ text-correct, halo box-shadow correct
// wrong: fundo color-mix(wrong 18%), ícone ✗ text-wrong, halo box-shadow wrong
// timeout: fundo color-mix(muted 18%), ícone ⏱ text-muted-foreground, sem halo
// animate-pop ao montar (400ms cubic-bezier overshoot)
<FeedbackIcon type="correct" />
```

### `CodeDisplay`

```tsx
// Container: p-5 rounded-[18px] bg-surface border border-border
// Label: text-xs uppercase tracking-widest text-muted-foreground mb-2
// Código: font-mono font-bold text-primary text-4xl tracking-[0.5rem]
// Botão copiar: h-12 w-12 bg-surface-2 rounded-[10px]
//   ao copiar: ícone muda para ✓ text-correct por 2 segundos
<CodeDisplay code="XKPQRT" />
```

---

## 6. Estado Global

**📌 PROMPT DE IA — ESTADO GLOBAL:**

```
Crie o gerenciamento de estado global do app Brain usando React Context + useReducer.

Interface do estado:
interface GameState {
  // Sessão
  playerId: string;          // crypto.randomUUID(), persistido em localStorage
  playerName: string;        // persistido em localStorage

  // Sala
  roomId: string;
  roomCode: string;          // 6 letras maiúsculas
  isHost: boolean;

  // Configuração
  theme: string;
  totalQuestions: number;
  timerSeconds: 5 | 15 | 30;

  // Partida
  currentQuestion: {
    id: string;
    texto: string;
    respostas: string[];     // array de 3 strings
    indiceCorreto?: number;  // preenchido apenas após round_ended
  } | null;
  currentRound: number;
  players: Array<{
    id: string;
    apelido: string;
    pontuacao: number;
    estado: 'ativo' | 'desconectado';
    isHost: boolean;
  }>;
  myScore: number;

  // UI
  gamePhase: 'apelido' | 'inicio' | 'configuracao' | 'lobby' | 'pergunta' | 'resultado' | 'ranking' | 'final';
  selectedAnswer: number | null;
  answerResult: 'correct' | 'wrong' | 'timeout' | null;
}

Actions do reducer:
SET_PLAYER_NAME | JOIN_ROOM | CREATE_ROOM | SET_GAME_CONFIG |
START_GAME | SET_QUESTION | SELECT_ANSWER | SET_ANSWER_RESULT |
UPDATE_PLAYERS | UPDATE_SCORES | END_GAME | RESET

Exportar: GameContext, GameProvider, useGame hook.
Persistir playerId e playerName em localStorage.
Inicializar playerId com crypto.randomUUID() se não existir no localStorage.
```

---

## 7. Hooks Supabase

**📌 PROMPT DE IA — HOOKS SUPABASE:**

```
Crie os hooks de integração com Supabase para o app Brain. Cliente em src/lib/supabase.ts.
Todos TypeScript, padrão { data, loading, error }.

1. useCreateRoom(config: { theme, totalQuestions, timerSeconds })
   - Gera código único de 6 letras maiúsculas (verificar unicidade na tabela salas)
   - Insere registro em `salas`
   - Insere host em `jogadores`
   - Retorna { roomId, roomCode }

2. useJoinRoom(code: string, playerName: string)
   - Busca sala pelo código (case-insensitive)
   - Valida: estado === 'lobby', count(jogadores) < 8
   - Erros específicos: 'Sala não encontrada' | 'Sala cheia' | 'Partida já iniciada'
   - Insere jogador em `jogadores`
   - Retorna { roomId, players }

3. useRoomPresence(roomId: string)
   - Assina canal Realtime 'sala:{roomId}'
   - Escuta 'jogador_entrou' e 'jogador_saiu'
   - Retorna lista de jogadores atualizada em tempo real

4. useStartGame(roomId: string)
   - Atualiza estado da sala para 'em_andamento'
   - Emite broadcast 'partida_iniciada' no canal da sala
   - Retorna { success }

5. useGameSync(roomId: string)
   - Assina canal 'sala:{roomId}'
   - Escuta: 'nova_pergunta' | 'todos_responderam' | 'ranking_atualizado' | 'partida_finalizada'
   - Atualiza GameContext via dispatch conforme eventos chegam
   - Retorna { connected }

6. useSubmitAnswer(params: { roomId, playerId, questionId, round, answerIndex })
   - Verifica idempotência (não registrar duplicata)
   - Insere em `respostas_rodada`
   - Calcula is_correct localmente (indiceCorreto já está no Context após round_ended)
   - Retorna { success, isCorrect }

7. useRanking(roomId: string)
   - Busca pontuações de `jogadores` WHERE sala_id = roomId ORDER BY pontuacao DESC
   - Atualiza via Realtime quando 'ranking_atualizado' for emitido
   - Retorna { players: Player[] }
```

---

## 8. Roteamento

**📌 PROMPT DE IA — ROTEAMENTO:**

```
Configure React Router v6 para o app Brain.

Rotas:
/ → ApelidoPage
/inicio → InicioPage
/criar → CriacaoPage
/lobby/:roomCode → LobbyPage
/jogo/:roomCode → JogoPage
/resultado/:roomCode → ResultadoPage
/ranking/:roomCode → RankingPage
/final/:roomCode → FinalPage

Guards:
- Todas as rotas exceto / requerem playerName no GameContext. Se ausente, redirecionar para /.
- /lobby, /jogo, /resultado, /ranking, /final requerem roomId no Context. Se ausente, redirecionar para /inicio.
- /criar requer playerName E isHost === true.

Transições entre telas: aplicar animate-fade-in 300ms na entrada de cada rota.
```

---

## 9. Ordem de Implementação

```
1.  src/styles.css — tokens CSS (oklch), Google Fonts (Syne, DM Sans, JetBrains Mono), animações
2.  tailwind.config — mapear tokens para classes (bg-primary, text-correct, etc.)
3.  Componentes: BrainLogo → PrimaryButton → SecondaryButton → SegmentedControl
4.  Componentes: TimerBar → PlayerListItem → FeedbackIcon → CodeDisplay
5.  Estado global (GameContext + useReducer)
6.  Roteamento (React Router v6 + guards)
7.  Tela 1 — Apelido
8.  Tela 2 — Início
9.  Tela 3 — Configuração
10. Tela 4 — Lobby (mock de jogadores, sem Realtime)
11. Tela 5 — Pergunta (mock de pergunta, sem Realtime)
12. Tela 6 — Resultado
13. Tela 7 — Ranking Parcial
14. Tela 8 — Ranking Final
15. src/lib/supabase.ts — configuração do cliente
16. Hooks: useCreateRoom + useJoinRoom
17. Hooks: useRoomPresence + useStartGame
18. Hooks: useGameSync + useSubmitAnswer + useRanking
19. Substituir mocks por hooks reais (Telas 4 → 8)
20. Teste de fluxo completo em 3+ abas do browser
```

---

## 10. Checklist de Entrega

### Design System

- [ ] Nenhuma cor literal (`#...`, `rgb(...)`, `bg-white`, `text-black`) em nenhum componente
- [ ] Todas as cores via token (`bg-primary`, `text-correct`, `var(--color-...)`)
- [ ] Tipografia: `font-display` para títulos/logo, `font-sans` para UI, `font-mono` para números
- [ ] Botões: `h-14 w-full rounded-[14px]`
- [ ] Números em tempo real: `font-mono tabular-nums`
- [ ] Sombras e glows via `color-mix` ou `var(--color-...)`

### Estados de UI

- [ ] Hover: `brightness-110` (botões)
- [ ] Active: `scale-[0.99]`
- [ ] Focus: `ring-1 ring-primary`
- [ ] Disabled: `opacity-40 cursor-not-allowed`
- [ ] Loading: `animate-shimmer` ou `animate-pulse-dot`

### Funcionalidade

- [ ] Fluxo completo navegável (apelido → lobby → jogo → final)
- [ ] Código de sala copiável via `CodeDisplay`
- [ ] Botão iniciar desabilitado com < 3 jogadores
- [ ] Resposta bloqueada após seleção (`pointer-events-none`)
- [ ] Pontuação nunca vai abaixo de 0
- [ ] Empate: todos os vencedores recebem `isWinner=true` + 👑

### Animações

- [ ] `brain-confetti` na tela final
- [ ] `animate-pop` no `FeedbackIcon`
- [ ] Stagger em todas as listas (`index * 80ms`)
- [ ] `TimerBar` usa `requestAnimationFrame`
- [ ] Nenhum elemento com mais de 2 animações simultâneas

### Mobile

- [ ] Testado em 375px (iPhone SE) e 390px (iPhone 14)
- [ ] Touch targets mínimo 48px
- [ ] Sem scroll horizontal
- [ ] `max-w-md mx-auto px-4` em todas as telas

### Integração

- [ ] Sala criada e persistida no Supabase
- [ ] Jogadores sincronizados em tempo real no lobby
- [ ] Perguntas e eventos de jogo via Supabase Realtime
- [ ] Pontuações atualizadas após cada rodada
- [ ] Variáveis de ambiente em `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)

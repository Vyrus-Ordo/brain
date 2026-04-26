# Brain — Design System

> Sistema de design do app **Brain** (quiz multiplayer em tempo real).
> Tema **dark-only**, identidade tech/minimal com acento elétrico.
> Fonte da verdade: `src/styles.css` + componentes em `src/components/brain/`.

---

## 1. Princípios

1. **Dark-first, sempre.** O app nasce no escuro — não há tema claro.
2. **Tokens semânticos > cores cruas.** Componentes nunca usam `bg-white`, `text-black`, hex literais. Usam `bg-primary`, `text-foreground`, `bg-surface`, etc.
3. **Foco no conteúdo da rodada.** UI silenciosa; cor é reservada para feedback (acerto/erro/tempo).
4. **Tipografia hierárquica forte.** `Syne` (display) para impactar, `DM Sans` para ler, `JetBrains Mono` para números/códigos.
5. **Movimento com propósito.** Animações curtas (150–400 ms) que comunicam estado, nunca decorativas.
6. **Acessibilidade.** Contraste AA+ em todos os pares texto/fundo. Estados de foco visíveis (`ring`).

---

## 2. Paleta de cores

Cores definidas em `oklch` em `src/styles.css` (`:root`). A coluna **Hex equivalente** é referência de origem da spec.

### 2.1 Superfícies & texto

| Token | Variável CSS | oklch | Hex ref. | Uso |
|---|---|---|---|---|
| Background | `--background` | `oklch(0.16 0.03 260)` | `#0A0E1A` | Fundo global da página |
| Surface | `--surface` | `oklch(0.22 0.04 260)` | `#131929` | Cards, lista de jogadores |
| Surface 2 | `--surface-2` | `oklch(0.27 0.05 260)` | `#1C2438` | Inputs, botões neutros, segmentos |
| Foreground | `--foreground` | `oklch(0.96 0.02 250)` | `#F0F4FF` | Texto principal |
| Muted FG | `--muted-foreground` | `oklch(0.58 0.04 260)` | `#6B7A99` | Texto secundário, labels |
| Border | `--border` | `oklch(0.30 0.04 260)` | — | Divisores, contornos sutis |

### 2.2 Marca & feedback

| Token | Variável | oklch | Hex ref. | Uso |
|---|---|---|---|---|
| Primary (Electric) | `--primary` | `oklch(0.78 0.16 230)` | `#00C2FF` | CTA, logo, foco, código da sala |
| Primary FG | `--primary-foreground` | `oklch(0.16 0.03 260)` | `#0A0E1A` | Texto sobre primary |
| Correct | `--correct` | `oklch(0.82 0.22 150)` | `#00E676` | Acerto, dot online |
| Wrong / Destructive | `--wrong` / `--destructive` | `oklch(0.68 0.22 22)` | `#FF4F4F` | Erro, perigo |
| Warning | `--warning` | `oklch(0.82 0.17 75)` | `#FFB300` | Tempo expirando (timer 25–50%) |

### 2.3 Pódio

| Token | Variável | Hex ref. | Posição |
|---|---|---|---|
| Gold | `--gold` | `#FFD700` | 1º lugar |
| Silver | `--silver` | `#C0C0C0` | 2º lugar |
| Bronze | `--bronze` | `#CD7F32` | 3º lugar |

### 2.4 Regras de uso

- **Nunca** colocar cor literal em componente. Use classe Tailwind (`bg-primary`, `text-correct`) ou `var(--color-...)` em `style`.
- **Glow/sombra de marca** sempre derivado do token via `color-mix`:
  ```css
  box-shadow: 0 8px 30px -10px color-mix(in oklab, var(--color-primary) 60%, transparent);
  ```
- **Cor = feedback**. Não use `--correct`/`--wrong` para decorar — eles significam estado.
- **Hover/active**: ajuste por `brightness()` ou `scale()`, não por troca de cor.

---

## 3. Tipografia

Importadas via Google Fonts no topo de `src/styles.css`.

| Família | Token | Uso |
|---|---|---|
| **Syne** (500–800) | `--font-display` / `font-display` | Títulos, logo, números de pontuação grande |
| **DM Sans** (400–700) | `--font-ui` / `font-sans` (default) | Texto de UI, parágrafos, botões |
| **JetBrains Mono** (500/700) | `--font-mono` / `font-mono` | Código da sala, timer, scores tabulares |

### Escala recomendada

| Estilo | Classe | Tamanho | Peso | Família |
|---|---|---|---|---|
| Display XL (logo home) | `text-6xl font-display font-extrabold` | 60px | 800 | Syne |
| Display L (títulos de tela) | `text-4xl font-display font-bold` | 36px | 700 | Syne |
| Title | `text-2xl font-semibold` | 24px | 600 | DM Sans |
| Body | `text-base` | 16px | 400 | DM Sans |
| Caption | `text-xs uppercase tracking-widest text-muted-foreground` | 12px | 500 | DM Sans |
| Mono code | `font-mono text-4xl tracking-[0.5rem] text-primary` | 36px | 700 | JetBrains Mono |
| Mono timer | `font-mono text-2xl font-bold tabular-nums` | 24px | 700 | JetBrains Mono |

**Regras:**
- `tabular-nums` em qualquer número que muda em tempo real (timer, score).
- `tracking-widest` em CAPS pequenas (labels, badges).
- Nunca use serif. Nunca misture fontes fora destas três.

---

## 4. Espaçamento, raio e elevação

### Raio (`--radius` = `0.875rem` ≈ 14px)

| Componente | Raio | Token |
|---|---|---|
| Botão primário/secundário | `14px` | `rounded-[14px]` |
| Card de jogador | `14px` | `rounded-[14px]` |
| Segmento (control) | `10px` | `rounded-[10px]` |
| Code display, modais | `18px` | `rounded-[18px]` |
| Pílula / badge | `6–8px` | `rounded-md` |
| Dot, avatar | `9999px` | `rounded-full` |

### Espaçamento

Escala Tailwind padrão (4px). Padrões observados:
- Padding interno de cards: `p-4` (16px) ou `p-5` (20px).
- Gap em listas verticais: `gap-3` (12px).
- Gap em grids de botões: `gap-2` (8px).
- Margem entre blocos de tela: `mb-6` / `mb-8`.

### Elevação (sombras de marca)

Sempre derivadas de tokens:

```css
/* CTA primário */
box-shadow: 0 8px 30px -10px color-mix(in oklab, var(--color-primary) 60%, transparent);

/* Segmento ativo */
box-shadow: 0 4px 20px -8px color-mix(in oklab, var(--color-primary) 70%, transparent);

/* Feedback (acerto/erro) */
box-shadow: 0 0 60px -10px var(--color-correct); /* ou --color-wrong */

/* Logo glow */
text-shadow: 0 0 30px color-mix(in oklab, var(--color-primary) 40%, transparent);
```

---

## 5. Componentes (`src/components/brain/`)

### 5.1 `BrainLogo`
- **Props:** `size: "sm" | "md" | "lg"` (default `lg`).
- Tamanhos: sm `text-2xl`, md `text-4xl`, lg `text-6xl`.
- `font-display`, peso 800, `text-primary`, ponto final em `text-foreground`.
- Glow via `text-shadow` derivado do primary.

### 5.2 `PrimaryButton`
- Altura **56px** (`h-14`), `w-full`, raio 14px.
- `bg-primary` + `text-primary-foreground`, `font-semibold`.
- Hover: `brightness-110`. Active: `scale-[0.99]`. Disabled: `opacity-40`.
- Sombra de marca (ver §4).

### 5.3 `SecondaryButton`
- Mesmas dimensões do primário.
- `bg-transparent` + `border-2 border-primary` + `text-primary`.
- Hover: `bg-primary/10`. Sem sombra.

### 5.4 `SegmentedControl<T>`
- Linha de botões `flex-1 h-12`, raio 10px.
- Selecionado: `bg-primary text-primary-foreground` + sombra.
- Não selecionado: `bg-surface-2 text-muted-foreground`, hover → `text-foreground`.

### 5.5 `TimerBar`
- Barra `h-1.5` em `bg-surface-2`, preenchimento muda de cor por faixa:
  - `> 50%` → `--color-primary`
  - `25–50%` → `--color-warning`
  - `< 25%` → `--color-wrong`
- Label de segundos em `font-mono text-2xl tabular-nums`, mesma cor do preenchimento.
- Implementado com `requestAnimationFrame` (não `setInterval`).

### 5.6 `PlayerListItem`
- Card `p-4 rounded-[14px] bg-surface`.
- **Jogador atual:** borda `border-2 border-primary` + `bg-primary/5`.
- Posição (1/2/3): cor gold/silver/bronze; demais `text-muted-foreground`.
- Online dot: `h-2.5 w-2.5 bg-correct rounded-full animate-pulse-dot`.
- Vencedor: prefixo 👑.
- Host: badge `bg-primary/15 text-primary` em CAPS.
- Score: `font-mono font-bold text-primary tabular-nums`.
- Entrada animada: `brain-slide-up` com delay `index * 80ms` (stagger).

### 5.7 `FeedbackIcon`
- Disco 96×96, `rounded-full`, símbolo central:
  - `correct` → ✓ verde
  - `wrong` → ✗ vermelho
  - `timeout` → ⏱ cinza
- Fundo: `color-mix(in oklab, <cor> 18%, transparent)`.
- Halo: `box-shadow: 0 0 60px -10px <cor>`.
- Animação: `animate-pop` (400 ms cubic-bezier overshoot).

### 5.8 `CodeDisplay`
- Container `p-5 rounded-[18px] bg-surface border border-border`.
- Label CAPS `text-xs uppercase tracking-widest text-muted-foreground`.
- Código em `font-mono font-bold text-primary text-4xl` com `letter-spacing: 0.5rem`.
- Botão de copiar 48×48, `bg-surface-2`, ícone troca para ✓ verde por 2 s ao copiar.

---

## 6. Animações

Definidas em `@layer utilities` de `src/styles.css`.

| Classe | Duração | Easing | Uso |
|---|---|---|---|
| `animate-fade-in` | 300 ms | ease | Entrada suave de telas/blocos |
| `animate-slide-up` | 400 ms | ease | Itens de lista (com stagger via delay) |
| `animate-pop` | 400 ms | cubic-bezier(.2,.8,.3,1.2) | Feedback (acerto/erro), badges |
| `animate-pulse-dot` | 1.4 s loop | ease-in-out | Indicador online |
| `animate-shimmer` | 1.6 s loop | ease-in-out | Skeleton/carregando |
| `animate-bounce-soft` | 1.4 s loop | ease-in-out | Ênfase leve (CTAs ociosas) |
| `brain-confetti` | n/a | linear | Tela final (vitória) |

**Regras:**
- Nunca encadear mais de 2 animações simultâneas no mesmo elemento.
- Loops (`pulse-dot`, `shimmer`) só para estados *vivos* (online, carregando).
- Stagger em listas: `animationDelay = index * 80ms`.

---

## 7. Estados

| Estado | Tratamento |
|---|---|
| **Hover** | `brightness-110` (botões), `text-foreground` (links sutis) |
| **Active** | `scale-[0.99]` |
| **Focus** | `ring-1 ring-ring` (já default em inputs shadcn) |
| **Disabled** | `opacity-40 cursor-not-allowed`, sem hover |
| **Loading** | `animate-shimmer` em skeleton ou `animate-pulse-dot` em status |
| **Selecionado** | `bg-primary` + `text-primary-foreground` + sombra de marca |
| **Erro de validação** | borda `border-wrong`, mensagem `text-wrong` abaixo |

---

## 8. Padrões de tela

- **Container central:** `max-w-md mx-auto px-4 py-8` (mobile-first).
- **Header de tela:** `BrainLogo size="md"` no topo + título `text-2xl font-display`.
- **CTA fixo no rodapé:** `PrimaryButton` ocupa largura total; ações secundárias acima.
- **Listas de jogadores:** `flex flex-col gap-3`.
- **Tela de pergunta:** TimerBar topo → enunciado `text-xl` → grid 2×2 de alternativas (`gap-3`).
- **Tela de feedback:** `FeedbackIcon` centralizado + texto `text-2xl font-display` + score delta em `font-mono`.
- **Tela final:** confete (`brain-confetti`) + pódio (gold/silver/bronze) + CTA "Jogar de novo".

---

## 9. Checklist de revisão

Antes de fazer merge de qualquer UI nova, confirme:

- [ ] Nenhuma cor literal (`#...`, `rgb(...)`, `bg-white`, `text-black`) no componente.
- [ ] Todas as cores via token (`bg-primary`, `text-correct`, `var(--color-...)`).
- [ ] Tipografia usa `font-display` / `font-sans` / `font-mono` corretamente.
- [ ] Botões com altura 56px (primário/secundário) e raio 14px.
- [ ] Números em tempo real com `font-mono` + `tabular-nums`.
- [ ] Estados hover/active/disabled implementados.
- [ ] Animação ≤ 400 ms (exceto loops de status).
- [ ] Contraste verificado (foreground sobre background, primary-foreground sobre primary).
- [ ] Funciona em mobile (`max-w-md`, `px-4`).

---

_Última atualização: alinhado com `src/styles.css` e componentes em `src/components/brain/` da build atual._
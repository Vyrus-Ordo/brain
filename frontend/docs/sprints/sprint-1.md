# Sprint 1: Fundação & Design System (Part 1)

**Objetivo:** Estabelecer a base visual do projeto e os primeiros componentes fundamentais.

## 🛠 Atividades de Desenvolvimento (Prompts para IA)

### 1. Configuração de Estilos e Tailwind

- Implementar `src/styles.css` contendo:
  - Importação de Google Fonts (Syne, DM Sans, JetBrains Mono).
  - Variáveis `:root` usando `oklch` conforme o Design System.
  - Definição de `@layer utilities` para animações (`animate-fade-in`, `animate-slide-up`, `animate-pop`, etc.).
- Configurar `tailwind.config.js` mapeando os tokens semânticos (`bg-primary`, `text-correct`, `font-display`, etc.).

### 2. Componentes Atômicos

- Criar `src/components/brain/BrainLogo.tsx` (suporte a sizes sm, md, lg + glow).
- Criar `src/components/brain/PrimaryButton.tsx` (h-14, rounded-14, shadow primary, hover/active/disabled).
- Criar `src/components/brain/SecondaryButton.tsx` (h-14, rounded-14, border primary).
- Criar `src/components/brain/SegmentedControl.tsx` (estilo pílula, animação de seleção).

## ✅ Critérios de Aceite (Definição de Pronto)

- [X] O projeto roda sem erros de compilação.
- [X] Nenhuma cor literal (#hex/rgb) é usada nos componentes criados.
- [X] O logo exibe o glow correto via `text-shadow`.
- [X] Os botões possuem estados visuais de hover e active funcionando.
- [X] O SegmentedControl alterna entre opções com transição suave.

## 🧪 Testes Manuais Sugeridos

- Verificar se as fontes estão sendo carregadas corretamente (Syne no Logo).
- Testar a responsividade básica dos componentes em tela mobile.

# Sprint 3: Fluxo de Entrada

**Objetivo:** Implementar as primeiras telas funcionais que levam o usuário até o portão de entrada da sala.

## 🛠 Atividades de Desenvolvimento (Prompts para IA)

### 1. Tela 1 — Apelido (`/`)

- Implementar UI conforme seção "TELA 1" da spec.
- Adicionar validação de apelido (2-16 chars).
- Implementar animação de entrada (`fade-in` + `pop`).

### 2. Tela 2 — Início (`/inicio`)

- Implementar hub com opções "Criar sala" e "Entrar com código".
- Bloco de input de código com máscara/filtro (apenas letras, auto-uppercase).
- Navegação para as respectivas telas subsequentes.

### 3. Tela 3 — Configuração da Sala (`/criar`)

- Grid de temas com seleção visual (ícone + emoji).
- Seletores de perguntas e tempo via `SegmentedControl`.
- Botão "Criar sala" funcional (navegando para `/lobby` com config).

## ✅ Critérios de Aceite (Definição de Pronto)

- [X] O fluxo `Apelido -> Início -> Criar` funciona perfeitamente.
- [X] Input de código na Tela 2 não permite números ou caracteres especiais.
- [X] Cards de tema na Tela 3 têm feedback visual claro de seleção.
- [X] Todas as telas respeitam o `max-w-md mx-auto` para visual mobile.

## 🧪 Testes Manuais Sugeridos

- Tentar digitar apelidos inválidos (curtos/longos) e validar mensagem de erro.
- Testar o "revelar bloco de código" na Tela 2 ao clicar em "Entrar com código".

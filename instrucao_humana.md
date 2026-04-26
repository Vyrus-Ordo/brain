Viewed sprint-1.md:1-30

Para usar os prompts e garantir que a IA execute o trabalho corretamente, siga este fluxo de trabalho:

### 1. Copie as Instruções da Sprint

Abra o arquivo da sprint atual (ex: `sprint-1.md`) e localize a seção **"🛠 Atividades de Desenvolvimento"**. Você pode copiar o bloco inteiro de uma atividade ou fazer item por item se preferir ser mais cauteloso.

### 2. Cole no Chat da sua IA de Codificação

Cole o texto no chat (seja comigo, Cursor, Claude Code, v0, etc.) e adicione um comando simples no início.

**Exemplo para a Sprint 1:**
> "Com base no arquivo `spec-frontend.md` e `brain-design-system.md`, execute a seguinte atividade da Sprint 1: [COLE O CONTEÚDO DA ATIVIDADE AQUI]"

### 3. Use os Prompts Específicos de Tela

Para as **Telas (Sprints 3, 4 e 5)**, eu deixei blocos marcados como **"📌 PROMPT DE IA"** dentro do arquivo principal `frontend/docs/spec-frontend.md`. Esses são prompts "premium" otimizados para gerar a UI completa de uma vez.

1. Abra o `frontend/docs/spec-frontend.md`.
2. Procure pela tela que deseja criar (ex: `TELA 1 — Apelido`).
3. Copie todo o conteúdo do quadro `📌 PROMPT DE IA — TELA 1`.
4. Cole para a IA e peça: *"Implemente esta tela seguindo as instruções abaixo"*.

### 4. Valide com os Critérios de Aceite

Após a IA gerar o código, não avance imediatamente. Olhe a seção **"✅ Critérios de Aceite"** no arquivo da sprint e verifique se o código gerado atende a todos os pontos (especialmente a ausência de cores hexadecimais literais).

### 5. Seu Papel: Testes Manuais

A única parte que a IA não consegue fazer 100% por conta própria é sentir a "mão" da UI. Use a seção **"🧪 Testes Manuais Sugeridos"** para:

- Abrir o navegador e ver se a fonte Syne está bonita.
- Clicar nos botões e ver se a animação de `scale-[0.99]` parece natural.
- Redimensionar a janela para simular um celular.

---

**Dica de Ouro:** Se a IA começar a "inventar" estilos ou cores, responda:
> "Você está usando cores literais/hex. Lembre-se de usar apenas os tokens definidos em `styles.css` e no `brain-design-system.md`. Refatore o código para usar apenas classes Tailwind semânticas como `bg-primary` ou `text-foreground`."

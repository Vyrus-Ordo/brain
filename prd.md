# 🎮 GDD — Jogo de Perguntas Multiplayer (Mobile First)

## 1. Identificação do Jogo
- **Nome:** (definir)  
- **Gênero:** Trivia / Quiz  
- **Plataforma:** Mobile (Android / iOS / Web responsivo)  
- **Modo:** Multiplayer (3 a 8 jogadores simultâneos)

---

## 2. Objetivo do Jogador

> Responder corretamente ao maior número de perguntas para terminar a partida com a maior pontuação.

---

## 3. Loop Principal (Core Loop)

```text
1. Jogador entra na plataforma
2. Jogador escolhe tema(s)
3. Jogador entra em uma partida
4. Pergunta é exibida
5. Jogador seleciona uma resposta
6. Sistema valida resposta
7. Sistema atualiza pontuação
8. Ranking parcial é exibido
9. Próxima pergunta inicia
10. Repetir até fim da rodada
11. Ranking final exibido
```

---

## 4. Entidades do Jogo

### 4.1 Jogador
- **ID:** único  
- **Nome:**  
- **Pontuação:** inicia em 0  
- **Estado:** ativo | desconectado  

---

### 4.2 Pergunta
- **Texto:** string  
- **Tema:** categoria selecionada  
- **Respostas:** lista (máximo 3)  
- **Resposta correta:** índice  

---

### 4.3 Partida
- **Jogadores:** 2 a 8  
- **Estado:** lobby | em_andamento | finalizada  
- **Rodada atual:** número inteiro  
- **Total de perguntas:** (definir, ex: 10)

---

## 5. Mecânicas (Regras Explícitas)

### Resposta do Jogador
```text
Se jogador seleciona uma resposta:
    resposta é registrada
    jogador não pode alterar resposta
```

### Validação
```text
Se resposta == correta:
    jogador.pontuação += 1
Senão:
    pontuação não altera
```

### Tempo (opcional)
```text
Tempo máximo por pergunta = 10 segundos

Se jogador não responde:
    resposta = nula
    pontuação não altera
```

---

## 6. Sistema de Rodadas

```text
Para cada pergunta:
    exibir pergunta
    coletar respostas
    validar respostas
    atualizar pontuação
    exibir ranking parcial
```

---

## 7. Condições de Jogo

### Vitória
```text
Ao final de todas as perguntas:
    jogador com maior pontuação vence
```

### Empate
```text
Se múltiplos jogadores com mesma pontuação máxima:
    todos são declarados vencedores
```

---

## 8. Interface (UI/UX — Mobile First)

### Princípios
- Interface simples e limpa  
- Elementos grandes (touch-friendly)  
- Alto contraste  
- Baixa carga cognitiva  

### Tela de Pergunta
```text
Cada botão deve ocupar largura mínima de 80% da tela
Altura mínima: 48px (ideal: 56px+)
Espaçamento entre botões: mínimo 8px
Texto centralizado e legível
```

### Feedback
```text
Resposta correta → destaque verde
Resposta errada → destaque vermelho
```

### Ranking
```text
Após cada pergunta:
    exibir ranking ordenado por pontuação
    exibir por 3 a 5 segundos
    iniciar próxima pergunta automaticamente
```

---

## 9. Input do Jogador
- Toque em botão → seleciona resposta  
- Scroll (se necessário)  

---

## 10. Output (Feedback do Sistema)
- Destaque visual de acerto/erro  
- Atualização de pontuação  
- Ranking animado  

---

## 11. Estados do Jogo

```text
LOGIN
SELEÇÃO_DE_TEMA
LOBBY
EM_PERGUNTA
RESULTADO_RODADA
RANKING
FINAL
```

### Transições
```text
LOGIN → SELEÇÃO_DE_TEMA
SELEÇÃO_DE_TEMA → LOBBY
LOBBY → EM_PERGUNTA
EM_PERGUNTA → RESULTADO_RODADA
RESULTADO_RODADA → RANKING
RANKING → EM_PERGUNTA
RANKING → FINAL
```

---

## 12. Sistema de Temas
- História  
- Esportes  
- Tecnologia  
- Filmes  
- Conhecimentos Gerais  

---

## 13. Regras Globais
- Máximo de 3 respostas por pergunta  
- Apenas 1 correta  
- Jogador não pode responder duas vezes  
- Interface mobile-first  

---

## 14. Requisitos de UX
- Tempo de resposta < 1 segundo  
- Jogável com uma mão  
- Botões grandes e acessíveis  

---

# 📌 Resumo

Quiz multiplayer simples, rápido e otimizado para mobile, com foco em usabilidade e feedback imediato.
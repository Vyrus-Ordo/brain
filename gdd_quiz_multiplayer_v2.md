# 🎮 GDD — Jogo de Perguntas Multiplayer (Mobile First) v2.0

## 1. Identificação do Jogo
- **Nome:** (definir)
- **Gênero:** Trivia / Quiz
- **Plataforma:** Web responsivo (Mobile First) — Android / iOS via browser
- **Modo:** Multiplayer síncrono (3 a 8 jogadores simultâneos)
- **Stack:** React + Vite (Vercel) + Supabase (DB + Realtime)

---

## 2. Objetivo do Jogador

> Responder corretamente ao maior número de perguntas, dentro do tempo configurado, para terminar a partida com a maior pontuação.

---

## 3. Loop Principal (Core Loop)

```text
1. Jogador acessa a plataforma e informa um apelido temporário
2. Jogador cria uma sala (host) ou entra em uma sala via código de 6 letras
3. Host configura: tema, total de perguntas e tempo por pergunta
4. Host inicia a partida
5. Pergunta é exibida simultaneamente para todos os jogadores
6. Timer inicia (5s, 15s ou 30s — configurado pelo host)
7. Jogador seleciona uma resposta (irreversível)
8. Ao fim do timer (ou quando todos responderam): sistema valida respostas
9. Feedback visual de acerto/erro exibido para cada jogador
10. Pontuação atualizada
11. Ranking parcial exibido por 3 a 5 segundos
12. Próxima pergunta inicia automaticamente
13. Repetir até fim das perguntas disponíveis ou do total configurado
14. Ranking final exibido
```

---

## 4. Entidades do Jogo

### 4.1 Jogador
| Campo       | Tipo    | Descrição                          |
|-------------|---------|-------------------------------------|
| id          | uuid    | Gerado automaticamente na sessão    |
| apelido     | string  | Informado pelo jogador no login     |
| pontuação   | integer | Inicia em 0, mínimo 0               |
| estado      | enum    | ativo \| desconectado               |
| sala_id     | uuid    | Referência à sala em que está       |

---

### 4.2 Pergunta
| Campo            | Tipo    | Descrição                          |
|------------------|---------|-------------------------------------|
| id               | uuid    | Identificador único                 |
| texto            | string  | Enunciado da pergunta               |
| tema             | enum    | Categoria (ver seção 12)            |
| respostas        | array   | Lista com exatamente 3 opções       |
| índice_correto   | integer | 0, 1 ou 2                           |

---

### 4.3 Sala (Partida)
| Campo              | Tipo    | Descrição                                      |
|--------------------|---------|------------------------------------------------|
| id                 | uuid    | Identificador único                            |
| código             | string  | 6 letras maiúsculas, gerado ao criar a sala    |
| host_id            | uuid    | Jogador que criou a sala                       |
| tema               | enum    | Definido pelo host na criação                  |
| total_perguntas    | integer | Definido pelo host (mínimo 5, máximo 20)       |
| tempo_por_pergunta | integer | 5, 15 ou 30 segundos — definido pelo host      |
| estado             | enum    | lobby \| em_andamento \| finalizada            |
| rodada_atual       | integer | Índice da pergunta atual (inicia em 1)         |
| jogadores          | array   | Lista de jogadores na sala (3 a 8)             |

---

## 5. Mecânicas (Regras Explícitas)

### 5.1 Criação de Sala
```text
Host informa:
    apelido
    tema (único)
    total de perguntas (5 a 20)
    tempo por pergunta (5s | 15s | 30s)

Sistema gera:
    código de 6 letras maiúsculas único
    sala no estado: lobby
```

### 5.2 Entrada na Sala
```text
Jogador informa:
    apelido
    código de 6 letras

Se código válido e sala em estado lobby e jogadores < 8:
    jogador entra na sala
Senão:
    exibir mensagem de erro adequada
```

### 5.3 Início da Partida
```text
Apenas o host pode iniciar a partida
Condição mínima: 3 jogadores na sala

Se jogadores < 3:
    botão de iniciar desabilitado
    exibir: "Aguardando jogadores (mínimo 3)"
```

### 5.4 Sincronização de Perguntas
```text
Todos os jogadores recebem a mesma pergunta simultaneamente via Supabase Realtime
Timer inicia no mesmo momento para todos
```

### 5.5 Resposta do Jogador
```text
Se jogador seleciona uma resposta dentro do tempo:
    resposta é registrada
    jogador não pode alterar resposta
    botão de "aguardar" exibido até fim do timer ou todos responderem

Se timer esgota sem resposta:
    resposta = nula
    penalidade aplicada (ver 5.6)
```

### 5.6 Validação e Pontuação
```text
Se resposta == correta:
    jogador.pontuação += 1

Se resposta == incorreta:
    pontuação não altera

Se resposta == nula (não respondeu no tempo):
    jogador.pontuação -= 1
    pontuação mínima = 0 (não vai abaixo de zero)
```

### 5.7 Avanço de Rodada
```text
Timer esgota OU todos os jogadores responderam:
    sistema valida todas as respostas
    exibe feedback individual (acerto/erro/tempo esgotado)
    atualiza pontuações
    exibe ranking parcial por 3 a 5 segundos
    inicia próxima pergunta automaticamente

Se banco tiver menos perguntas do que o total configurado:
    partida encerra quando perguntas disponíveis se esgotam
    ranking final é exibido normalmente
```

---

## 6. Condições de Jogo

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

### Desconexão
```text
Se jogador desconectar durante a partida:
    estado do jogador = desconectado
    jogador não recebe pontos nas rodadas perdidas
    partida continua normalmente para os demais
```

---

## 7. Estados do Jogo

```text
APELIDO         → jogador informa nome temporário
INÍCIO          → escolha: criar sala | entrar com código
CONFIGURAÇÃO    → host define tema, total de perguntas, timer (apenas host vê)
LOBBY           → aguardando jogadores; host vê botão de iniciar
EM_PERGUNTA     → pergunta exibida, timer ativo
RESULTADO_RODADA→ feedback individual de acerto/erro
RANKING         → ranking parcial ordenado por pontuação
FINAL           → ranking final, opção de jogar novamente
```

### Transições
```text
APELIDO → INÍCIO
INÍCIO → CONFIGURAÇÃO (se criar sala)
INÍCIO → LOBBY (se entrar com código)
CONFIGURAÇÃO → LOBBY
LOBBY → EM_PERGUNTA (host inicia)
EM_PERGUNTA → RESULTADO_RODADA
RESULTADO_RODADA → RANKING
RANKING → EM_PERGUNTA (se há próxima pergunta)
RANKING → FINAL (se perguntas esgotadas)
```

---

## 8. Interface (UI/UX — Mobile First)

### Princípios
- Interface simples e limpa
- Elementos grandes (touch-friendly)
- Alto contraste
- Baixa carga cognitiva
- Jogável com uma mão

### Tela de Pergunta
```text
Timer: exibido no topo com contagem regressiva visual (barra ou número)
Pergunta: texto centralizado, fonte legível, área superior da tela
Respostas: 3 botões empilhados verticalmente
    - largura mínima: 80% da tela
    - altura mínima: 56px
    - espaçamento entre botões: mínimo 8px
    - texto centralizado
```

### Feedback Visual
```text
Resposta correta selecionada  → botão destaque verde
Resposta errada selecionada   → botão destaque vermelho + botão correto em verde
Timer esgotado sem resposta   → todos os botões em cinza + botão correto em verde
```

### Ranking Parcial
```text
Lista ordenada por pontuação (1º ao último)
Exibir: posição, apelido, pontuação
Destacar posição do jogador local
Exibir por 3 a 5 segundos antes da próxima pergunta
```

---

## 9. Sistema de Temas

| Tema                  | Identificador        |
|-----------------------|----------------------|
| História              | historia             |
| Esportes              | esportes             |
| Tecnologia            | tecnologia           |
| Filmes                | filmes               |
| Conhecimentos Gerais  | conhecimentos_gerais |

---

## 10. Regras Globais
- Exatamente 3 respostas por pergunta, apenas 1 correta
- Jogador não pode responder duas vezes na mesma rodada
- Pontuação mínima: 0 (nunca negativa)
- Partida requer mínimo de 3 jogadores para iniciar
- Máximo de 8 jogadores por sala
- Tema único por partida, definido pelo host
- Total de perguntas: 5 a 20, definido pelo host
- Timer por pergunta: 5s, 15s ou 30s, definido pelo host
- Se banco esgotar perguntas antes do total configurado, partida encerra normalmente

---

## 11. Banco de Dados (Supabase)

### Tabelas necessárias

```sql
-- Salas
salas (
  id uuid PRIMARY KEY,
  codigo char(6) UNIQUE,
  host_id uuid,
  tema text,
  total_perguntas integer,
  tempo_por_pergunta integer,
  estado text, -- lobby | em_andamento | finalizada
  rodada_atual integer DEFAULT 1,
  criado_em timestamp
)

-- Jogadores (sessão temporária)
jogadores (
  id uuid PRIMARY KEY,
  apelido text,
  sala_id uuid REFERENCES salas(id),
  pontuacao integer DEFAULT 0,
  estado text -- ativo | desconectado
)

-- Perguntas
perguntas (
  id uuid PRIMARY KEY,
  texto text,
  tema text,
  respostas jsonb, -- array de 3 strings
  indice_correto integer -- 0, 1 ou 2
)

-- Respostas dos jogadores por rodada
respostas_rodada (
  id uuid PRIMARY KEY,
  sala_id uuid REFERENCES salas(id),
  jogador_id uuid REFERENCES jogadores(id),
  pergunta_id uuid REFERENCES perguntas(id),
  rodada integer,
  resposta_indice integer, -- null se não respondeu
  correta boolean,
  respondido_em timestamp
)
```

### Realtime
```text
Canal por sala: sala:{codigo}
Eventos:
  - jogador_entrou
  - partida_iniciada
  - nova_pergunta
  - todos_responderam
  - ranking_atualizado
  - partida_finalizada
```

---

## 12. Requisitos de Performance
- Tempo de resposta da UI: < 1 segundo
- Sincronização via Supabase Realtime (WebSockets)
- Sem polling — eventos em tempo real para todas as transições de estado

---

# 📌 Resumo

Quiz multiplayer **síncrono**, com sala criada por código de 6 letras. Host define tema, quantidade de perguntas (5–20) e timer por pergunta (5s, 15s ou 30s). Pontuação por acerto (+1), penalidade por não responder (−1, mínimo 0). Stack: React + Vite no Vercel, Supabase para banco e realtime. Autenticação inicial via apelido temporário.

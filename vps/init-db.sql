-- ============================================================
-- Brain App — Schema completo + Seed
-- Execute como superuser no banco 'brain':
--   docker exec -i postgres psql -U postgres -d brain < vps/init-db.sql
-- ============================================================

-- Tabelas
CREATE TABLE IF NOT EXISTS salas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo          TEXT NOT NULL UNIQUE,
  tema            TEXT NOT NULL
                    CHECK (tema IN ('historia','esportes','tecnologia','filmes','geral')),
  total_perguntas INT  NOT NULL DEFAULT 10,
  timer_segundos  INT  NOT NULL DEFAULT 15
                    CHECK (timer_segundos IN (5, 15, 30)),
  estado          TEXT NOT NULL DEFAULT 'lobby'
                    CHECK (estado IN ('lobby','em_andamento','finalizada')),
  host_id         TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jogadores (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sala_id    UUID REFERENCES salas(id) ON DELETE CASCADE,
  player_id  TEXT NOT NULL,
  apelido    TEXT NOT NULL,
  pontuacao  INT  NOT NULL DEFAULT 0,
  is_host    BOOLEAN NOT NULL DEFAULT false,
  joined_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (sala_id, player_id)
);

CREATE TABLE IF NOT EXISTS perguntas (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tema           TEXT NOT NULL
                   CHECK (tema IN ('historia','esportes','tecnologia','filmes','geral')),
  texto          TEXT NOT NULL,
  opcoes         JSONB NOT NULL,
  indice_correto INT  NOT NULL
                   CHECK (indice_correto BETWEEN 0 AND 2)
);

CREATE TABLE IF NOT EXISTS respostas_rodada (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sala_id        UUID REFERENCES salas(id)     ON DELETE CASCADE,
  player_id      TEXT NOT NULL,
  pergunta_id    UUID REFERENCES perguntas(id) ON DELETE CASCADE,
  rodada         INT  NOT NULL,
  resposta_index INT,
  is_correct     BOOLEAN,
  respondido_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (sala_id, player_id, rodada)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_salas_codigo         ON salas(codigo);
CREATE INDEX IF NOT EXISTS idx_jogadores_sala        ON jogadores(sala_id);
CREATE INDEX IF NOT EXISTS idx_respostas_sala_rodada ON respostas_rodada(sala_id, rodada);
CREATE INDEX IF NOT EXISTS idx_perguntas_tema        ON perguntas(tema);

-- Trigger: calcula is_correct automaticamente no INSERT de respostas_rodada
CREATE OR REPLACE FUNCTION fn_compute_is_correct()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_indice INT;
BEGIN
  IF NEW.resposta_index IS NULL THEN
    NEW.is_correct := false;
    RETURN NEW;
  END IF;
  SELECT indice_correto INTO v_indice FROM perguntas WHERE id = NEW.pergunta_id;
  NEW.is_correct := (NEW.resposta_index = v_indice);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_compute_is_correct ON respostas_rodada;
CREATE TRIGGER trg_compute_is_correct
  BEFORE INSERT ON respostas_rodada
  FOR EACH ROW EXECUTE FUNCTION fn_compute_is_correct();

-- ============================================================
-- Seed: 50 perguntas — 10 por tema
-- ============================================================
INSERT INTO perguntas (tema, texto, opcoes, indice_correto) VALUES

('historia','Em que ano o Brasil declarou independência de Portugal?','["1820","1822","1825"]',1),
('historia','Qual foi o nome da operação aliada no Dia D, em junho de 1944?','["Operação Tocha","Operação Netuno","Operação Overlord"]',2),
('historia','Quem foi o primeiro presidente dos Estados Unidos?','["John Adams","Thomas Jefferson","George Washington"]',2),
('historia','Em que século ocorreu a Revolução Francesa?','["Século XVII","Século XVIII","Século XIX"]',1),
('historia','Qual imperador romano incendiou Roma, segundo a lenda?','["Calígula","Nero","Adriano"]',1),
('historia','Qual civilização construiu Machu Picchu?','["Astecas","Maias","Incas"]',2),
('historia','Em que ano caiu o Muro de Berlim?','["1987","1989","1991"]',1),
('historia','Quem liderou a Revolução Russa de 1917?','["Stalin","Trotsky","Lenin"]',2),
('historia','Qual país foi o primeiro a conceder às mulheres o direito de votar?','["Austrália","Nova Zelândia","Finlândia"]',1),
('historia','Qual foi a duração aproximada da Segunda Guerra Mundial?','["4 anos","6 anos","8 anos"]',1),

('esportes','Qual país sediou a Copa do Mundo de 2014?','["Argentina","Brasil","África do Sul"]',1),
('esportes','Quantos jogadores compõem um time de basquete em quadra?','["4","5","6"]',1),
('esportes','Em que esporte Usain Bolt é campeão olímpico?','["Natação","Atletismo","Ciclismo"]',1),
('esportes','Qual clube tem mais títulos da Liga dos Campeões da UEFA?','["Barcelona","Real Madrid","Bayern de Munique"]',1),
('esportes','Quantos sets são disputados em uma partida de tênis do Grand Slam masculino?','["3","5","7"]',1),
('esportes','Qual é o esporte nacional do Japão?','["Judô","Sumô","Karatê"]',1),
('esportes','Qual jogador marcou o "Gol do Século" na Copa de 1986?','["Pelé","Maradona","Zidane"]',1),
('esportes','Em que distância é disputada uma maratona?','["42,195 km","40 km","45 km"]',0),
('esportes','Qual país ganhou mais medalhas de ouro nas Olimpíadas de Tóquio 2020?','["China","EUA","Grã-Bretanha"]',1),
('esportes','Quantos jogadores de cada time ficam em campo no futebol?','["10","11","12"]',1),

('tecnologia','Qual linguagem de programação foi criada pela Mozilla?','["Go","Rust","Kotlin"]',1),
('tecnologia','O que significa a sigla HTTP?','["HyperText Transfer Protocol","High Transfer Text Protocol","Hyper Transfer Text Procedure"]',0),
('tecnologia','Qual empresa criou o sistema operacional Android?','["Apple","Microsoft","Google"]',2),
('tecnologia','Em que ano foi lançado o primeiro iPhone?','["2005","2007","2009"]',1),
('tecnologia','Qual é o maior número representável com 8 bits sem sinal?','["127","255","511"]',1),
('tecnologia','Qual protocolo é usado para envio de e-mails?','["FTP","SMTP","SSH"]',1),
('tecnologia','Quem é considerado o pai da computação moderna?','["Alan Turing","John von Neumann","Linus Torvalds"]',0),
('tecnologia','O que é um algoritmo de "hash"?','["Função que comprime arquivos","Função que mapeia dados para valor fixo","Protocolo de rede"]',1),
('tecnologia','Qual linguagem é tipicamente usada para estilizar páginas web?','["HTML","CSS","JavaScript"]',1),
('tecnologia','Qual empresa desenvolveu o framework React?','["Google","Microsoft","Meta"]',2),

('filmes','Quem dirigiu "O Poderoso Chefão" (1972)?','["Martin Scorsese","Francis Ford Coppola","Steven Spielberg"]',1),
('filmes','Qual filme ganhou o Oscar de Melhor Filme em 1994?','["Pulp Fiction","Forrest Gump","O Rei Leão"]',1),
('filmes','Em "Matrix" (1999), Neo toma qual pílula para conhecer a verdade?','["Azul","Branca","Vermelha"]',2),
('filmes','Qual ator interpreta o Homem de Ferro no MCU?','["Chris Evans","Robert Downey Jr.","Chris Hemsworth"]',1),
('filmes','Em que país é ambientado o filme "Parasita" (2019)?','["China","Japão","Coreia do Sul"]',2),
('filmes','Qual é o filme de animação mais rentável da história?','["Frozen","O Rei Leão (2019)","Incredibles 2"]',1),
('filmes','Quem escreveu o livro base de "O Senhor dos Anéis"?','["C.S. Lewis","J.R.R. Tolkien","J.K. Rowling"]',1),
('filmes','Qual filme tem a famosa frase "Eu vejo pessoas mortas"?','["O Exorcista","O Sexto Sentido","Psicose"]',1),
('filmes','Quantos filmes compõem a trilogia original de "Star Wars" (Episódios IV-VI)?','["2","3","4"]',1),
('filmes','Em "Titanic" (1997), qual ator interpreta Jack Dawson?','["Brad Pitt","Leonardo DiCaprio","Tom Cruise"]',1),

('geral','Qual é o maior oceano do mundo?','["Atlântico","Índico","Pacífico"]',2),
('geral','Quantos continentes existem na Terra?','["5","6","7"]',2),
('geral','Qual é o elemento químico mais abundante no universo?','["Hélio","Hidrogênio","Oxigênio"]',1),
('geral','Qual é o maior planeta do sistema solar?','["Saturno","Júpiter","Netuno"]',1),
('geral','Em que país fica a Torre Eiffel?','["Bélgica","Itália","França"]',2),
('geral','Qual é o idioma mais falado no mundo (nativos + fluentes)?','["Espanhol","Mandarim","Inglês"]',2),
('geral','Quantos ossos tem o corpo humano adulto?','["196","206","216"]',1),
('geral','Qual é o animal terrestre mais rápido?','["Leão","Cheetah","Gazela"]',1),
('geral','Qual é a capital da Austrália?','["Sydney","Melbourne","Camberra"]',2),
('geral','Quantas cores tem o arco-íris?','["5","6","7"]',2);

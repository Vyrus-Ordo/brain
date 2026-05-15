import { Router, Request, Response } from 'express';
import { Server } from 'socket.io';
import { db } from '../db';

export function salasRouter(io: Server): Router {
  const router = Router();

  // POST /api/salas — criar sala
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { codigo, tema, total_perguntas, timer_segundos, host_id } = req.body;
      const { rows } = await db.query(
        `INSERT INTO salas (codigo, tema, total_perguntas, timer_segundos, host_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [codigo, tema, total_perguntas, timer_segundos, host_id],
      );
      res.status(201).json(rows[0]);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // GET /api/salas/:codigo — buscar sala pelo código curto
  router.get('/:codigo', async (req: Request, res: Response) => {
    try {
      const { rows } = await db.query('SELECT * FROM salas WHERE codigo = $1', [
        req.params.codigo.toUpperCase(),
      ]);
      if (!rows.length) return res.status(404).json({ error: 'Sala não encontrada' });
      res.json(rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PATCH /api/salas/:id/estado — atualizar estado da sala
  router.patch('/:id/estado', async (req: Request, res: Response) => {
    try {
      const { estado } = req.body;
      const { rows } = await db.query(
        'UPDATE salas SET estado = $1 WHERE id = $2 RETURNING *',
        [estado, req.params.id],
      );
      if (!rows.length) return res.status(404).json({ error: 'Sala não encontrada' });
      const sala = rows[0];
      io.to(sala.codigo).emit('sala:atualizada', sala);
      res.json(sala);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/salas/:id/jogadores — upsert jogador
  router.post('/:id/jogadores', async (req: Request, res: Response) => {
    try {
      const { player_id, apelido, is_host } = req.body;
      await db.query(
        `INSERT INTO jogadores (sala_id, player_id, apelido, is_host)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (sala_id, player_id) DO UPDATE SET apelido = EXCLUDED.apelido`,
        [req.params.id, player_id, apelido, is_host ?? false],
      );
      const { rows: players } = await db.query(
        'SELECT * FROM jogadores WHERE sala_id = $1 ORDER BY joined_at ASC',
        [req.params.id],
      );
      const { rows: salas } = await db.query('SELECT codigo FROM salas WHERE id = $1', [
        req.params.id,
      ]);
      if (salas.length) {
        io.to(salas[0].codigo).emit('jogadores:atualizado', players);
      }
      res.status(201).json(players);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // GET /api/salas/:id/jogadores — listar jogadores
  router.get('/:id/jogadores', async (req: Request, res: Response) => {
    try {
      const { rows } = await db.query(
        'SELECT * FROM jogadores WHERE sala_id = $1 ORDER BY joined_at ASC',
        [req.params.id],
      );
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/salas/:id/ranking — jogadores ordenados por pontuação
  router.get('/:id/ranking', async (req: Request, res: Response) => {
    try {
      const { rows } = await db.query(
        'SELECT * FROM jogadores WHERE sala_id = $1 ORDER BY pontuacao DESC',
        [req.params.id],
      );
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/salas/:id/respostas — submeter resposta
  router.post('/:id/respostas', async (req: Request, res: Response) => {
    try {
      const { player_id, pergunta_id, rodada, resposta_index } = req.body;
      const { rows } = await db.query(
        `INSERT INTO respostas_rodada (sala_id, player_id, pergunta_id, rodada, resposta_index)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (sala_id, player_id, rodada) DO NOTHING
         RETURNING is_correct`,
        [req.params.id, player_id, pergunta_id, rodada, resposta_index ?? null],
      );

      if (!rows.length) {
        return res.json({ is_correct: false });
      }

      const { is_correct } = rows[0];

      if (is_correct) {
        await db.query(
          'UPDATE jogadores SET pontuacao = pontuacao + 1 WHERE sala_id = $1 AND player_id = $2',
          [req.params.id, player_id],
        );
        const { rows: players } = await db.query(
          'SELECT * FROM jogadores WHERE sala_id = $1 ORDER BY joined_at ASC',
          [req.params.id],
        );
        const { rows: salas } = await db.query('SELECT codigo FROM salas WHERE id = $1', [
          req.params.id,
        ]);
        if (salas.length) {
          io.to(salas[0].codigo).emit('jogadores:atualizado', players);
        }
      }

      res.json({ is_correct });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // GET /api/salas/:id/respostas/count?rodada= — contar respostas de uma rodada
  router.get('/:id/respostas/count', async (req: Request, res: Response) => {
    try {
      const rodada = parseInt(req.query.rodada as string);
      if (isNaN(rodada)) return res.status(400).json({ error: 'rodada inválida' });
      const { rows } = await db.query(
        'SELECT COUNT(*) as count FROM respostas_rodada WHERE sala_id = $1 AND rodada = $2',
        [req.params.id, rodada],
      );
      res.json({ count: parseInt(rows[0].count) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

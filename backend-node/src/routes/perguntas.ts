import { Router, Request, Response } from 'express';
import { db } from '../db';

export const perguntasRouter = Router();

// GET /api/perguntas?tema=&limit=
perguntasRouter.get('/', async (req: Request, res: Response) => {
  try {
    const tema = req.query.tema as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    if (!tema) return res.status(400).json({ error: 'tema é obrigatório' });

    const { rows } = await db.query(
      'SELECT id, texto, opcoes, tema FROM perguntas WHERE tema = $1 ORDER BY random() LIMIT $2',
      [tema, limit],
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/perguntas/:id/correta
perguntasRouter.get('/:id/correta', async (req: Request, res: Response) => {
  try {
    const { rows } = await db.query(
      'SELECT indice_correto FROM perguntas WHERE id = $1',
      [req.params.id],
    );
    if (!rows.length) return res.status(404).json({ error: 'Pergunta não encontrada' });
    res.json({ indice_correto: rows[0].indice_correto });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

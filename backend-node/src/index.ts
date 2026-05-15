import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { salasRouter } from './routes/salas';
import { perguntasRouter } from './routes/perguntas';
import { setupSocket } from './socket';

const app = express();
const httpServer = createServer(app);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH'],
  },
});

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.use('/api/salas', salasRouter(io));
app.use('/api/perguntas', perguntasRouter);
app.get('/health', (_req, res) => res.json({ ok: true }));

setupSocket(io);

const PORT = process.env.PORT || 3100;
httpServer.listen(PORT, () => {
  console.log(`Brain backend listening on :${PORT}`);
});

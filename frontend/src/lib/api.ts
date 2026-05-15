const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro na requisição');
  return data as T;
}

export const api = {
  // Salas
  createSala: (body: object) => request<any>('POST', '/salas', body),
  getSala: (codigo: string) => request<any>('GET', `/salas/${encodeURIComponent(codigo)}`),
  updateEstado: (id: string, estado: string) =>
    request<any>('PATCH', `/salas/${id}/estado`, { estado }),

  // Jogadores
  upsertJogador: (salaId: string, body: object) =>
    request<any[]>('POST', `/salas/${salaId}/jogadores`, body),
  getJogadores: (salaId: string) => request<any[]>('GET', `/salas/${salaId}/jogadores`),

  // Ranking
  getRanking: (salaId: string) => request<any[]>('GET', `/salas/${salaId}/ranking`),

  // Respostas
  submitResposta: (salaId: string, body: object) =>
    request<{ is_correct: boolean }>('POST', `/salas/${salaId}/respostas`, body),
  countRespostas: (salaId: string, rodada: number) =>
    request<{ count: number }>('GET', `/salas/${salaId}/respostas/count?rodada=${rodada}`),

  // Perguntas
  getPerguntas: (tema: string, limit: number) =>
    request<any[]>('GET', `/perguntas?tema=${encodeURIComponent(tema)}&limit=${limit}`),
  getCorrectAnswer: (perguntaId: string) =>
    request<{ indice_correto: number }>('GET', `/perguntas/${perguntaId}/correta`),
};

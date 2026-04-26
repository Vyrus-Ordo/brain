import { corsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'
import { createServiceClient } from '../_shared/supabase.ts'

const MIN_PLAYERS = 3
const ROUND_DURATION_MS = 10_000  // 10 segundos de resposta
const RANKING_DURATION_MS = 4_000 // 4 segundos de exibição do ranking

// ----------------------------------------------------------------
// Helpers de broadcast
// ----------------------------------------------------------------

async function broadcastEvent(matchId: string, payload: Record<string, unknown>) {
  const service = createServiceClient()
  const channel = service.channel(`match:${matchId}`)
  await channel.subscribe()
  await channel.send({
    type: 'broadcast',
    event: payload.event as string,
    payload,
  })
  await service.removeChannel(channel)
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ----------------------------------------------------------------
// Loop principal da partida (roda em background via waitUntil)
// ----------------------------------------------------------------

async function runMatchLoop(matchId: string) {
  const service = createServiceClient()

  // Buscar dados da partida
  const { data: match, error: matchErr } = await service
    .from('matches')
    .select('total_rounds, question_ids')
    .eq('id', matchId)
    .single()

  if (matchErr || !match) return

  const { total_rounds, question_ids } = match as {
    total_rounds: number
    question_ids: string[]
  }

  for (let round = 1; round <= total_rounds; round++) {
    const questionId = question_ids[round - 1]

    // Buscar pergunta SEM correct_index (service_role ignora RLS de coluna,
    // mas selecionamos explicitamente apenas os campos seguros para broadcast)
    const { data: question } = await service
      .from('questions')
      .select('id, text, options')
      .eq('id', questionId)
      .single()

    if (!question) continue

    // Atualizar rodada atual e timer no banco
    await service
      .from('matches')
      .update({ current_round: round, round_started_at: new Date().toISOString() })
      .eq('id', matchId)

    // Broadcast: round_started
    await broadcastEvent(matchId, {
      event: 'round_started',
      round,
      total_rounds,
      question: {
        id: question.id,
        text: question.text,
        options: question.options,
      },
      started_at: new Date().toISOString(),
      duration_seconds: ROUND_DURATION_MS / 1000,
    })

    // Aguardar janela de respostas
    await delay(ROUND_DURATION_MS)

    // Buscar correct_index (service_role tem acesso total)
    const { data: fullQuestion } = await service
      .from('questions')
      .select('correct_index')
      .eq('id', questionId)
      .single()

    const correctIndex = fullQuestion?.correct_index ?? 0

    // Buscar scores atualizados
    const { data: scores } = await service
      .from('match_players')
      .select('player_id, score, players!inner(name)')
      .eq('match_id', matchId)
      .order('score', { ascending: false })

    const scoreList = (scores ?? []).map((s: { player_id: string; score: number; players: { name: string } }) => ({
      player_id: s.player_id,
      name: s.players.name,
      score: s.score,
    }))

    // Broadcast: round_ended
    await broadcastEvent(matchId, {
      event: 'round_ended',
      round,
      correct_index: correctIndex,
      scores: scoreList,
    })

    if (round < total_rounds) {
      // Aguardar exibição do ranking antes da próxima rodada
      await delay(RANKING_DURATION_MS)
    }
  }

  // Finalizar a partida
  await service
    .from('matches')
    .update({ status: 'finished' })
    .eq('id', matchId)

  // Buscar ranking final
  const { data: finalScores } = await service
    .from('match_players')
    .select('player_id, score, players!inner(name)')
    .eq('match_id', matchId)
    .order('score', { ascending: false })

  const maxScore = finalScores?.[0]?.score ?? 0
  const finalList = (finalScores ?? []).map((s: { player_id: string; score: number; players: { name: string } }) => ({
    player_id: s.player_id,
    name: s.players.name,
    score: s.score,
    winner: s.score === maxScore && maxScore > 0,
  }))

  await broadcastEvent(matchId, {
    event: 'match_finished',
    final_scores: finalList,
  })
}

// ----------------------------------------------------------------
// Handler principal
// ----------------------------------------------------------------

Deno.serve(async (req: Request) => {
  const preflight = handleCorsPreFlight(req)
  if (preflight) return preflight

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const service = createServiceClient()

  const { data: userData, error: userError } = await service.auth.getUser(
    authHeader.replace('Bearer ', '')
  )
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const playerId = userData.user.id

  const { match_id } = (await req.json()) as { match_id: string }
  if (!match_id) {
    return new Response(JSON.stringify({ error: 'match_id is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Verificar que o caller é participante da partida
  const { data: participation } = await service
    .from('match_players')
    .select('player_id')
    .eq('match_id', match_id)
    .eq('player_id', playerId)
    .maybeSingle()

  if (!participation) {
    return new Response(JSON.stringify({ error: 'Player is not in this match' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Buscar estado atual da partida
  const { data: match, error: matchErr } = await service
    .from('matches')
    .select('status')
    .eq('id', match_id)
    .single()

  if (matchErr || !match) {
    return new Response(JSON.stringify({ error: 'Match not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (match.status !== 'lobby') {
    return new Response(JSON.stringify({ error: `Match is already ${match.status}` }), {
      status: 409,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Contar jogadores no lobby
  const { count } = await service
    .from('match_players')
    .select('player_id', { count: 'exact', head: true })
    .eq('match_id', match_id)

  if ((count ?? 0) < MIN_PLAYERS) {
    return new Response(
      JSON.stringify({ error: `Need at least ${MIN_PLAYERS} players to start (current: ${count})` }),
      { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Marcar partida como in_progress
  const { error: updateErr } = await service
    .from('matches')
    .update({ status: 'in_progress', current_round: 1, round_started_at: new Date().toISOString() })
    .eq('id', match_id)

  if (updateErr) {
    return new Response(JSON.stringify({ error: 'Failed to start match', detail: updateErr.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Iniciar loop em background (não bloqueia a resposta HTTP)
  // @ts-ignore EdgeRuntime está disponível no Supabase Edge Functions
  EdgeRuntime.waitUntil(runMatchLoop(match_id))

  return new Response(
    JSON.stringify({ status: 'started' }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})

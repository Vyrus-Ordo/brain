import { corsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'
import { createServiceClient } from '../_shared/supabase.ts'

// ----------------------------------------------------------------
// Endpoint interno chamado pelo loop em start-match.
// Pode ser chamado por um Cron Job no futuro para maior robustez.
// POST /functions/v1/advance-round
// Body: { match_id: string, round: number }
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

const RANKING_DURATION_MS = 4_000

Deno.serve(async (req: Request) => {
  const preflight = handleCorsPreFlight(req)
  if (preflight) return preflight

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Verificar secret interno para evitar chamadas não autorizadas
  const authHeader = req.headers.get('Authorization')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!authHeader || !authHeader.includes(serviceKey ?? '')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { match_id, round } = (await req.json()) as { match_id: string; round: number }

  if (!match_id || round === undefined) {
    return new Response(JSON.stringify({ error: 'match_id and round are required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const service = createServiceClient()

  // Buscar dados da partida
  const { data: match, error: matchErr } = await service
    .from('matches')
    .select('status, total_rounds, question_ids')
    .eq('id', match_id)
    .single()

  if (matchErr || !match) {
    return new Response(JSON.stringify({ error: 'Match not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (match.status !== 'in_progress') {
    return new Response(JSON.stringify({ error: `Match is not in progress (${match.status})` }), {
      status: 409,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { total_rounds, question_ids } = match as {
    total_rounds: number
    question_ids: string[]
  }

  const questionId = question_ids[round - 1]

  // Buscar correct_index
  const { data: question } = await service
    .from('questions')
    .select('correct_index')
    .eq('id', questionId)
    .single()

  const correctIndex = question?.correct_index ?? 0

  // Buscar scores atualizados
  const { data: scores } = await service
    .from('match_players')
    .select('player_id, score, players!inner(name)')
    .eq('match_id', match_id)
    .order('score', { ascending: false })

  const scoreList = (scores ?? []).map((s: { player_id: string; score: number; players: { name: string } }) => ({
    player_id: s.player_id,
    name: s.players.name,
    score: s.score,
  }))

  // Broadcast: round_ended
  await broadcastEvent(match_id, {
    event: 'round_ended',
    round,
    correct_index: correctIndex,
    scores: scoreList,
  })

  if (round < total_rounds) {
    // Aguardar ranking e iniciar próxima rodada
    await delay(RANKING_DURATION_MS)

    const nextRound = round + 1
    const nextQuestionId = question_ids[nextRound - 1]

    const { data: nextQuestion } = await service
      .from('questions')
      .select('id, text, options')
      .eq('id', nextQuestionId)
      .single()

    await service
      .from('matches')
      .update({ current_round: nextRound, round_started_at: new Date().toISOString() })
      .eq('id', match_id)

    await broadcastEvent(match_id, {
      event: 'round_started',
      round: nextRound,
      total_rounds,
      question: {
        id: nextQuestion?.id,
        text: nextQuestion?.text,
        options: nextQuestion?.options,
      },
      started_at: new Date().toISOString(),
      duration_seconds: 10,
    })

    return new Response(
      JSON.stringify({ status: 'next_round_started', round: nextRound }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } else {
    // Última rodada — finalizar a partida
    await service
      .from('matches')
      .update({ status: 'finished' })
      .eq('id', match_id)

    const { data: finalScores } = await service
      .from('match_players')
      .select('player_id, score, players!inner(name)')
      .eq('match_id', match_id)
      .order('score', { ascending: false })

    const maxScore = finalScores?.[0]?.score ?? 0
    const finalList = (finalScores ?? []).map((s: { player_id: string; score: number; players: { name: string } }) => ({
      player_id: s.player_id,
      name: s.players.name,
      score: s.score,
      winner: s.score === maxScore && maxScore > 0,
    }))

    await broadcastEvent(match_id, {
      event: 'match_finished',
      final_scores: finalList,
    })

    return new Response(
      JSON.stringify({ status: 'match_finished' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

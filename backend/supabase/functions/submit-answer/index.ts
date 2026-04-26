import { corsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'
import { createServiceClient } from '../_shared/supabase.ts'

const ROUND_DURATION_SECONDS = 10

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

  // Identificar jogador pelo JWT
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

  const { match_id, answer_index } = (await req.json()) as {
    match_id: string
    answer_index: number
  }

  if (!match_id || answer_index === undefined || answer_index === null) {
    return new Response(JSON.stringify({ error: 'match_id and answer_index are required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (![0, 1, 2].includes(answer_index)) {
    return new Response(JSON.stringify({ error: 'answer_index must be 0, 1 or 2' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Verificar que o jogador participa desta partida
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
    .select('status, current_round, round_started_at, question_ids')
    .eq('id', match_id)
    .single()

  if (matchErr || !match) {
    return new Response(JSON.stringify({ error: 'Match not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (match.status !== 'in_progress') {
    // Rejeição silenciosa conforme spec (idempotência)
    return new Response(JSON.stringify({ accepted: false }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const currentRound: number = match.current_round
  const roundStartedAt: string = match.round_started_at
  const questionIds: string[] = match.question_ids

  // Verificar idempotência: jogador já respondeu esta rodada?
  const { data: existingAnswer } = await service
    .from('answers')
    .select('id')
    .eq('match_id', match_id)
    .eq('player_id', playerId)
    .eq('round', currentRound)
    .maybeSingle()

  if (existingAnswer) {
    // Rejeição silenciosa conforme spec
    return new Response(JSON.stringify({ accepted: false }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Verificar timeout: round_started_at + 10s > now?
  const startedAt = new Date(roundStartedAt).getTime()
  const deadline = startedAt + ROUND_DURATION_SECONDS * 1000
  if (Date.now() > deadline) {
    // Fora do prazo — rejeição silenciosa
    return new Response(JSON.stringify({ accepted: false }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Buscar correct_index com service_role (bypass de column privilege)
  const questionId = questionIds[currentRound - 1]
  const { data: question, error: qErr } = await service
    .from('questions')
    .select('correct_index')
    .eq('id', questionId)
    .single()

  if (qErr || !question) {
    return new Response(JSON.stringify({ error: 'Failed to fetch question' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const isCorrect = answer_index === question.correct_index

  // Registrar resposta
  const { error: insertErr } = await service.from('answers').insert({
    match_id,
    player_id: playerId,
    question_id: questionId,
    round: currentRound,
    answer_index,
    is_correct: isCorrect,
  })

  if (insertErr) {
    // Pode ocorrer race condition com a constraint UNIQUE — tratar como idempotente
    if (insertErr.code === '23505') {
      return new Response(JSON.stringify({ accepted: false }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    return new Response(JSON.stringify({ error: 'Failed to save answer', detail: insertErr.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Se correto, incrementar score
  if (isCorrect) {
    await service.rpc('increment_score', { p_match_id: match_id, p_player_id: playerId })
  }

  // Retornar confirmação SEM revelar is_correct (conforme spec)
  return new Response(
    JSON.stringify({ accepted: true }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})

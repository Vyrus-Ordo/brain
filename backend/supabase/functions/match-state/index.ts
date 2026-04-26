import { corsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'
import { createServiceClient } from '../_shared/supabase.ts'

// ----------------------------------------------------------------
// GET /functions/v1/match-state?match_id=uuid
// Retorna o estado atual da partida para reconstituição após reconexão.
// ----------------------------------------------------------------

Deno.serve(async (req: Request) => {
  const preflight = handleCorsPreFlight(req)
  if (preflight) return preflight

  if (req.method !== 'GET') {
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

  const url = new URL(req.url)
  const matchId = url.searchParams.get('match_id')
  if (!matchId) {
    return new Response(JSON.stringify({ error: 'match_id query param is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Verificar que o player participa desta partida
  const { data: participation } = await service
    .from('match_players')
    .select('player_id')
    .eq('match_id', matchId)
    .eq('player_id', playerId)
    .maybeSingle()

  if (!participation) {
    return new Response(JSON.stringify({ error: 'Player is not in this match' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Buscar estado da partida
  const { data: match, error: matchErr } = await service
    .from('matches')
    .select('status, current_round, total_rounds, round_started_at, question_ids, theme')
    .eq('id', matchId)
    .single()

  if (matchErr || !match) {
    return new Response(JSON.stringify({ error: 'Match not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Buscar scores dos jogadores
  const { data: players } = await service
    .from('match_players')
    .select('player_id, score, status, players!inner(name)')
    .eq('match_id', matchId)
    .order('score', { ascending: false })

  const scoreList = (players ?? []).map((p: { player_id: string; score: number; status: string; players: { name: string } }) => ({
    player_id: p.player_id,
    name: p.players.name,
    score: p.score,
    status: p.status,
  }))

  // Montar resposta base
  const response: Record<string, unknown> = {
    match_id: matchId,
    theme: match.theme,
    status: match.status,
    current_round: match.current_round,
    total_rounds: match.total_rounds,
    round_started_at: match.round_started_at,
    players: scoreList,
  }

  // Se em progresso, incluir a pergunta atual (sem correct_index)
  if (match.status === 'in_progress' && match.current_round > 0) {
    const questionId = (match.question_ids as string[])[match.current_round - 1]
    const { data: question } = await service
      .from('questions')
      .select('id, text, options')
      .eq('id', questionId)
      .single()

    if (question) {
      response.current_question = {
        id: question.id,
        text: question.text,
        options: question.options,
      }
    }

    // Indicar se este player já respondeu a rodada atual
    const { data: myAnswer } = await service
      .from('answers')
      .select('answer_index')
      .eq('match_id', matchId)
      .eq('player_id', playerId)
      .eq('round', match.current_round)
      .maybeSingle()

    response.already_answered = myAnswer !== null
  }

  return new Response(
    JSON.stringify(response),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})

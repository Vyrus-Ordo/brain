import { corsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'
import { createServiceClient } from '../_shared/supabase.ts'

const MAX_PLAYERS_PER_MATCH = 8
const TOTAL_ROUNDS = 10

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

  // Identificar o usuário a partir do JWT
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

  const body = await req.json()
  const { theme, player_name } = body as { theme: string; player_name: string }

  const validThemes = ['historia', 'esportes', 'tecnologia', 'filmes', 'geral']
  if (!theme || !validThemes.includes(theme)) {
    return new Response(JSON.stringify({ error: 'Invalid theme' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  if (!player_name || player_name.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'player_name is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Upsert do jogador (cria se não existir, atualiza nome se já existir)
  const { error: playerError } = await service
    .from('players')
    .upsert({ id: playerId, name: player_name.trim() }, { onConflict: 'id' })
  if (playerError) {
    return new Response(JSON.stringify({ error: 'Failed to upsert player', detail: playerError.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Verificar se o jogador já está em uma partida ativa do mesmo tema
  const { data: existingParticipation } = await service
    .from('match_players')
    .select('match_id, matches!inner(status, theme)')
    .eq('player_id', playerId)
    .in('matches.status', ['lobby', 'in_progress'])
    .eq('matches.theme', theme)
    .maybeSingle()

  if (existingParticipation) {
    const { count } = await service
      .from('match_players')
      .select('player_id', { count: 'exact', head: true })
      .eq('match_id', existingParticipation.match_id)
    return new Response(
      JSON.stringify({ match_id: existingParticipation.match_id, player_count: count }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Buscar partida disponível no lobby para o tema
  let matchId: string | null = null

  const { data: lobbyMatches } = await service
    .from('matches')
    .select('id')
    .eq('status', 'lobby')
    .eq('theme', theme)

  if (lobbyMatches && lobbyMatches.length > 0) {
    for (const candidate of lobbyMatches) {
      const { count } = await service
        .from('match_players')
        .select('player_id', { count: 'exact', head: true })
        .eq('match_id', candidate.id)

      if ((count ?? 0) < MAX_PLAYERS_PER_MATCH) {
        matchId = candidate.id
        break
      }
    }
  }

  // Se não há partida disponível, criar uma nova
  if (!matchId) {
    // Sortear TOTAL_ROUNDS perguntas do tema
    const { data: questions, error: qError } = await service
      .from('questions')
      .select('id')
      .eq('theme', theme)
    if (qError || !questions || questions.length === 0) {
      return new Response(JSON.stringify({ error: 'No questions found for this theme' }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const shuffled = questions
      .map((q) => ({ id: q.id, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .slice(0, TOTAL_ROUNDS)
      .map((q) => q.id)

    const { data: newMatch, error: matchError } = await service
      .from('matches')
      .insert({
        theme,
        status: 'lobby',
        current_round: 0,
        total_rounds: TOTAL_ROUNDS,
        question_ids: shuffled,
      })
      .select('id')
      .single()

    if (matchError || !newMatch) {
      return new Response(JSON.stringify({ error: 'Failed to create match', detail: matchError?.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    matchId = newMatch.id
  }

  // Inserir jogador na partida
  const { error: joinError } = await service
    .from('match_players')
    .insert({ match_id: matchId, player_id: playerId })
  if (joinError) {
    return new Response(JSON.stringify({ error: 'Failed to join match', detail: joinError.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { count: playerCount } = await service
    .from('match_players')
    .select('player_id', { count: 'exact', head: true })
    .eq('match_id', matchId)

  return new Response(
    JSON.stringify({ match_id: matchId, player_count: playerCount }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})

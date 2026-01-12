import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getSupabaseAdmin } from '$lib/server/supabaseAdmin';
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';

type GameSummaryRow = {
	game_id: string;
	verified: boolean;
	verified_at: string | null;
	verified_by: string | null;
	started_at: string | null;
	ended_at: string | null;
	navigation_count: number;
	player_count: number;
	avg_navigation_ms: number | null;
	winner_guardian: string | null;
	winner_vp: number;
};

async function recomputeVerifiedStats(supabaseAdmin: NonNullable<ReturnType<typeof getSupabaseAdmin>>): Promise<void> {
	const { data, error: tokenError } = await supabaseAdmin
		.from('internal_tokens')
		.select('value')
		.eq('key', 'recompute_stats_token')
		.limit(1)
		.maybeSingle();

	if (tokenError) {
		throw error(500, `Failed to load recompute token: ${tokenError.message}`);
	}

	const token = data?.value;
	if (!token) {
		throw error(500, 'Missing recompute token in internal_tokens');
	}

	const res = await fetch(`${PUBLIC_SUPABASE_URL}/functions/v1/recompute-stats`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-recompute-token': token,
			Authorization: `Bearer ${PUBLIC_SUPABASE_ANON_KEY}`,
			apikey: PUBLIC_SUPABASE_ANON_KEY
		},
		body: JSON.stringify({ minTurns: 10, minVictoryPoints: 10 })
	});

	if (res.ok) return;

	let detail = '';
	try {
		detail = await res.text();
	} catch {
		// ignore
	}
	throw error(500, `Failed to recompute stats: ${res.status} ${res.statusText}${detail ? `\n${detail}` : ''}`);
}

export const load: PageServerLoad = async () => {
	const MIN_TURNS_TO_SHOW = 10;
	const supabaseAdmin = getSupabaseAdmin();
	if (!supabaseAdmin) {
		return {
			games: [],
			configError:
				'Missing SUPABASE_SERVICE_ROLE_KEY on the server. Add it to `.env` to enable admin game verification.'
		};
	}

	const { data, error: fetchError } = await supabaseAdmin
		.from('game_summaries')
		.select(
			'game_id, verified, verified_at, verified_by, started_at, ended_at, navigation_count, player_count, avg_navigation_ms, winner_guardian, winner_vp'
		)
		.gt('navigation_count', MIN_TURNS_TO_SHOW)
		.order('ended_at', { ascending: false });

	if (fetchError) {
		throw error(500, `Failed to load games: ${fetchError.message}`);
	}

	return {
		games: (data as GameSummaryRow[] | null) ?? [],
		configError: null
	};
};

export const actions: Actions = {
	recompute: async () => {
		const supabaseAdmin = getSupabaseAdmin();
		if (!supabaseAdmin) throw error(500, 'Missing SUPABASE_SERVICE_ROLE_KEY on the server');

		await recomputeVerifiedStats(supabaseAdmin);
		throw redirect(303, '/admin/games');
	},
	verify: async ({ request }) => {
		const supabaseAdmin = getSupabaseAdmin();
		if (!supabaseAdmin) throw error(500, 'Missing SUPABASE_SERVICE_ROLE_KEY on the server');

		const form = await request.formData();
		const gameId = String(form.get('gameId') ?? '').trim();
		if (!gameId) throw error(400, 'Missing gameId');

		const { error: upsertError } = await supabaseAdmin.from('verified_games').upsert({
			game_id: gameId,
			verified_by: 'admin'
		});

		if (upsertError) {
			throw error(500, `Failed to verify game: ${upsertError.message}`);
		}

		await recomputeVerifiedStats(supabaseAdmin);
		throw redirect(303, '/admin/games');
	},
	unverify: async ({ request }) => {
		const supabaseAdmin = getSupabaseAdmin();
		if (!supabaseAdmin) throw error(500, 'Missing SUPABASE_SERVICE_ROLE_KEY on the server');

		const form = await request.formData();
		const gameId = String(form.get('gameId') ?? '').trim();
		if (!gameId) throw error(400, 'Missing gameId');

		const { error: deleteError } = await supabaseAdmin
			.from('verified_games')
			.delete()
			.eq('game_id', gameId);

		if (deleteError) {
			throw error(500, `Failed to unverify game: ${deleteError.message}`);
		}

		await recomputeVerifiedStats(supabaseAdmin);
		throw redirect(303, '/admin/games');
	}
};

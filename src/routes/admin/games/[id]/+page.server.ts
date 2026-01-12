import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getSupabaseAdmin } from '$lib/server/supabaseAdmin';
import { normalizeCompositionTag } from '$lib/server/compositionTags';

type GameResultRow = {
	game_id: string;
	verified: boolean;
	started_at: string | null;
	ended_at: string | null;
	navigation_count: number;
	player_color: string;
	username: string | null;
	raw_username: string | null;
	selected_character: string;
	victory_points: number;
	placement: number;
	player_count: number;
};

type PlayerCompositionTagRow = {
	game_id: string;
	player_color: string;
	tag: string;
};

type PlayerWithTags = GameResultRow & { tags: string[] };

export const load: PageServerLoad = async ({ params }) => {
	const gameId = String(params.id ?? '').trim();
	if (!gameId) throw error(400, 'Missing game id');

	const supabaseAdmin = getSupabaseAdmin();
	if (!supabaseAdmin) {
		return {
			gameId,
			players: [] as PlayerWithTags[],
			configError:
				'Missing SUPABASE_SERVICE_ROLE_KEY on the server. Add it to `.env` to enable admin tagging.',
			tagOptions: [] as string[]
		};
	}

	const [
		{ data: playerRows, error: playersError },
		{ data: tagRows, error: tagsError },
		{ data: tagOptionsRows, error: tagOptionsError }
	] = await Promise.all([
		supabaseAdmin
			.from('game_results_all')
			.select(
				'game_id, verified, started_at, ended_at, navigation_count, player_color, username, raw_username, selected_character, victory_points, placement, player_count'
			)
			.eq('game_id', gameId)
			.order('placement', { ascending: true }),
		supabaseAdmin
			.from('player_composition_tags')
			.select('game_id, player_color, tag')
			.eq('game_id', gameId)
			.order('tag', { ascending: true }),
		supabaseAdmin.from('composition_tag_catalog').select('tag').order('tag', { ascending: true })
	]);

	if (playersError) {
		throw error(500, `Failed to load players: ${playersError.message}`);
	}
	if (tagsError) {
		throw error(500, `Failed to load tags: ${tagsError.message}`);
	}
	if (tagOptionsError) {
		throw error(500, `Failed to load tag options: ${tagOptionsError.message}`);
	}

	const tagsByColor = new Map<string, string[]>();
	for (const row of (tagRows as PlayerCompositionTagRow[] | null) ?? []) {
		const list = tagsByColor.get(row.player_color) ?? [];
		list.push(row.tag);
		tagsByColor.set(row.player_color, list);
	}

	const players: PlayerWithTags[] = ((playerRows as GameResultRow[] | null) ?? []).map((p) => ({
		...p,
		tags: tagsByColor.get(p.player_color) ?? []
	}));

	return {
		gameId,
		players,
		configError: null,
		tagOptions: ((tagOptionsRows as Array<{ tag: string }> | null) ?? []).map((r) => r.tag)
	};
};

export const actions: Actions = {
	addTag: async ({ request, params }) => {
		const gameId = String(params.id ?? '').trim();
		if (!gameId) throw error(400, 'Missing game id');

		const supabaseAdmin = getSupabaseAdmin();
		if (!supabaseAdmin) throw error(500, 'Missing SUPABASE_SERVICE_ROLE_KEY on the server');

		const form = await request.formData();
		const playerColor = String(form.get('playerColor') ?? '').trim();
		const rawTag = String(form.get('tag') ?? '');
		const tag = normalizeCompositionTag(rawTag);

		if (!playerColor) throw error(400, 'Missing playerColor');
		if (!tag) throw error(400, 'Missing tag');

		const { error: upsertError } = await supabaseAdmin
			.from('player_composition_tags')
			.upsert(
				{ game_id: gameId, player_color: playerColor, tag },
				{ onConflict: 'game_id,player_color,tag' }
			);

		if (upsertError) {
			throw error(500, `Failed to save tag: ${upsertError.message}`);
		}

		throw redirect(303, `/admin/games/${encodeURIComponent(gameId)}`);
	},
	removeTag: async ({ request, params }) => {
		const gameId = String(params.id ?? '').trim();
		if (!gameId) throw error(400, 'Missing game id');

		const supabaseAdmin = getSupabaseAdmin();
		if (!supabaseAdmin) throw error(500, 'Missing SUPABASE_SERVICE_ROLE_KEY on the server');

		const form = await request.formData();
		const playerColor = String(form.get('playerColor') ?? '').trim();
		const rawTag = String(form.get('tag') ?? '');
		const tag = normalizeCompositionTag(rawTag);

		if (!playerColor) throw error(400, 'Missing playerColor');
		if (!tag) throw error(400, 'Missing tag');

		const { error: deleteError } = await supabaseAdmin
			.from('player_composition_tags')
			.delete()
			.eq('game_id', gameId)
			.eq('player_color', playerColor)
			.eq('tag', tag);

		if (deleteError) {
			throw error(500, `Failed to remove tag: ${deleteError.message}`);
		}

		throw redirect(303, `/admin/games/${encodeURIComponent(gameId)}`);
	}
};

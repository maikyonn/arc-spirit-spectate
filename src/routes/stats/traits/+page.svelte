<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { fetchTraitOccurrencesVerified, fetchTraitStatsVerified } from '$lib/supabase';
	import type { TraitOccurrenceRow, TraitStatsRow } from '$lib/types';

	type TraitType = 'class' | 'origin';
	type SortMode =
		| 'avg_victory_points'
		| 'avg_placement'
		| 'players'
		| 'games'
		| 'win_rate'
		| 'trait_count';

	type TraitGameEntry = {
		gameId: string;
		endedAt: string | null;
		navigationCount: number;
		playersWithTrait: number;
		bestPlacement: number | null;
		bestVictoryPoints: number | null;
		examplePlayerColor: string | null;
		examplePlayer: string | null;
		exampleCharacter: string | null;
	};

	let rows = $state<TraitStatsRow[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let traitType = $state<TraitType>('class');
	let minCount = $state(4);
	let sortMode = $state<SortMode>('avg_victory_points');
	let search = $state('');

	let traitGamesByKey = $state<Record<string, TraitGameEntry[]>>({});
	let traitGamesLoading = $state<Record<string, boolean>>({});
	let traitGamesErrors = $state<Record<string, string>>({});

	function getRowKey(row: Pick<TraitStatsRow, 'trait_type' | 'trait_key' | 'trait_count'>): string {
		return `${row.trait_type}:${row.trait_key}:${row.trait_count}`;
	}

	function pluralizeWord(word: string): string {
		const lower = word.toLowerCase();

		if (lower.endsWith('y') && word.length >= 2) {
			const before = lower[lower.length - 2];
			if (!'aeiou'.includes(before)) return `${word.slice(0, -1)}ies`;
		}

		if (
			lower.endsWith('s') ||
			lower.endsWith('x') ||
			lower.endsWith('z') ||
			lower.endsWith('ch') ||
			lower.endsWith('sh')
		) {
			return `${word}es`;
		}

		return `${word}s`;
	}

	function withCountLabel(traitName: string, count: number): string {
		if (!traitName) return String(count);
		if (count === 1) return `1 ${traitName}`;

		const parts = traitName.split(' ').filter(Boolean);
		if (parts.length === 0) return String(count);

		const last = parts[parts.length - 1];
		parts[parts.length - 1] = pluralizeWord(last);
		return `${count} ${parts.join(' ')}`;
	}

	function formatTimestamp(timestamp: string | null): string {
		if (!timestamp) return '—';
		const date = new Date(timestamp);
		if (Number.isNaN(date.getTime())) return String(timestamp);
		return date.toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	function shortenGameId(gameId: string): string {
		if (gameId.length <= 28) return gameId;
		return `${gameId.slice(0, 12)}…${gameId.slice(-10)}`;
	}

	function openExampleGame(row: TraitStatsRow) {
		const gameId = row.example_game_id;
		if (!gameId) return;
		const round = row.example_round;
		const searchParams = new URLSearchParams();
		if (round != null && Number.isFinite(round) && round > 0)
			searchParams.set('round', String(round));
		if (row.example_player_color) searchParams.set('player', row.example_player_color);
		const query = searchParams.size > 0 ? `?${searchParams.toString()}` : '';
		goto(`/game/${encodeURIComponent(gameId)}${query}`);
	}

	function handleRowClick(event: MouseEvent, row: TraitStatsRow) {
		const target = event.target as HTMLElement | null;
		if (!target) return;
		if (target.closest('a, button, details, summary, select, input')) return;
		openExampleGame(row);
	}

	function handleRowKeydown(event: KeyboardEvent, row: TraitStatsRow) {
		const target = event.target as HTMLElement | null;
		if (target && target.closest('a, button, details, summary, select, input')) return;

		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			openExampleGame(row);
		}
	}

	function aggregateTraitGames(rows: TraitOccurrenceRow[]): TraitGameEntry[] {
		const byGame = new Map<string, TraitGameEntry>();

		for (const r of rows) {
			const gameId = r.game_id;
			const endedAt = r.ended_at ?? null;
			const navigationCount = Number(r.navigation_count ?? 0) || 0;
			const placement = Number.isFinite(r.placement) ? Number(r.placement) : null;
			const victoryPoints = Number.isFinite(r.victory_points) ? Number(r.victory_points) : null;
			const player = r.username ?? r.raw_username ?? null;
			const character = r.selected_character ?? null;
			const playerColor = r.player_color;

			const existing = byGame.get(gameId);
			if (!existing) {
				byGame.set(gameId, {
					gameId,
					endedAt,
					navigationCount,
					playersWithTrait: 1,
					bestPlacement: placement,
					bestVictoryPoints: victoryPoints,
					examplePlayerColor: playerColor,
					examplePlayer: player,
					exampleCharacter: character
				});
				continue;
			}

			existing.playersWithTrait += 1;
			if (existing.endedAt == null && endedAt != null) existing.endedAt = endedAt;
			existing.navigationCount = Math.max(existing.navigationCount, navigationCount);

			const isBetterPlacement =
				placement != null && (existing.bestPlacement == null || placement < existing.bestPlacement);
			const isBetterVp =
				victoryPoints != null &&
				(existing.bestVictoryPoints == null || victoryPoints > existing.bestVictoryPoints);

			if (isBetterPlacement || (existing.bestPlacement == null && isBetterVp)) {
				existing.bestPlacement = placement;
				existing.bestVictoryPoints = victoryPoints;
				existing.examplePlayerColor = playerColor;
				existing.examplePlayer = player;
				existing.exampleCharacter = character;
			} else if (isBetterVp && existing.bestPlacement == null) {
				existing.bestVictoryPoints = victoryPoints;
				existing.examplePlayerColor = playerColor;
				existing.examplePlayer = player;
				existing.exampleCharacter = character;
			}
		}

		return Array.from(byGame.values()).sort((a, b) => {
			const aMs = a.endedAt ? Date.parse(a.endedAt) : Number.NEGATIVE_INFINITY;
			const bMs = b.endedAt ? Date.parse(b.endedAt) : Number.NEGATIVE_INFINITY;
			if (!Number.isNaN(aMs) && !Number.isNaN(bMs) && aMs !== bMs) return bMs - aMs;
			if (a.navigationCount !== b.navigationCount) return b.navigationCount - a.navigationCount;
			return b.gameId.localeCompare(a.gameId);
		});
	}

	async function ensureTraitGamesLoaded(row: TraitStatsRow) {
		const key = getRowKey(row);
		if (traitGamesByKey[key]) return;
		if (traitGamesLoading[key]) return;

		traitGamesLoading = { ...traitGamesLoading, [key]: true };
		traitGamesErrors = { ...traitGamesErrors, [key]: '' };

		try {
			const occurrences = await fetchTraitOccurrencesVerified({
				traitType: row.trait_type,
				traitKey: row.trait_key,
				traitCount: row.trait_count,
				limit: 75
			});

			traitGamesByKey = { ...traitGamesByKey, [key]: aggregateTraitGames(occurrences) };
		} catch (e) {
			console.error('Failed to load trait games:', e);
			traitGamesErrors = {
				...traitGamesErrors,
				[key]: e instanceof Error ? e.message : 'Failed to load games'
			};
		} finally {
			traitGamesLoading = { ...traitGamesLoading, [key]: false };
		}
	}

	const filteredSorted = $derived(() => {
		const query = search.trim().toLowerCase();

		const filtered = rows.filter((r) => {
			if (r.trait_type !== traitType) return false;
			if (r.trait_count < minCount) return false;
			if (!query) return true;
			return r.trait_name.toLowerCase().includes(query);
		});

		return filtered.sort((a, b) => {
			if (sortMode === 'avg_placement') {
				const byPlace = a.avg_placement - b.avg_placement;
				if (byPlace !== 0) return byPlace;
				const byPoints = b.avg_victory_points - a.avg_victory_points;
				if (byPoints !== 0) return byPoints;
				return b.players - a.players;
			}

			if (sortMode === 'players') {
				const byPlayers = b.players - a.players;
				if (byPlayers !== 0) return byPlayers;
				const byPoints = b.avg_victory_points - a.avg_victory_points;
				if (byPoints !== 0) return byPoints;
				return a.avg_placement - b.avg_placement;
			}

			if (sortMode === 'games') {
				const byGames = b.games - a.games;
				if (byGames !== 0) return byGames;
				const byPoints = b.avg_victory_points - a.avg_victory_points;
				if (byPoints !== 0) return byPoints;
				return a.avg_placement - b.avg_placement;
			}

			if (sortMode === 'win_rate') {
				const aRate = a.players > 0 ? a.wins / a.players : 0;
				const bRate = b.players > 0 ? b.wins / b.players : 0;
				const byRate = bRate - aRate;
				if (byRate !== 0) return byRate;
				const byPlayers = b.players - a.players;
				if (byPlayers !== 0) return byPlayers;
				return b.avg_victory_points - a.avg_victory_points;
			}

			if (sortMode === 'trait_count') {
				const byCount = a.trait_count - b.trait_count;
				if (byCount !== 0) return byCount;
				const byPlayers = b.players - a.players;
				if (byPlayers !== 0) return byPlayers;
				return b.avg_victory_points - a.avg_victory_points;
			}

			const byPoints = b.avg_victory_points - a.avg_victory_points;
			if (byPoints !== 0) return byPoints;
			const byPlace = a.avg_placement - b.avg_placement;
			if (byPlace !== 0) return byPlace;
			return b.players - a.players;
		});
	});

	async function load() {
		loading = true;
		error = null;
		try {
			rows = await fetchTraitStatsVerified();
		} catch (e) {
			console.error('Failed to load trait stats:', e);
			error = e instanceof Error ? e.message : 'Failed to load trait stats';
		} finally {
			loading = false;
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>Trait Stats | Arc Spirits Spectate</title>
</svelte:head>

<div class="min-h-screen bg-gray-900 text-white">
	<main class="mx-auto max-w-6xl px-4 py-8">
		<div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div class="min-w-0">
				<a href="/stats" class="text-sm font-semibold text-purple-300 hover:text-purple-200"
					>← Stats</a
				>
				<h1 class="mt-2 text-xl font-bold text-gray-100">Trait Stats</h1>
				<p class="mt-1 text-sm text-gray-400">
					Verified games only (over 10 turns; players with a TTS username and ≥10 VP). Each row represents an
					exact final board count (e.g. 4 Fighters, 5 Fighters).
				</p>
			</div>
			<button
				onclick={load}
				disabled={loading}
				class="rounded-md bg-gray-800 px-3 py-1.5 text-sm font-semibold text-gray-100 hover:bg-gray-700 disabled:opacity-50"
			>
				Refresh
			</button>
		</div>

		<div
			class="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-gray-800 bg-gray-800/30 p-4 sm:grid-cols-2 lg:grid-cols-4"
		>
			<div class="min-w-0">
				<label for="trait-type" class="block text-sm font-semibold text-gray-200">Trait Type</label>
				<select
					id="trait-type"
					bind:value={traitType}
					class="mt-3 w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 focus:border-purple-500 focus:outline-none"
				>
					<option value="class">Class</option>
					<option value="origin">Origin</option>
				</select>
			</div>

			<div class="min-w-0">
				<label for="min-count" class="block text-sm font-semibold text-gray-200"
					>Minimum Count</label
				>
				<select
					id="min-count"
					bind:value={minCount}
					class="mt-3 w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 focus:border-purple-500 focus:outline-none"
				>
					{#each Array.from({ length: 20 }, (_, i) => i + 1) as n (n)}
						<option value={n}>{n}+</option>
					{/each}
				</select>
			</div>

			<div class="min-w-0">
				<label for="sort-mode" class="block text-sm font-semibold text-gray-200">Sort</label>
				<select
					id="sort-mode"
					bind:value={sortMode}
					class="mt-3 w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 focus:border-purple-500 focus:outline-none"
				>
					<option value="avg_victory_points">Avg VP (desc)</option>
					<option value="avg_placement">Avg Placement (asc)</option>
					<option value="win_rate">Win rate (desc)</option>
					<option value="players">Players (desc)</option>
					<option value="games">Games (desc)</option>
					<option value="trait_count">Count (asc)</option>
				</select>
			</div>

			<div class="min-w-0">
				<label for="trait-search" class="block text-sm font-semibold text-gray-200">Search</label>
				<input
					id="trait-search"
					bind:value={search}
					placeholder="Filter traits…"
					class="mt-3 w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-purple-500 focus:outline-none"
				/>
			</div>
		</div>

		{#if loading && rows.length === 0}
			<div class="flex flex-col items-center justify-center py-20">
				<div
					class="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"
				></div>
				<p class="text-gray-400">Loading trait stats…</p>
			</div>
		{:else if error}
			<div class="rounded-lg border border-red-800 bg-red-900/20 p-6 text-center">
				<p class="text-sm text-red-300">{error}</p>
			</div>
		{:else if filteredSorted().length === 0}
			<div class="flex flex-col items-center justify-center py-16 text-center">
				{#if rows.length === 0 && search.trim() === ''}
					<div class="mb-2 text-sm text-gray-200">No trait stats yet.</div>
					<div class="text-sm text-gray-400">
						Verify some games over 10 turns (players need a TTS username and ≥10 VP) to populate this page.
					</div>
				{:else}
					<div class="mb-3 text-sm text-gray-400">No traits match this filter.</div>
				{/if}
			</div>
		{:else}
			<div class="overflow-hidden rounded-xl border border-gray-800">
				<div class="overflow-x-auto bg-gray-900/40">
					<table class="min-w-full divide-y divide-gray-800 text-sm">
						<thead class="bg-gray-900/70">
							<tr class="text-left text-xs tracking-wide text-gray-500 uppercase">
								<th class="px-4 py-3">Trait</th>
								<th class="px-4 py-3">Players</th>
								<th class="px-4 py-3">Games</th>
								<th class="px-4 py-3">Wins</th>
								<th class="px-4 py-3">Win Rate</th>
								<th class="px-4 py-3">Avg VP</th>
								<th class="px-4 py-3">Avg Place</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-800">
							{#each filteredSorted() as r (`${r.trait_type}:${r.trait_key}:${r.trait_count}`)}
								{@const key = getRowKey(r)}
								<tr
									role="link"
									tabindex="0"
									onclick={(event) => handleRowClick(event, r)}
									onkeydown={(event) => handleRowKeydown(event, r)}
									class="cursor-pointer hover:bg-gray-800/40 focus:bg-gray-800/40 focus:outline-none"
									title="Open a recent game that played this trait"
								>
									<td class="px-4 py-3">
										<div class="font-semibold text-gray-100">
											{withCountLabel(r.trait_name, r.trait_count)}
										</div>
										<div class="mt-1 text-xs text-gray-500">{r.trait_type}</div>
									</td>
									<td class="px-4 py-3 text-gray-200">{r.players}</td>
									<td class="px-4 py-3 text-gray-200">
										<details class="group">
											<summary
												onclick={() => void ensureTraitGamesLoaded(r)}
												class="inline-flex cursor-pointer items-center gap-1 font-semibold text-purple-300 hover:text-purple-200"
											>
												<span>{r.games}</span>
												<span class="text-xs text-gray-500">games</span>
											</summary>

											<div class="mt-3 rounded-lg border border-gray-800 bg-gray-950/60 p-3">
												{#if traitGamesLoading[key]}
													<div class="text-sm text-gray-400">Loading games…</div>
												{:else if traitGamesErrors[key]}
													<div class="text-sm text-red-300">{traitGamesErrors[key]}</div>
												{:else}
													{@const games = traitGamesByKey[key] ?? []}
													{#if games.length === 0}
														<div class="text-sm text-gray-400">No games found.</div>
													{:else}
														<div class="space-y-2">
															{#each games as g (g.gameId)}
																<a
																	href={`/game/${encodeURIComponent(g.gameId)}?round=${g.navigationCount}${
																		g.examplePlayerColor
																			? `&player=${encodeURIComponent(g.examplePlayerColor)}`
																			: ''
																	}`}
																	class="block rounded-md border border-gray-800 bg-gray-900/40 p-2 text-xs text-gray-200 hover:bg-gray-900/70"
																	title="Open game at final round"
																>
																	<div class="flex items-start justify-between gap-3">
																		<div class="min-w-0">
																			<div class="truncate font-semibold text-gray-100">
																				{shortenGameId(g.gameId)}
																			</div>
																			<div class="mt-1 text-[11px] text-gray-500">
																				Ended {formatTimestamp(g.endedAt)} • {g.navigationCount} rounds
																			</div>
																			{#if g.examplePlayer || g.exampleCharacter}
																				<div class="mt-1 text-[11px] text-gray-500">
																					{g.examplePlayer ?? 'Unknown'} • {g.exampleCharacter ??
																						'Unknown'}
																					{#if g.bestPlacement != null}
																						• Place {g.bestPlacement}
																					{/if}
																					{#if g.bestVictoryPoints != null}
																						• {g.bestVictoryPoints} VP
																					{/if}
																					{#if g.playersWithTrait > 1}
																						• {g.playersWithTrait} players
																					{/if}
																				</div>
																			{/if}
																		</div>
																		<div class="shrink-0 text-purple-300">Open</div>
																	</div>
																</a>
															{/each}
														</div>
													{/if}
												{/if}
											</div>
										</details>
									</td>
									<td class="px-4 py-3 text-gray-200">{r.wins}</td>
									<td class="px-4 py-3 text-gray-200">
										{(r.players > 0 ? (r.wins / r.players) * 100 : 0).toFixed(0)}%
									</td>
									<td class="px-4 py-3 text-gray-200">{r.avg_victory_points.toFixed(1)}</td>
									<td class="px-4 py-3 text-gray-200">{r.avg_placement.toFixed(2)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</main>
</div>

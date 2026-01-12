<script lang="ts">
	import { onMount } from 'svelte';
	import {
		fetchArtifactOccurrencesVerified,
		fetchArtifactStatsVerified,
		STORAGE_BASE_URL
	} from '$lib/supabase';
	import { loadAssets, getAssetState } from '$lib/stores/assetStore.svelte';
	import type { ArtifactOccurrenceRow, ArtifactStatsRow } from '$lib/types';

	type SortMode = 'avg_victory_points' | 'avg_placement' | 'picks';

	const assetState = getAssetState();

	type ArtifactGameEntry = {
		gameId: string;
		endedAt: string | null;
		navigationCount: number;
		playersWithArtifact: number;
		bestPlacement: number | null;
		bestVictoryPoints: number | null;
		examplePlayerColor: string | null;
		examplePlayer: string | null;
		exampleCharacter: string | null;
	};

	let rows = $state<ArtifactStatsRow[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let sortMode = $state<SortMode>('avg_victory_points');
	let search = $state('');

	let artifactGamesById = $state<Record<string, ArtifactGameEntry[]>>({});
	let artifactGamesLoading = $state<Record<string, boolean>>({});
	let artifactGamesErrors = $state<Record<string, string>>({});

	function getStorageUrl(path: string | null): string | null {
		if (!path) return null;
		if (path.startsWith('http')) return path;
		return `${STORAGE_BASE_URL}/${path}`;
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

	function aggregateArtifactGames(rows: ArtifactOccurrenceRow[]): ArtifactGameEntry[] {
		const byGame = new Map<string, ArtifactGameEntry>();

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
					playersWithArtifact: 1,
					bestPlacement: placement,
					bestVictoryPoints: victoryPoints,
					examplePlayerColor: playerColor,
					examplePlayer: player,
					exampleCharacter: character
				});
				continue;
			}

			existing.playersWithArtifact += 1;
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

	async function ensureArtifactGamesLoaded(row: ArtifactStatsRow) {
		const key = row.artifact_id;
		if (artifactGamesById[key]) return;
		if (artifactGamesLoading[key]) return;

		artifactGamesLoading = { ...artifactGamesLoading, [key]: true };
		artifactGamesErrors = { ...artifactGamesErrors, [key]: '' };

		try {
			const occurrences = await fetchArtifactOccurrencesVerified({
				artifactId: row.artifact_id,
				limit: 75
			});

			artifactGamesById = { ...artifactGamesById, [key]: aggregateArtifactGames(occurrences) };
		} catch (e) {
			console.error('Failed to load artifact games:', e);
			artifactGamesErrors = {
				...artifactGamesErrors,
				[key]: e instanceof Error ? e.message : 'Failed to load games'
			};
		} finally {
			artifactGamesLoading = { ...artifactGamesLoading, [key]: false };
		}
	}

	const filteredSorted = $derived(() => {
		const query = search.trim().toLowerCase();
		const filtered = query
			? rows.filter((r) => {
					const asset = assetState.artifactAssets.get(r.artifact_id);
					const name = asset?.name ?? r.artifact_name ?? r.artifact_id;
					return name.toLowerCase().includes(query);
				})
			: rows.slice();

		return filtered.sort((a, b) => {
			if (sortMode === 'avg_placement') {
				const byPlace = a.avg_placement - b.avg_placement;
				if (byPlace !== 0) return byPlace;
				const byPoints = b.avg_victory_points - a.avg_victory_points;
				if (byPoints !== 0) return byPoints;
				return b.picks - a.picks;
			}

			if (sortMode === 'picks') {
				const byPicks = b.picks - a.picks;
				if (byPicks !== 0) return byPicks;
				const byPoints = b.avg_victory_points - a.avg_victory_points;
				if (byPoints !== 0) return byPoints;
				return a.avg_placement - b.avg_placement;
			}

			const byPoints = b.avg_victory_points - a.avg_victory_points;
			if (byPoints !== 0) return byPoints;
			const byPlace = a.avg_placement - b.avg_placement;
			if (byPlace !== 0) return byPlace;
			return b.picks - a.picks;
		});
	});

	async function load() {
		loading = true;
		error = null;
		try {
			await loadAssets();
			rows = await fetchArtifactStatsVerified();
		} catch (e) {
			console.error('Failed to load artifact stats:', e);
			error = e instanceof Error ? e.message : 'Failed to load artifact stats';
		} finally {
			loading = false;
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>Artifact Stats | Arc Spirits Spectate</title>
</svelte:head>

<div class="min-h-screen bg-gray-900 text-white">
	<main class="mx-auto max-w-6xl px-4 py-8">
		<div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div class="min-w-0">
				<a href="/stats" class="text-sm font-semibold text-purple-300 hover:text-purple-200"
					>← Stats</a
				>
				<h1 class="mt-2 text-xl font-bold text-gray-100">Artifact Stats</h1>
				<p class="mt-1 text-sm text-gray-400">
					Computed from verified games (over 10 turns; players with a TTS username and ≥10 VP).
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
			class="mb-6 flex flex-col gap-3 rounded-xl border border-gray-800 bg-gray-800/30 p-4 sm:flex-row sm:items-end sm:justify-between"
		>
			<div class="min-w-0 flex-1">
				<label for="artifact-sort" class="block text-sm font-semibold text-gray-200">Sort</label>
				<select
					id="artifact-sort"
					bind:value={sortMode}
					class="mt-3 w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 focus:border-purple-500 focus:outline-none"
				>
					<option value="avg_victory_points">Avg VP (desc)</option>
					<option value="avg_placement">Avg Placement (asc)</option>
					<option value="picks">Picks (desc)</option>
				</select>
			</div>
			<div class="min-w-0">
				<label for="artifact-search" class="block text-sm font-semibold text-gray-200">Search</label
				>
				<input
					id="artifact-search"
					bind:value={search}
					placeholder="Filter artifacts…"
					class="mt-3 w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-purple-500 focus:outline-none"
				/>
			</div>
		</div>

		{#if loading && rows.length === 0}
			<div class="flex flex-col items-center justify-center py-20">
				<div
					class="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"
				></div>
				<p class="text-gray-400">Loading artifact stats…</p>
			</div>
		{:else if error}
			<div class="rounded-lg border border-red-800 bg-red-900/20 p-6 text-center">
				<p class="text-sm text-red-300">{error}</p>
			</div>
		{:else if filteredSorted().length === 0}
			<div class="flex flex-col items-center justify-center py-16 text-center">
				{#if rows.length === 0 && search.trim() === ''}
					<div class="mb-2 text-sm text-gray-200">No artifact stats yet.</div>
					<div class="text-sm text-gray-400">
						Verify at least one game with artifacts to populate this page.
					</div>
				{:else}
					<div class="mb-3 text-sm text-gray-400">No artifacts match this search.</div>
				{/if}
			</div>
		{:else}
			<div class="overflow-hidden rounded-xl border border-gray-800">
				<div class="overflow-x-auto bg-gray-900/40">
					<table class="min-w-full divide-y divide-gray-800 text-sm">
						<thead class="bg-gray-900/70">
							<tr class="text-left text-xs tracking-wide text-gray-500 uppercase">
								<th class="px-4 py-3">Artifact</th>
								<th class="px-4 py-3">Picks</th>
								<th class="px-4 py-3">Avg VP</th>
								<th class="px-4 py-3">Avg Place</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-800">
							{#each filteredSorted() as r (r.artifact_id)}
								{@const key = r.artifact_id}
								{@const asset = assetState.artifactAssets.get(r.artifact_id)}
								{@const cardUrl = getStorageUrl(asset?.card_image_path ?? null)}
								<tr class="hover:bg-gray-800/40">
									<td class="px-4 py-3">
										<div class="flex items-center gap-3">
											<div
												class="h-10 w-16 overflow-hidden rounded-md border border-gray-700 bg-gray-800"
											>
												{#if cardUrl}
													<img
														src={cardUrl}
														alt={asset?.name ?? r.artifact_name ?? r.artifact_id}
														class="h-full w-full object-cover"
														loading="lazy"
														decoding="async"
													/>
												{:else}
													<div
														class="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-300"
													>
														{(asset?.name ?? r.artifact_name ?? '??').slice(0, 2)}
													</div>
												{/if}
											</div>
											<div class="min-w-0">
												<div class="truncate font-semibold text-gray-100">
													{asset?.name ?? r.artifact_name ?? r.artifact_id}
												</div>
												<div class="mt-1 text-xs text-gray-500">{r.artifact_id}</div>
											</div>
										</div>
									</td>
									<td class="px-4 py-3 text-gray-200">
										<details class="group">
											<summary
												onclick={() => void ensureArtifactGamesLoaded(r)}
												class="inline-flex cursor-pointer items-center gap-1 font-semibold text-purple-300 hover:text-purple-200"
											>
												<span>{r.picks}</span>
												<span class="text-xs text-gray-500">picks</span>
											</summary>

											<div class="mt-3 rounded-lg border border-gray-800 bg-gray-950/60 p-3">
												{#if artifactGamesLoading[key]}
													<div class="text-sm text-gray-400">Loading games…</div>
												{:else if artifactGamesErrors[key]}
													<div class="text-sm text-red-300">{artifactGamesErrors[key]}</div>
												{:else}
													{@const games = artifactGamesById[key] ?? []}
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
																					{#if g.playersWithArtifact > 1}
																						• {g.playersWithArtifact} players
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

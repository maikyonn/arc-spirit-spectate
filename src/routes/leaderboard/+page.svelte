<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchRatingLeaderboard } from '$lib/supabase';
	import { loadAssets, getGuardianAsset } from '$lib/stores/assetStore.svelte';
	import type { RatingLeaderboardRow } from '$lib/types';

	type LastGameEntry = {
		gameId: string;
		round: number;
		playerColor: string;
		character: string;
		endedAt: string;
		victoryPoints: number;
		placement: number;
	};

	type LeaderboardEntry = {
		username: string;
		usernameKey: string;
		rating: number | null;
		winRatePct: number;
		gamesPlayed: number;
		wins: number;
		avgPoints: number;
		avgPlacement: number;
		lastGames: LastGameEntry[];
	};

	let entries = $state<LeaderboardEntry[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let lastRefresh = $state<Date | null>(null);
	let search = $state('');

	const filteredEntries = $derived(() => {
		const query = search.trim().toLowerCase();
		if (!query) return entries;
		return entries.filter((e) => e.username.toLowerCase().includes(query));
	});

	function formatDate(timestamp: string | null): string {
		if (!timestamp) return '—';
		const date = new Date(timestamp);
		if (Number.isNaN(date.getTime())) return String(timestamp);
		const now = new Date();
		const options: Intl.DateTimeFormatOptions = {
			month: 'short',
			day: 'numeric'
		};
		if (date.getFullYear() !== now.getFullYear()) {
			options.year = 'numeric';
		}
		return date.toLocaleDateString('en-US', options);
	}

	function mapEntry(row: RatingLeaderboardRow): LeaderboardEntry {
		return {
			username: row.username,
			usernameKey: row.username_key,
			rating: row.ordinal,
			winRatePct: Math.round((((row.win_rate ?? 0) * 100) + Number.EPSILON) * 10) / 10,
			gamesPlayed: row.games_played,
			wins: row.wins,
			avgPoints: row.avg_victory_points,
			avgPlacement: row.avg_placement,
			lastGames: row.last_games ?? []
		};
	}

	async function refreshLeaderboard() {
		loading = true;
		error = null;
		try {
			const rows = await fetchRatingLeaderboard();
			entries = rows.map(mapEntry).sort((a, b) => {
				const aRating = a.rating ?? Number.NEGATIVE_INFINITY;
				const bRating = b.rating ?? Number.NEGATIVE_INFINITY;
				const byRating = bRating - aRating;
				if (byRating !== 0) return byRating;
				const byGames = b.gamesPlayed - a.gamesPlayed;
				if (byGames !== 0) return byGames;
				const byPlace = a.avgPlacement - b.avgPlacement;
				if (byPlace !== 0) return byPlace;
				return a.username.localeCompare(b.username);
			});
			lastRefresh = new Date();
		} catch (e) {
			console.error('Error fetching leaderboard:', e);
			error = e instanceof Error ? e.message : 'Failed to fetch leaderboard';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadAssets();
		refreshLeaderboard();
	});
</script>

<svelte:head>
	<title>Leaderboard | Arc Spirits Spectate</title>
</svelte:head>

<div class="min-h-screen bg-gray-900 text-white">
	<main class="mx-auto max-w-6xl px-4 py-8">
		<div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div class="min-w-0">
				<h1 class="text-xl font-bold text-gray-100">Leaderboard</h1>
				<p class="mt-1 text-sm text-gray-400">
					Verified games only (over 10 turns). Players must have a TTS username and ≥10 VP.
				</p>
			</div>
			<div class="flex items-center gap-4">
				{#if lastRefresh}
					<span class="text-xs text-gray-500">Updated {lastRefresh.toLocaleTimeString()}</span>
				{/if}
				<button
					onclick={refreshLeaderboard}
					disabled={loading}
					class="flex items-center gap-2 rounded-md bg-gray-800 px-3 py-1.5 text-sm transition-colors hover:bg-gray-700 disabled:opacity-50"
				>
					<svg
						class="h-4 w-4 {loading ? 'animate-spin' : ''}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
						/>
					</svg>
					Refresh
				</button>
			</div>
		</div>

		<div
			class="mb-6 flex flex-col gap-3 rounded-xl border border-gray-800 bg-gray-800/30 p-4 sm:flex-row sm:items-end sm:justify-between"
		>
			<div class="min-w-0 flex-1">
				<h2 class="text-sm font-semibold text-gray-200">Players</h2>
				<p class="mt-1 text-xs text-gray-400">
					Rating uses placement-only OpenSkill (verified games over 10 turns; players with ≥10 VP).
				</p>
			</div>
			<div class="min-w-0">
				<label for="leaderboard-search" class="block text-sm font-medium text-gray-200"
					>Search</label
				>
				<input
					id="leaderboard-search"
					bind:value={search}
					placeholder="Filter usernames…"
					class="mt-3 w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-purple-500 focus:outline-none"
				/>
			</div>
		</div>

		{#if loading && entries.length === 0}
			<div class="flex flex-col items-center justify-center py-20">
				<div
					class="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"
				></div>
				<p class="text-gray-400">Loading leaderboard…</p>
			</div>
		{:else if error}
			<div class="rounded-lg border border-red-800 bg-red-900/20 p-6 text-center">
				<p class="text-sm text-red-300">{error}</p>
			</div>
		{:else if filteredEntries().length === 0}
			<div class="flex flex-col items-center justify-center py-16 text-center">
				{#if entries.length === 0 && search.trim() === ''}
					<div class="mb-2 text-sm text-gray-200">No leaderboard yet.</div>
					<div class="text-sm text-gray-400">
						Verify at least one game to populate the leaderboard.
					</div>
				{:else}
					<div class="mb-3 text-sm text-gray-400">No players match this search.</div>
				{/if}
			</div>
		{:else}
			<div class="overflow-hidden rounded-xl border border-gray-800">
				<div class="overflow-x-auto bg-gray-900/40">
					<table class="min-w-full divide-y divide-gray-800 text-sm">
						<thead class="bg-gray-900/70">
							<tr class="text-left text-xs tracking-wide text-gray-500 uppercase">
								<th class="px-4 py-3">Player</th>
								<th class="px-4 py-3">Rating</th>
								<th class="px-4 py-3">Games</th>
								<th class="px-4 py-3">Win %</th>
								<th class="px-4 py-3">Avg Points</th>
								<th class="px-4 py-3">Avg Place</th>
								<th class="px-4 py-3">Last Played</th>
								<th class="px-4 py-3">Last 5 Games</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-800">
							{#each filteredEntries() as entry (entry.usernameKey)}
								{@const lastGame = entry.lastGames[0] ?? null}
								<tr class="hover:bg-gray-800/40">
									<td class="px-4 py-3">
										<div class="min-w-0">
											<a
												href={`/players/${encodeURIComponent(entry.username)}`}
												class="truncate font-semibold text-purple-300 hover:text-purple-200"
												title="Open player profile"
											>
												{entry.username}
											</a>
										</div>
									</td>
									<td class="px-4 py-3 text-gray-200">
										{#if entry.rating != null}
											{entry.rating.toFixed(1)}
										{:else}
											<span class="text-xs text-gray-500">—</span>
										{/if}
									</td>
									<td class="px-4 py-3 text-gray-200">{entry.gamesPlayed}</td>
									<td class="px-4 py-3 text-gray-200">{entry.winRatePct.toFixed(1)}%</td>
									<td class="px-4 py-3 text-gray-200">{entry.avgPoints.toFixed(1)}</td>
									<td class="px-4 py-3 text-gray-200">{entry.avgPlacement.toFixed(2)}</td>
									<td class="px-4 py-3">
										{#if lastGame}
											<span class="text-sm text-gray-200">{formatDate(lastGame.endedAt)}</span>
										{:else}
											<span class="text-xs text-gray-500">—</span>
										{/if}
									</td>
										<td class="px-4 py-3">
											<div class="flex flex-wrap items-center gap-2">
												{#each entry.lastGames.slice(0, 5) as game (`${game.gameId}:${game.round}:${game.playerColor}`)}
													{@const asset = getGuardianAsset(game.character)}
													<a
														href={`/game/${encodeURIComponent(game.gameId)}?round=${encodeURIComponent(String(game.round))}&player=${encodeURIComponent(game.playerColor)}`}
														class="group relative block h-10 w-10 overflow-hidden rounded-lg border border-gray-700 bg-gray-800 hover:border-purple-500/60"
														title={`${game.character} • ${game.victoryPoints} VP • Place ${game.placement}`}
													>
														{#if asset?.iconUrl}
															<img
															src={asset.iconUrl}
															alt={game.character}
															class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
															loading="lazy"
															decoding="async"
														/>
													{:else}
														<div
															class="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-300"
														>
																{game.character.slice(0, 2)}
															</div>
														{/if}
													</a>
												{/each}
											</div>
										</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</main>
</div>

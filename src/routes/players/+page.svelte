<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchRatingLeaderboard } from '$lib/supabase';
	import type { RatingLeaderboardRow } from '$lib/types';

	type PlayerRow = RatingLeaderboardRow & { winRatePct: number };

	let players = $state<PlayerRow[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let lastRefresh = $state<Date | null>(null);
	let search = $state('');

	const filteredPlayers = $derived(() => {
		const query = search.trim().toLowerCase();
		if (!query) return players;
		return players.filter((p) => p.username.toLowerCase().includes(query));
	});

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

	async function refreshPlayers() {
		loading = true;
		error = null;
		try {
			const rows = await fetchRatingLeaderboard();
			players = rows
				.map((r) => ({
					...r,
					winRatePct: Math.round(((r.win_rate ?? 0) * 100 + Number.EPSILON) * 10) / 10
				}))
				.sort((a, b) => {
					const byGames = b.games_played - a.games_played;
					if (byGames !== 0) return byGames;
					const byWin = b.winRatePct - a.winRatePct;
					if (byWin !== 0) return byWin;
					return a.username.localeCompare(b.username);
				});
			lastRefresh = new Date();
		} catch (e) {
			console.error('Error fetching players:', e);
			error = e instanceof Error ? e.message : 'Failed to fetch players';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		refreshPlayers();
	});
</script>

<svelte:head>
	<title>Players | Arc Spirits Spectate</title>
</svelte:head>

<div class="min-h-screen bg-gray-900 text-white">
	<main class="mx-auto max-w-6xl px-4 py-8">
		<div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div class="min-w-0">
				<h1 class="text-xl font-bold text-gray-100">Players</h1>
				<p class="mt-1 text-sm text-gray-400">
					Verified games only (over 10 turns). Players must have a TTS username and ≥10 VP.
				</p>
			</div>
			<div class="flex items-center gap-4">
				{#if lastRefresh}
					<span class="text-xs text-gray-500">Updated {lastRefresh.toLocaleTimeString()}</span>
				{/if}
				<button
					onclick={refreshPlayers}
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
				<h2 class="text-sm font-semibold text-gray-200">Directory</h2>
				<p class="mt-1 text-xs text-gray-400">
					Search by TTS username. Click a name for a detailed profile.
				</p>
			</div>
			<div class="min-w-0">
				<label for="players-search" class="block text-sm font-medium text-gray-200">Search</label>
				<input
					id="players-search"
					bind:value={search}
					placeholder="Filter usernames…"
					class="mt-3 w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-purple-500 focus:outline-none"
				/>
			</div>
		</div>

		{#if loading && players.length === 0}
			<div class="flex flex-col items-center justify-center py-20">
				<div
					class="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"
				></div>
				<p class="text-gray-400">Loading players…</p>
			</div>
		{:else if error}
			<div class="rounded-lg border border-red-800 bg-red-900/20 p-6 text-center">
				<p class="text-sm text-red-300">{error}</p>
			</div>
		{:else if filteredPlayers().length === 0}
			<div class="flex flex-col items-center justify-center py-16 text-center">
				{#if players.length === 0 && search.trim() === ''}
					<div class="mb-2 text-sm text-gray-200">No player stats yet.</div>
					<div class="text-sm text-gray-400">
						Verify at least one game to start tracking profiles.
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
								<th class="px-4 py-3">Games</th>
								<th class="px-4 py-3">Wins</th>
								<th class="px-4 py-3">Win %</th>
								<th class="px-4 py-3">Avg VP</th>
								<th class="px-4 py-3">Avg Place</th>
								<th class="px-4 py-3">Last Game</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-800">
							{#each filteredPlayers() as p (p.username_key)}
								<tr class="hover:bg-gray-800/40">
									<td class="px-4 py-3">
										<a
											href={`/players/${encodeURIComponent(p.username)}`}
											class="truncate font-semibold text-purple-300 hover:text-purple-200"
										>
											{p.username}
										</a>
									</td>
									<td class="px-4 py-3 text-gray-200">{p.games_played}</td>
									<td class="px-4 py-3 text-gray-200">{p.wins}</td>
									<td class="px-4 py-3 text-gray-200">{p.winRatePct.toFixed(1)}%</td>
									<td class="px-4 py-3 text-gray-200">{p.avg_victory_points.toFixed(1)}</td>
									<td class="px-4 py-3 text-gray-200">{p.avg_placement.toFixed(2)}</td>
									<td class="px-4 py-3 text-gray-300">{formatTimestamp(p.last_game_at)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</main>
</div>

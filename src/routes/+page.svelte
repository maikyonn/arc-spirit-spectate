<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { fetchGameSummaries } from '$lib/supabase';
	import { loadAssets, getGuardianAsset } from '$lib/stores/assetStore.svelte';
	import { toFullReplayCode, toShortReplayCode } from '$lib/replayCodes';

	// Types for game list display
	interface GameListItem {
		game_id: string;
		started_at: string | null;
		navigation_count: number;
		player_count: number;
		ended_at: string | null;
		total_duration_ms: number | null;
		avg_navigation_ms: number | null;
		winner_guardian: string | null;
		winner_guardian_icon: string | null;
		winner_vp: number;
		verified: boolean;
	}

	let games = $state<GameListItem[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let lastRefresh = $state<Date | null>(null);
	const MIN_TURNS_TO_SHOW = 15;
	let gameFilter = $state<'15plus' | 'under15' | 'all'>('15plus');
	let verificationFilter = $state<'verified' | 'unverified' | 'all'>('verified');
	let copiedReplayForGame = $state<string | null>(null);
	let copyResetTimer: ReturnType<typeof setTimeout> | null = null;

	const filteredGames = $derived(() => {
		let list = games;
		if (verificationFilter === 'verified') list = list.filter((g) => g.verified);
		else if (verificationFilter === 'unverified') list = list.filter((g) => !g.verified);

		if (gameFilter === 'all') return list;
		if (gameFilter === 'under15') return list.filter((g) => g.navigation_count < MIN_TURNS_TO_SHOW);
		return list.filter((g) => g.navigation_count >= MIN_TURNS_TO_SHOW);
	});

	const verifiedCount = $derived(() => games.filter((g) => g.verified).length);
	const unverifiedCount = $derived(() => games.filter((g) => !g.verified).length);

	const shortGamesCount = $derived(() => {
		let list = games;
		if (verificationFilter === 'verified') list = list.filter((g) => g.verified);
		else if (verificationFilter === 'unverified') list = list.filter((g) => !g.verified);
		return list.filter((g) => g.navigation_count < MIN_TURNS_TO_SHOW).length;
	});

	// Format date for display
	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	function formatDuration(ms: number | null): string {
		if (ms == null || !Number.isFinite(ms) || ms < 0) return '—';

		const totalSeconds = Math.floor(ms / 1000);
		const seconds = totalSeconds % 60;
		const totalMinutes = Math.floor(totalSeconds / 60);
		const minutes = totalMinutes % 60;
		const hours = Math.floor(totalMinutes / 60);

		if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
		if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
		return `${seconds}s`;
	}

	function formatDurationHoursMinutes(ms: number | null): string {
		if (ms == null || !Number.isFinite(ms) || ms < 0) return '—';
		if (ms < 60_000) return '<1m';

		const totalMinutes = Math.floor(ms / 60_000);
		const minutes = totalMinutes % 60;
		const hours = Math.floor(totalMinutes / 60);

		if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
		return `${minutes}m`;
	}

	function safeDurationMs(start: string | null, end: string | null): number | null {
		if (!start || !end) return null;
		const startMs = Date.parse(start);
		const endMs = Date.parse(end);
		if (Number.isNaN(startMs) || Number.isNaN(endMs)) return null;
		const diff = endMs - startMs;
		return diff >= 0 ? diff : null;
	}

	// Shorten game ID for display
	function shortenGameId(gameId: string): string {
		// If the game ID is in format game_YYYYMMDD_HHMMSS_XXXX, show last part
		const parts = gameId.split('_');
		if (parts.length >= 4) {
			return `${parts[0]}_${parts[1]}_${parts[2]}_${parts[3]}`;
		}
		// Otherwise truncate to 20 chars
		return gameId.length > 24 ? gameId.slice(0, 24) + '...' : gameId;
	}

	function navigateToGame(gameId: string) {
		goto(`/game/${encodeURIComponent(gameId)}`);
	}

	function handleGameCardClick(event: MouseEvent, gameId: string) {
		const target = event.target as HTMLElement | null;
		if (!target) return;
		if (target.closest('a') || target.closest('button') || target.closest('[data-no-nav]')) return;
		navigateToGame(gameId);
	}

	function handleGameCardKeydown(event: KeyboardEvent, gameId: string) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			navigateToGame(gameId);
		}
	}

	async function copyReplayCode(gameId: string, navigationCount: number) {
		const code = toFullReplayCode(gameId, navigationCount);
		try {
			await navigator.clipboard.writeText(code);
			copiedReplayForGame = gameId;
			if (copyResetTimer) clearTimeout(copyResetTimer);
			copyResetTimer = setTimeout(() => {
				copiedReplayForGame = null;
			}, 2000);
		} catch (e) {
			console.error('Failed to copy replay code:', e);
		}
	}

	// Fetch games from Supabase
	async function fetchGames() {
		loading = true;
		error = null;

		try {
			const rows = await fetchGameSummaries();
			games = rows
				.map((row) => {
					const guardianAsset = row.winner_guardian ? getGuardianAsset(row.winner_guardian) : null;
					return {
						game_id: row.game_id,
						started_at: row.started_at,
						navigation_count: row.navigation_count,
						player_count: row.player_count,
						ended_at: row.ended_at ?? null,
						total_duration_ms: safeDurationMs(row.started_at, row.ended_at ?? null),
						avg_navigation_ms: row.avg_navigation_ms ?? null,
						winner_guardian: row.winner_guardian ?? null,
						winner_guardian_icon: guardianAsset?.iconUrl ?? null,
						winner_vp: row.winner_vp ?? 0,
						verified: row.verified
					};
				})
				.sort(
					(a, b) =>
						new Date(b.ended_at ?? b.started_at ?? 0).getTime() -
						new Date(a.ended_at ?? a.started_at ?? 0).getTime()
				);

			lastRefresh = new Date();
		} catch (e) {
			console.error('Error fetching games:', e);
			error = e instanceof Error ? e.message : 'Failed to fetch games';
		} finally {
			loading = false;
		}
	}

	// Auto-refresh every 30 seconds
	let refreshInterval: ReturnType<typeof setInterval> | null = null;

	onMount(() => {
		let cancelled = false;

		(async () => {
			// Load guardian assets first so we can resolve icons
			await loadAssets();
			if (cancelled) return;

			await fetchGames();
			if (cancelled) return;

			refreshInterval = setInterval(fetchGames, 30000);
		})();

		return () => {
			cancelled = true;
			if (refreshInterval) {
				clearInterval(refreshInterval);
				refreshInterval = null;
			}
			if (copyResetTimer) {
				clearTimeout(copyResetTimer);
				copyResetTimer = null;
			}
		};
	});
</script>

<svelte:head>
	<title>Game Records | Arc Spirits Spectate</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-gray-900 text-white">
	<!-- Main Content -->
	<main class="mx-auto max-w-6xl px-4 py-8">
		<div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div class="min-w-0">
				<h1 class="text-xl font-bold text-gray-100">Game Records</h1>
				<p class="mt-1 text-sm text-gray-400">Browse completed games and open any round.</p>
			</div>
			<div class="flex items-center gap-4">
				{#if lastRefresh}
					<span class="text-xs text-gray-500">Updated {lastRefresh.toLocaleTimeString()}</span>
				{/if}
				<button
					onclick={fetchGames}
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

		{#if loading && games.length === 0}
			<!-- Loading State -->
			<div class="flex flex-col items-center justify-center py-20">
				<div
					class="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"
				></div>
				<p class="text-gray-400">Loading games...</p>
			</div>
		{:else if error}
			<!-- Error State -->
			<div class="rounded-lg border border-red-800 bg-red-900/20 p-6 text-center">
				<svg
					class="mx-auto mb-4 h-12 w-12 text-red-500"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<h2 class="mb-2 text-lg font-semibold text-red-400">Error Loading Games</h2>
				<p class="mb-4 text-gray-400">{error}</p>
				<button
					onclick={fetchGames}
					class="rounded-md bg-red-800 px-4 py-2 transition-colors hover:bg-red-700"
				>
					Try Again
				</button>
			</div>
		{:else if games.length === 0}
			<!-- Empty State -->
			<div class="flex flex-col items-center justify-center py-20 text-center">
				<div class="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-800">
					<svg
						class="h-10 w-10 text-gray-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
						/>
					</svg>
				</div>
				<h2 class="mb-2 text-xl font-semibold">No Games Found</h2>
				<p class="max-w-md text-gray-400">
					There are no game records yet. Games will appear here when players start syncing from
					Tabletop Simulator.
				</p>
			</div>
		{:else}
			<!-- Filters -->
			<div
				class="mb-5 flex flex-col gap-3 rounded-lg border border-gray-800 bg-gray-900/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
			>
				<div>
					<div class="text-sm font-semibold text-gray-200">Game Filters</div>
					<div class="mt-1 text-xs text-gray-500">
						Showing games by verification status and turns.
					</div>
				</div>

				<div class="flex flex-wrap items-center gap-3">
					<label class="flex items-center gap-2 text-sm text-gray-300">
						<span class="text-gray-400">Status</span>
						<select
							bind:value={verificationFilter}
							class="rounded-md border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-gray-200 focus:border-purple-500 focus:outline-none"
						>
							<option value="verified">Verified ({verifiedCount()})</option>
							<option value="unverified">Unverified ({unverifiedCount()})</option>
							<option value="all">All ({games.length})</option>
						</select>
					</label>

					<label class="flex items-center gap-2 text-sm text-gray-300">
						<span class="text-gray-400">Show</span>
						<select
							bind:value={gameFilter}
							class="rounded-md border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-gray-200 focus:border-purple-500 focus:outline-none"
						>
							<option value="15plus">{MIN_TURNS_TO_SHOW}+ turns</option>
							<option value="under15">Under {MIN_TURNS_TO_SHOW} turns</option>
							<option value="all">All games</option>
						</select>
					</label>

					{#if shortGamesCount() > 0 && gameFilter !== 'under15'}
						<span class="text-xs text-gray-500">
							{shortGamesCount()} under {MIN_TURNS_TO_SHOW}
						</span>
					{/if}
				</div>
			</div>

			{#if filteredGames().length === 0}
				<!-- Filtered Empty State -->
				<div class="flex flex-col items-center justify-center py-16 text-center">
					<div class="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gray-800">
						<svg
							class="h-8 w-8 text-gray-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 6v6h4m6 0a10 10 0 11-20 0 10 10 0 0120 0z"
							/>
						</svg>
					</div>
					<h2 class="mb-2 text-lg font-semibold">No Games Match This Filter</h2>
					<p class="max-w-md text-gray-400">
						{#if verificationFilter === 'verified' && verifiedCount() === 0}
							No verified games yet. Verify games in the admin portal, or switch Status to view
							unverified games.
						{:else if verificationFilter === 'unverified' && unverifiedCount() === 0}
							No unverified games found.
						{:else if gameFilter === '15plus'}
							No games have reached {MIN_TURNS_TO_SHOW} turns yet. Switch the filter to view shorter games.
						{:else if gameFilter === 'under15'}
							No games are under {MIN_TURNS_TO_SHOW} turns right now.
						{:else}
							No games found.
						{/if}
					</p>
				</div>
			{:else}
				<!-- Games Grid -->
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each filteredGames() as game (game.game_id)}
						<div
							role="link"
							tabindex="0"
							onclick={(event) => handleGameCardClick(event, game.game_id)}
							onkeydown={(event) => handleGameCardKeydown(event, game.game_id)}
							class="group block rounded-xl border border-gray-700 bg-gray-800/50 p-5 transition-all duration-200 hover:border-purple-500/50 hover:bg-gray-800 hover:shadow-lg hover:shadow-purple-500/10"
						>
							<!-- Winner Guardian Icon & Game ID -->
							<div class="mb-4 flex items-start justify-between">
								<div class="flex items-center gap-3">
									{#if game.winner_guardian_icon}
										<div
											class="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-purple-600 to-blue-700"
										>
											<img
												src={game.winner_guardian_icon}
												alt={game.winner_guardian}
												class="h-full w-full object-cover"
											/>
										</div>
									{:else}
										<div
											class="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-blue-700 text-lg"
										>
											<svg class="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
												<path
													d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"
												/>
											</svg>
										</div>
									{/if}
									<div class="min-w-0">
										<h3
											class="truncate font-mono text-sm font-medium text-gray-200 transition-colors group-hover:text-white"
										>
											{shortenGameId(game.game_id)}
										</h3>
										{#if game.winner_guardian}
											<p class="truncate text-xs text-gray-400">
												{game.winner_guardian} • {game.winner_vp} VP
											</p>
										{/if}
									</div>
								</div>

								{#if game.verified}
									<span
										class="inline-flex items-center rounded-full bg-green-900/40 px-2 py-0.5 text-xs font-semibold text-green-200"
									>
										Verified
									</span>
								{:else}
									<span
										class="inline-flex items-center rounded-full bg-yellow-900/40 px-2 py-0.5 text-xs font-semibold text-yellow-200"
									>
										Unverified
									</span>
								{/if}
							</div>

							<!-- Game Info -->
							<div class="space-y-2 text-sm">
								<div class="flex items-center gap-2 text-gray-400">
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
										/>
									</svg>
									<span>Started: {game.started_at ? formatDate(game.started_at) : '—'}</span>
								</div>
								<div class="flex items-center gap-2 text-gray-400">
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"
										/>
									</svg>
									<span>Ended: {game.ended_at ? formatDate(game.ended_at) : '—'}</span>
								</div>
								<div class="flex items-center gap-2 text-gray-400">
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
									<span>Duration: {formatDurationHoursMinutes(game.total_duration_ms)}</span>
								</div>
								<div class="flex flex-wrap items-center gap-4">
									<div class="flex items-center gap-2 text-gray-400">
										<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
											/>
										</svg>
										<span>Players: {game.player_count}</span>
									</div>
									<div class="flex items-center gap-2 text-gray-400">
										<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
											/>
										</svg>
										<span>Round: {game.navigation_count}</span>
									</div>
									<div class="flex items-center gap-2 text-gray-400">
										<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
										<span>Median Nav: {formatDuration(game.avg_navigation_ms)}</span>
									</div>
								</div>
							</div>

							<!-- View Game Link -->
							<div
								class="mt-4 flex items-center justify-between gap-3 border-t border-gray-700 pt-4"
							>
								<div class="flex items-center gap-2 text-xs text-gray-400">
									<span class="text-gray-500">Replay</span>
									<span class="font-mono text-gray-200"
										>{toShortReplayCode(game.navigation_count)}</span
									>
									<button
										type="button"
										data-no-nav
										onclick={() => copyReplayCode(game.game_id, game.navigation_count)}
										class="rounded-md bg-gray-900/70 px-2 py-1 text-xs font-semibold text-gray-200 transition-colors hover:bg-gray-900"
										title={`Copy replay code: ${toFullReplayCode(game.game_id, game.navigation_count)}`}
									>
										{#if copiedReplayForGame === game.game_id}
											Copied
										{:else}
											Copy
										{/if}
									</button>
								</div>

								<a
									href={`/game/${encodeURIComponent(game.game_id)}`}
									class="flex items-center gap-1 text-sm text-purple-400 transition-colors group-hover:text-purple-300"
								>
									View Game
									<svg
										class="h-4 w-4 transform transition-transform group-hover:translate-x-1"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 5l7 7-7 7"
										/>
									</svg>
								</a>
							</div>
						</div>
					{/each}
				</div>

				<!-- Games Count Footer -->
				<div class="mt-8 text-center text-sm text-gray-500">
					Showing {filteredGames().length} game{filteredGames().length !== 1 ? 's' : ''}
				</div>
			{/if}
		{/if}
	</main>

	<!-- Footer -->
	<footer class="mt-auto border-t border-gray-800">
		<div class="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-gray-500">
			<p>Arc Spirits Spectate - Game record viewer for Tabletop Simulator</p>
		</div>
	</footer>
</div>

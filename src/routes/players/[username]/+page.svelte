<script lang="ts">
	import { onMount } from 'svelte';
	import {
		fetchGameResultsVerifiedForUsername,
		fetchPlayerBarrierTotalsByUsernameKey,
		fetchPlayerBarrierTotalsVerified,
		fetchPlayerBloodTotalsByUsernameKey,
		fetchPlayerBloodTotalsVerified,
		fetchPlayerFavoriteSpiritsByUsernameKey,
		fetchPlayerFavoriteSpiritsVerified,
		fetchPlayerMatchResultsByUsernameKey,
		fetchPlayerStatsVerifiedByUsername,
		fetchRatingLeaderboardByUsernameKey
	} from '$lib/supabase';
	import { loadAssets, getGuardianAsset, getSpiritAsset } from '$lib/stores/assetStore.svelte';
	import type { FavoriteSpiritEntry, GameResultRow, PlayerStatsRow, RatingLeaderboardRow } from '$lib/types';

	interface Props {
		data: {
			username: string;
		};
	}

	let { data }: Props = $props();

	let stats = $state<RatingLeaderboardRow | PlayerStatsRow | null>(null);
	let games = $state<GameResultRow[]>([]);
	let favoriteSpirits = $state<FavoriteSpiritEntry[]>([]);
	let barrierTotals = $state<{ gained: number; lost: number } | null>(null);
	let bloodTotals = $state<{ gained: number; spent: number } | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	const usernameKey = $derived(() => data.username.trim().toLowerCase());
	const displayUsername = $derived(() => stats?.username ?? data.username);

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

	onMount(async () => {
		loading = true;
		error = null;
		try {
			await loadAssets();

			const ratingRow = await fetchRatingLeaderboardByUsernameKey(usernameKey());
			if (ratingRow) {
				const [gameRows, favorites, barrier, blood] = await Promise.all([
					fetchPlayerMatchResultsByUsernameKey(usernameKey()),
					fetchPlayerFavoriteSpiritsByUsernameKey(usernameKey()),
					fetchPlayerBarrierTotalsByUsernameKey(usernameKey()),
					fetchPlayerBloodTotalsByUsernameKey(usernameKey())
				]);

				stats = ratingRow;
				games = gameRows;
				favoriteSpirits = favorites;
				barrierTotals = barrier;
				bloodTotals = blood;
			} else {
				const [statsRow, gameRows, favorites, barrier, blood] = await Promise.all([
					fetchPlayerStatsVerifiedByUsername(data.username),
					fetchGameResultsVerifiedForUsername(data.username),
					fetchPlayerFavoriteSpiritsVerified(data.username),
					fetchPlayerBarrierTotalsVerified(data.username),
					fetchPlayerBloodTotalsVerified(data.username)
				]);

				stats = statsRow;
				games = gameRows;
				favoriteSpirits = favorites;
				barrierTotals = barrier;
				bloodTotals = blood;
			}
		} catch (e) {
			console.error('Failed to load player profile:', e);
			error = e instanceof Error ? e.message : 'Failed to load player profile';
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>Player {displayUsername()} | Arc Spirits Spectate</title>
</svelte:head>

<div class="min-h-screen bg-gray-900 text-white">
	<main class="mx-auto max-w-6xl px-4 py-8">
		<div class="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
			<div class="min-w-0">
				<a href="/players" class="text-sm font-semibold text-purple-300 hover:text-purple-200"
					>← Players</a
				>
				<h1 class="mt-2 truncate text-2xl font-bold text-gray-100">{displayUsername()}</h1>
				<p class="mt-1 text-sm text-gray-400">
					Verified games only (over 10 turns). Requires a TTS username and ≥10 VP.
				</p>
			</div>
		</div>

		{#if loading}
			<div class="flex flex-col items-center justify-center py-20">
				<div
					class="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"
				></div>
				<p class="text-gray-400">Loading profile…</p>
			</div>
		{:else if error}
			<div class="rounded-lg border border-red-800 bg-red-900/20 p-6 text-center">
				<p class="text-sm text-red-300">{error}</p>
			</div>
		{:else if !stats}
			<div class="flex flex-col items-center justify-center py-16 text-center">
				<div class="mb-2 text-sm text-gray-200">No profile yet.</div>
				<div class="text-sm text-gray-400">This user has no verified games recorded.</div>
			</div>
		{:else}
			<!-- Summary cards -->
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
				<div class="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
					<div class="text-xs tracking-wide text-gray-500 uppercase">Games</div>
					<div class="mt-1 text-2xl font-bold text-gray-100">{stats.games_played}</div>
				</div>
				<div class="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
					<div class="text-xs tracking-wide text-gray-500 uppercase">Wins</div>
					<div class="mt-1 text-2xl font-bold text-gray-100">{stats.wins}</div>
				</div>
				<div class="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
					<div class="text-xs tracking-wide text-gray-500 uppercase">Avg VP</div>
					<div class="mt-1 text-2xl font-bold text-gray-100">
						{stats.avg_victory_points.toFixed(1)}
					</div>
				</div>
				<div class="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
					<div class="text-xs tracking-wide text-gray-500 uppercase">Avg Place</div>
					<div class="mt-1 text-2xl font-bold text-gray-100">{stats.avg_placement.toFixed(2)}</div>
				</div>
				<div class="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
					<div class="text-xs tracking-wide text-gray-500 uppercase">Barrier</div>
					<div class="mt-2 flex items-baseline justify-between gap-3">
						<div class="text-lg font-bold text-green-300">
							+{barrierTotals?.gained ?? 0}
						</div>
						<div class="text-lg font-bold text-red-300">-{barrierTotals?.lost ?? 0}</div>
					</div>
					<div class="mt-1 text-xs text-gray-500">Gained • Lost (verified games)</div>
				</div>
				<div class="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
					<div class="text-xs tracking-wide text-gray-500 uppercase">Arcane Blood</div>
					<div class="mt-2 flex items-baseline justify-between gap-3">
						<div class="text-lg font-bold text-green-300">
							+{bloodTotals?.gained ?? 0}
						</div>
						<div class="text-lg font-bold text-red-300">-{bloodTotals?.spent ?? 0}</div>
					</div>
					<div class="mt-1 text-xs text-gray-500">Gained • Spent (verified games)</div>
				</div>
			</div>

			<!-- Favorite spirits -->
			<div class="mt-8 rounded-xl border border-gray-800 bg-gray-900/40">
				<div class="border-b border-gray-800 px-4 py-3">
					<h2 class="text-sm font-semibold text-gray-200">Favorite Spirits</h2>
					<p class="mt-1 text-xs text-gray-500">
						Top 7 spirits from final boards across verified games.
					</p>
				</div>

				{#if favoriteSpirits.length === 0}
					<div class="px-4 py-10 text-center text-sm text-gray-400">No spirit data yet.</div>
				{:else}
					<div class="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-7">
						{#each favoriteSpirits as s (s.spiritId)}
							{@const asset = getSpiritAsset(s.spiritId)}
							<div class="rounded-lg border border-gray-800 bg-gray-900/30 p-3 text-center">
								<div
									class="mx-auto h-16 w-16 overflow-hidden rounded-lg border border-gray-700 bg-gray-800"
								>
									{#if asset?.imageUrl}
										<img
											src={asset.imageUrl}
											alt={asset.name}
											class="h-full w-full object-cover"
											loading="lazy"
											decoding="async"
										/>
									{:else}
										<div
											class="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-300"
										>
											{(asset?.name ?? s.name ?? '??').slice(0, 2)}
										</div>
									{/if}
								</div>
								<div class="mt-2 truncate text-xs font-semibold text-gray-200">
									{asset?.name ?? s.name}
								</div>
								<div class="mt-1 text-xs text-gray-500">
									{s.games} game{s.games === 1 ? '' : 's'}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Recent games -->
			<div class="mt-8 rounded-xl border border-gray-800 bg-gray-900/40">
				<div class="border-b border-gray-800 px-4 py-3">
					<h2 class="text-sm font-semibold text-gray-200">Recent Games</h2>
					<p class="mt-1 text-xs text-gray-500">Latest verified results for this player.</p>
				</div>

				{#if games.length === 0}
					<div class="px-4 py-10 text-center text-sm text-gray-400">No games found.</div>
				{:else}
					<div class="divide-y divide-gray-800">
						{#each games.slice(0, 20) as g (g.game_id)}
							{@const asset = getGuardianAsset(g.selected_character)}
							<a
								href={`/game/${encodeURIComponent(g.game_id)}`}
								class="flex items-center gap-4 px-4 py-4 hover:bg-gray-900/60"
							>
								<div
									class="h-12 w-12 overflow-hidden rounded-lg border border-gray-700 bg-gray-800"
								>
									{#if asset?.iconUrl}
										<img
											src={asset.iconUrl}
											alt={g.selected_character}
											class="h-full w-full object-cover"
											loading="lazy"
											decoding="async"
										/>
									{:else}
										<div
											class="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-300"
										>
											{g.selected_character.slice(0, 2)}
										</div>
									{/if}
								</div>
								<div class="min-w-0 flex-1">
									<div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
										<div class="truncate font-semibold text-gray-100">{g.selected_character}</div>
										<div class="text-sm text-gray-400">
											{g.victory_points} VP • Place {g.placement} / {g.player_count}
										</div>
									</div>
									<div class="mt-1 text-xs text-gray-500">
										Ended {formatTimestamp(g.ended_at)} • {g.navigation_count} rounds • {g.game_id}
									</div>
								</div>
							</a>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</main>
</div>

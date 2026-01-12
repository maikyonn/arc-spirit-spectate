<script lang="ts">
	import NavigationSelector from './NavigationSelector.svelte';
	import { toFullReplayCode, toShortReplayCode } from '$lib/replayCodes';

	interface Props {
		gameId: string;
		navigationCount: number;
		maxNavigation: number;
		isLive: boolean;
		onRoundChange: (round: number) => void;
		onToggleLive: () => void;
		roundTimestamp?: string | null;
		roundDeltaMs?: number | null;
	}

	let {
		gameId,
		navigationCount,
		maxNavigation,
		isLive,
		onRoundChange,
		onToggleLive,
		roundTimestamp = null,
		roundDeltaMs = null
	}: Props = $props();

	// Truncate game ID for display
	const displayGameId = $derived(
		gameId.length > 12 ? `${gameId.slice(0, 8)}...${gameId.slice(-4)}` : gameId
	);

	// Copy game ID to clipboard
	let copied = $state(false);
	async function copyGameId() {
		try {
			await navigator.clipboard.writeText(gameId);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch (e) {
			console.error('Failed to copy:', e);
		}
	}

	const replayCodeShort = $derived(toShortReplayCode(navigationCount));
	const replayCodeFull = $derived(toFullReplayCode(gameId, navigationCount));

	let replayCopied = $state(false);
	async function copyReplayCode() {
		try {
			await navigator.clipboard.writeText(replayCodeFull);
			replayCopied = true;
			setTimeout(() => (replayCopied = false), 2000);
		} catch (e) {
			console.error('Failed to copy replay code:', e);
		}
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
</script>

<header
	class="header flex flex-col gap-3 border-b border-gray-800 bg-gray-900/95 px-4 py-3 backdrop-blur-sm lg:flex-row lg:items-center lg:justify-between lg:px-6"
>
	<!-- Left: Game ID and Title -->
	<div class="flex items-center gap-3">
		<a
			href="/"
			class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 shadow-md shadow-purple-500/20 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30"
			aria-label="Back to games list"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="currentColor"
				class="h-6 w-6 text-white"
			>
				<path
					fill-rule="evenodd"
					d="M2.25 5.25a3 3 0 013-3h13.5a3 3 0 013 3V15a3 3 0 01-3 3h-3v.257c0 .597.237 1.17.659 1.591l.621.622a.75.75 0 01-.53 1.28h-9a.75.75 0 01-.53-1.28l.621-.622a2.25 2.25 0 00.659-1.59V18h-3a3 3 0 01-3-3V5.25zm1.5 0v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5z"
					clip-rule="evenodd"
				/>
			</svg>
		</a>
		<button
			onclick={copyGameId}
			class="group flex flex-col rounded-md px-2 py-1 transition-colors hover:bg-gray-800"
			title="Click to copy game ID"
		>
			<span class="text-sm font-semibold text-white group-hover:text-purple-300"
				>Arc Spirits Spectate</span
			>
			<span
				class="flex items-center gap-1.5 font-mono text-xs text-gray-400 group-hover:text-gray-300"
			>
				{displayGameId}
				{#if copied}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
						class="h-3 w-3 text-green-400"
					>
						<path
							fill-rule="evenodd"
							d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
							clip-rule="evenodd"
						/>
					</svg>
				{:else}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
						class="h-3 w-3 text-gray-500 opacity-0 transition-opacity group-hover:opacity-100"
					>
						<path
							fill-rule="evenodd"
							d="M15.988 3.012A2.25 2.25 0 0118 5.25v6.5A2.25 2.25 0 0115.75 14H13.5v-3.379a3 3 0 00-.879-2.121l-3.12-3.121a3 3 0 00-1.402-.791 2.252 2.252 0 011.913-1.576A2.25 2.25 0 0112.25 1h1.5a2.25 2.25 0 012.238 2.012zM11.5 3.25a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v.25h-3v-.25z"
							clip-rule="evenodd"
						/>
						<path
							d="M3.5 6A1.5 1.5 0 002 7.5v9A1.5 1.5 0 003.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L8.44 6.439A1.5 1.5 0 007.378 6H3.5z"
						/>
					</svg>
				{/if}
			</span>
		</button>

		<button
			onclick={copyReplayCode}
			class="group flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-gray-800"
			title={`Copy replay code (current round): ${replayCodeFull}`}
		>
			<span class="text-xs font-semibold text-gray-400 group-hover:text-gray-300">Replay</span>
			<span class="font-mono text-xs text-gray-200">{replayCodeShort}</span>
			{#if replayCopied}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
					class="h-4 w-4 text-green-400"
				>
					<path
						fill-rule="evenodd"
						d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
						clip-rule="evenodd"
					/>
				</svg>
			{:else}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
					class="h-4 w-4 text-gray-500 opacity-0 transition-opacity group-hover:opacity-100"
				>
					<path
						fill-rule="evenodd"
						d="M15.988 3.012A2.25 2.25 0 0118 5.25v6.5A2.25 2.25 0 0115.75 14H13.5v-3.379a3 3 0 00-.879-2.121l-3.12-3.121a3 3 0 00-1.402-.791 2.252 2.252 0 011.913-1.576A2.25 2.25 0 0112.25 1h1.5a2.25 2.25 0 012.238 2.012zM11.5 3.25a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v.25h-3v-.25z"
						clip-rule="evenodd"
					/>
					<path
						d="M3.5 6A1.5 1.5 0 002 7.5v9A1.5 1.5 0 003.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L8.44 6.439A1.5 1.5 0 007.378 6H3.5z"
					/>
				</svg>
			{/if}
		</button>
	</div>

	<!-- Center: Navigation Controls -->
	<div class="flex-1 lg:flex lg:justify-center lg:px-4">
		<div class="w-full lg:max-w-md">
			<NavigationSelector
				currentRound={navigationCount}
				maxRound={maxNavigation}
				{onRoundChange}
				{isLive}
				{onToggleLive}
			/>

			{#if roundTimestamp || roundDeltaMs != null}
				<div
					class="mt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs text-gray-400"
				>
					<div class="flex items-center gap-1.5">
						<span class="text-gray-500">Timestamp</span>
						<span class="font-mono text-gray-200">{formatTimestamp(roundTimestamp)}</span>
					</div>
					{#if roundDeltaMs != null}
						<div class="flex items-center gap-1.5">
							<span class="text-gray-500">Round time</span>
							<span class="font-mono text-gray-200">{formatDuration(roundDeltaMs)}</span>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<!-- Right: Export + Connection Status -->
	<div class="flex items-center justify-end gap-2">
		<a
			href={`/game/${encodeURIComponent(gameId)}/export?auto=1`}
			target="_blank"
			rel="noopener noreferrer"
			class="flex items-center gap-2 rounded-full border border-purple-800 bg-purple-950/60 px-3 py-1.5 text-sm font-semibold text-purple-200 shadow-sm shadow-purple-500/10 transition-colors hover:bg-purple-950/80"
			title="Export game history as PDF (one page per round)"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="currentColor"
				class="h-4 w-4"
			>
				<path d="M7.5 3.75A2.25 2.25 0 0 1 9.75 1.5h4.5A2.25 2.25 0 0 1 16.5 3.75V6h-9V3.75Z" />
				<path
					fill-rule="evenodd"
					d="M6 7.5a3 3 0 0 0-3 3v3.75a.75.75 0 0 0 .75.75H6v2.25A2.25 2.25 0 0 0 8.25 19.5h7.5A2.25 2.25 0 0 0 18 17.25V15h2.25a.75.75 0 0 0 .75-.75V10.5a3 3 0 0 0-3-3H6Zm2.25 9a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75Z"
					clip-rule="evenodd"
				/>
			</svg>
			<span class="hidden sm:inline">Export PDF</span>
			<span class="sm:hidden">PDF</span>
		</a>

		<div class="hidden items-center gap-2 lg:flex">
			{#if isLive}
				<div
					class="status-badge flex items-center gap-2 rounded-full border border-green-800 bg-green-950/80 px-3 py-1.5 shadow-sm shadow-green-500/10"
				>
					<!-- Pulsing dot -->
					<span class="relative flex h-2.5 w-2.5">
						<span
							class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"
						></span>
						<span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
					</span>
					<span class="text-sm font-semibold text-green-400">Connected</span>
				</div>
			{:else}
				<div
					class="status-badge flex items-center gap-2 rounded-full border border-gray-700 bg-gray-800/80 px-3 py-1.5"
				>
					<span class="h-2.5 w-2.5 rounded-full bg-gray-500"></span>
					<span class="text-sm font-medium text-gray-400">Paused</span>
				</div>
			{/if}
		</div>
	</div>
</header>

<style>
	.header {
		position: sticky;
		top: var(--app-topbar-height, 0px);
		z-index: 40;
	}

	.status-badge {
		animation: fade-in 0.2s ease-out;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>

<script lang="ts">
	import HexGrid from '$lib/components/HexGrid.svelte';
	import type { HandDrawSnapshot, RuneSlotSnapshot, Spirit } from '$lib/types';

	interface Props {
		playerColor: 'Red' | 'Blue' | 'Orange' | 'Green' | 'Purple' | 'Yellow';
		characterName: string;
		spirits: Spirit[];
		blood: number;
		barrier: number;
		statusLevel: number;
		statusToken: string | null;
		victoryPoints: number;
		runes: RuneSlotSnapshot[];
		handDraws: HandDrawSnapshot[];
		spiritAssets: Map<string, string>;
		runeIcons: Map<string, string>;
		statusIcons: Map<string, string>; // key: lower(statusToken)
		guardianAssets: Map<string, string>;
		isLoading?: boolean;
	}

	const PLAYER_COLORS: Record<
		string,
		{ bg: string; border: string; text: string; accent: string; glow: string }
	> = {
		Red: {
			bg: 'bg-red-500',
			border: 'border-red-500',
			text: 'text-red-500',
			accent: 'bg-red-600',
			glow: 'shadow-red-500/20'
		},
		Blue: {
			bg: 'bg-blue-500',
			border: 'border-blue-500',
			text: 'text-blue-500',
			accent: 'bg-blue-600',
			glow: 'shadow-blue-500/20'
		},
		Orange: {
			bg: 'bg-orange-500',
			border: 'border-orange-500',
			text: 'text-orange-500',
			accent: 'bg-orange-600',
			glow: 'shadow-orange-500/20'
		},
		Green: {
			bg: 'bg-green-500',
			border: 'border-green-500',
			text: 'text-green-500',
			accent: 'bg-green-600',
			glow: 'shadow-green-500/20'
		},
		Purple: {
			bg: 'bg-purple-500',
			border: 'border-purple-500',
			text: 'text-purple-500',
			accent: 'bg-purple-600',
			glow: 'shadow-purple-500/20'
		},
		Yellow: {
			bg: 'bg-yellow-500',
			border: 'border-yellow-500',
			text: 'text-yellow-500',
			accent: 'bg-yellow-600',
			glow: 'shadow-yellow-500/20'
		}
	};

	let {
		playerColor,
		characterName,
		spirits,
		blood,
		barrier,
		statusLevel,
		statusToken,
		victoryPoints,
		runes,
		handDraws,
		spiritAssets,
		runeIcons,
		statusIcons,
		guardianAssets,
		isLoading = false
	}: Props = $props();

	const colors = $derived(PLAYER_COLORS[playerColor] ?? PLAYER_COLORS.Red);
	const guardianIconUrl = $derived(guardianAssets.get(characterName) ?? '');

	const runeSlots = $derived(() => {
		const bySlot = new Map((runes ?? []).map((r) => [r.slotIndex, r]));
		return [1, 2, 3, 4].map((slotIndex) => bySlot.get(slotIndex) ?? { slotIndex, hasRune: false });
	});

	const displayHandDraws = $derived(() => (handDraws ?? []).slice(0, 8));
	const statusDisplay = $derived(() => (statusToken ? `${statusToken} (${statusLevel})` : '—'));
	const statusIconUrl = $derived(() =>
		statusToken ? (statusIcons.get(statusToken.toLowerCase()) ?? null) : null
	);

	function formatBagLabel(name?: string): string {
		if (!name) return '';
		if (name === 'Spirit World Bag') return 'Spirit World';
		if (name === 'Abyss Fallen Spirits') return 'Abyss Fallen';
		return name.replace(/ Bag$/, '');
	}
</script>

{#if isLoading}
	<!-- Loading Skeleton -->
	<div
		class="player-panel-skeleton flex flex-col overflow-hidden rounded-lg border-2 border-gray-700 bg-gray-900 shadow-lg"
	>
		<!-- Header Skeleton -->
		<div class="flex items-center gap-3 bg-gray-800 px-4 py-3">
			<div class="skeleton-pulse h-10 w-1.5 rounded-full bg-gray-700"></div>
			<div class="skeleton-pulse h-10 w-10 rounded-full bg-gray-700"></div>
			<div class="flex flex-1 items-end justify-between gap-3">
				<div class="flex flex-col gap-1.5">
					<div class="skeleton-pulse h-3 w-12 rounded bg-gray-700"></div>
					<div class="skeleton-pulse h-5 w-24 rounded bg-gray-700"></div>
				</div>
				<div class="flex flex-wrap items-center justify-end gap-1.5">
					<div class="skeleton-pulse h-5 w-10 rounded-full bg-gray-700"></div>
					<div class="skeleton-pulse h-5 w-10 rounded-full bg-gray-700"></div>
					<div class="skeleton-pulse h-5 w-16 rounded-full bg-gray-700"></div>
					<div class="skeleton-pulse h-5 w-10 rounded-full bg-gray-700"></div>
				</div>
			</div>
		</div>

		<!-- Grid Skeleton -->
		<div class="bg-gray-850 flex flex-1 items-center justify-center px-4 py-4">
			<HexGrid isLoading={true} />
		</div>
	</div>
{:else}
	<div
		class="player-panel flex flex-col overflow-hidden rounded-lg border-2 bg-gray-900 shadow-lg transition-all duration-300 hover:shadow-xl {colors.border} {colors.glow}"
	>
		<!-- Header -->
		<div class="flex items-center gap-3 bg-gray-800 px-4 py-3">
			<!-- Color accent bar -->
			<div
				class="h-10 w-1.5 rounded-full transition-transform duration-200 hover:scale-y-110 {colors.bg}"
			></div>

			<!-- Guardian icon -->
			{#if guardianIconUrl}
				<img
					src={guardianIconUrl}
					alt={characterName}
					class="h-10 w-10 rounded-full border-2 object-cover transition-transform duration-200 hover:scale-105 {colors.border}"
				/>
			{:else}
				<div
					class="flex h-10 w-10 items-center justify-center rounded-full border-2 bg-gray-700 transition-all duration-200 hover:bg-gray-600 {colors.border}"
				>
					<span class="text-lg font-bold text-gray-400">
						{characterName.charAt(0).toUpperCase()}
					</span>
				</div>
			{/if}

			<!-- Player info -->
			<div class="flex min-w-0 flex-1 flex-col">
				<span class="text-xs font-semibold tracking-wider uppercase {colors.text}">
					{playerColor}
				</span>
				<div class="flex min-w-0 items-start justify-between gap-3">
					<span class="min-w-0 truncate text-lg font-bold text-white">
						{characterName}
					</span>

					<!-- Top-right stats -->
					<div class="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
						<div
							class="stat-chip flex items-center gap-1 rounded-full border border-gray-700 bg-gray-900/40 px-2 py-0.5 text-xs font-semibold text-gray-200"
							title="Arcane Blood"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								class="h-3.5 w-3.5 text-red-400"
							>
								<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0L12 2.69z" />
							</svg>
							<span class="tabular-nums">{blood}</span>
						</div>

						<div
							class="stat-chip flex items-center gap-1 rounded-full border border-gray-700 bg-gray-900/40 px-2 py-0.5 text-xs font-semibold text-gray-200"
							title="Barrier"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								class="h-3.5 w-3.5 text-sky-400"
							>
								<path
									fill-rule="evenodd"
									d="M12 1.5a.75.75 0 01.394.112l7.5 4.5a.75.75 0 01.356.638v6.37a9.75 9.75 0 01-7.89 9.577.75.75 0 01-.72 0A9.75 9.75 0 013.75 13.12V6.75a.75.75 0 01.356-.638l7.5-4.5A.75.75 0 0112 1.5zm0 2.116L5.25 7.5v5.62a8.25 8.25 0 006.75 8.11 8.25 8.25 0 006.75-8.11V7.5L12 3.616z"
									clip-rule="evenodd"
								/>
							</svg>
							<span class="tabular-nums">{barrier}</span>
						</div>

						<div
							class="stat-chip flex max-w-[10rem] items-center gap-1 rounded-full border border-gray-700 bg-gray-900/40 px-2 py-0.5 text-xs font-semibold text-gray-200"
							title={`Status: ${statusDisplay()}`}
						>
							{#if statusIconUrl()}
								<img
									src={statusIconUrl() ?? ''}
									alt={statusToken ?? 'Status'}
									class="h-3.5 w-3.5 rounded-full object-contain"
									loading="lazy"
								/>
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="currentColor"
									class="h-3.5 w-3.5 text-purple-300"
								>
									<path
										d="M12 2a.75.75 0 01.75.75V4.5h1.5a.75.75 0 010 1.5h-1.5v1.75a.75.75 0 01-1.5 0V6h-1.5a.75.75 0 010-1.5h1.5V2.75A.75.75 0 0112 2z"
									/>
									<path
										fill-rule="evenodd"
										d="M12 9a6.75 6.75 0 100 13.5A6.75 6.75 0 0012 9zm-5.25 6.75a5.25 5.25 0 1110.5 0 5.25 5.25 0 01-10.5 0z"
										clip-rule="evenodd"
									/>
								</svg>
							{/if}
							<span class="truncate">{statusDisplay()}</span>
						</div>

						<div
							class="stat-chip flex items-center gap-1 rounded-full border border-gray-700 bg-gray-900/40 px-2 py-0.5 text-xs font-semibold text-gray-200"
							title="Victory Points"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								class="h-3.5 w-3.5 text-yellow-400"
							>
								<path
									fill-rule="evenodd"
									d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
									clip-rule="evenodd"
								/>
							</svg>
							<span class="tabular-nums">{victoryPoints}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Spirit Grid -->
		<div class="bg-gray-850 flex flex-1 flex-col items-center justify-center gap-3 px-4 py-4">
			<HexGrid {spirits} {spiritAssets} />

			<!-- Runes + Hand Draws -->
			<div class="w-full max-w-sm space-y-2">
				<!-- Rune Slots -->
				<div class="flex items-center justify-between gap-3">
					<span class="text-xs font-semibold tracking-wide text-gray-500 uppercase">Runes</span>
					<div class="flex items-center gap-1.5">
						{#each runeSlots() as rune (rune.slotIndex)}
							{@const runeIconUrl =
								rune.hasRune && rune.id ? (runeIcons.get(rune.id) ?? null) : null}
							<div
								class="rune-token flex items-center justify-center overflow-hidden rounded-full border text-[9px] font-extrabold tracking-wide uppercase"
								class:filled={rune.hasRune}
								title={`Slot ${rune.slotIndex}: ${rune.hasRune ? (rune.name ?? 'Rune') : 'Empty'}`}
								aria-label={`Rune slot ${rune.slotIndex}: ${rune.hasRune ? (rune.name ?? 'Rune') : 'Empty'}`}
							>
								{#if runeIconUrl}
									<img
										src={runeIconUrl}
										alt={rune.name ?? 'Rune'}
										class="h-full w-full object-contain p-0.5"
										loading="lazy"
									/>
								{:else if rune.hasRune}
									{(rune.name ?? 'R').slice(0, 1)}
								{/if}
							</div>
						{/each}
					</div>
				</div>

				<!-- Hand Draws This Navigation -->
				{#if displayHandDraws().length > 0}
					<div class="space-y-1">
						<div class="flex items-center justify-between">
							<span class="text-xs font-semibold tracking-wide text-gray-500 uppercase"
								>Hand Draws</span
							>
							<span class="text-[10px] text-gray-600">{handDraws.length} total</span>
						</div>
						<div class="flex flex-wrap gap-1.5">
							{#each displayHandDraws() as draw, i (`${draw.guid ?? 'draw'}-${i}`)}
								<span
									class="max-w-[12rem] truncate rounded-full border border-gray-700 bg-gray-900/40 px-2 py-0.5 text-[11px] text-gray-200"
									title={`${draw.name ?? 'Unknown'}${draw.cost != null ? ` (Cost ${draw.cost})` : ''}${draw.sourceBag ? ` — ${formatBagLabel(draw.sourceBag)}` : ''}`}
								>
									{draw.name ?? 'Unknown'}
									{#if draw.cost != null}
										<span class="text-gray-400"> · {draw.cost}</span>
									{/if}
									{#if draw.sourceBag}
										<span class="text-gray-500"> · {formatBagLabel(draw.sourceBag)}</span>
									{/if}
								</span>
							{/each}
						</div>
						{#if handDraws.length > displayHandDraws().length}
							<div class="text-[10px] text-gray-600">
								Showing {displayHandDraws().length} of {handDraws.length}
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	/* Custom background color not in default Tailwind palette */
	.bg-gray-850 {
		background-color: rgb(30 32 38);
	}

	/* Loading skeleton pulse animation */
	.skeleton-pulse {
		animation: skeleton-pulse 1.5s ease-in-out infinite;
	}

	@keyframes skeleton-pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	/* Fade-in animation for loaded content */
	.player-panel {
		animation: fade-in 0.3s ease-out;
	}

	.rune-token {
		height: 16px;
		width: 16px;
		border-color: rgb(55 65 81);
		background: rgba(17, 24, 39, 0.4);
		color: rgba(255, 255, 255, 0.8);
	}

	.rune-token.filled {
		border-color: rgba(192, 132, 252, 0.55);
		background: rgba(124, 58, 237, 0.65);
		box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.12);
		color: rgba(255, 255, 255, 0.95);
	}

	@media (min-width: 1024px) {
		.rune-token {
			height: 18px;
			width: 18px;
		}
	}

	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>

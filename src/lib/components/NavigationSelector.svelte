<script lang="ts">
	interface Props {
		currentRound: number;
		maxRound: number;
		onRoundChange: (round: number) => void;
		isLive: boolean;
		onToggleLive: () => void;
	}

	let { currentRound, maxRound, onRoundChange, isLive, onToggleLive }: Props = $props();

	const canGoPrevious = $derived(!isLive && currentRound > 1);
	const canGoNext = $derived(!isLive && currentRound < maxRound);
	const canGoFirst = $derived(!isLive && currentRound > 1);
	const canGoLast = $derived(!isLive && currentRound < maxRound);

	function goToFirst() {
		if (canGoFirst) onRoundChange(1);
	}

	function goToPrevious() {
		if (canGoPrevious) onRoundChange(currentRound - 1);
	}

	function goToNext() {
		if (canGoNext) onRoundChange(currentRound + 1);
	}

	function goToLast() {
		if (canGoLast) onRoundChange(maxRound);
	}

	function handleSliderChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const newRound = parseInt(target.value, 10);
		if (!isNaN(newRound) && newRound !== currentRound) {
			onRoundChange(newRound);
		}
	}
</script>

<div class="flex flex-col gap-3 rounded-lg bg-gray-800 px-4 py-3">
	<!-- Main navigation row -->
	<div class="flex items-center justify-between gap-4">
		<!-- Navigation buttons and round display -->
		<div class="flex items-center gap-2">
			<!-- First button -->
			<button
				type="button"
				onclick={goToFirst}
				disabled={!canGoFirst}
				class="nav-button"
				class:nav-button-disabled={!canGoFirst}
				aria-label="Go to first round"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
					class="h-4 w-4"
				>
					<path
						d="M15.79 14.77a.75.75 0 01-1.06.02l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 111.04 1.08L11.832 10l3.938 3.71a.75.75 0 01.02 1.06zm-6 0a.75.75 0 01-1.06.02l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 111.04 1.08L5.832 10l3.938 3.71a.75.75 0 01.02 1.06z"
					/>
				</svg>
			</button>

			<!-- Previous button -->
			<button
				type="button"
				onclick={goToPrevious}
				disabled={!canGoPrevious}
				class="nav-button"
				class:nav-button-disabled={!canGoPrevious}
				aria-label="Go to previous round"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
					class="h-4 w-4"
				>
					<path
						fill-rule="evenodd"
						d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
						clip-rule="evenodd"
					/>
				</svg>
			</button>

			<!-- Round display -->
			<div class="min-w-[120px] text-center">
				<span class="text-sm font-medium text-gray-300">Round</span>
				<span class="mx-2 text-lg font-bold text-white">{currentRound}</span>
				<span class="text-sm font-medium text-gray-500">/</span>
				<span class="ml-1 text-sm font-medium text-gray-400">{maxRound}</span>
			</div>

			<!-- Next button -->
			<button
				type="button"
				onclick={goToNext}
				disabled={!canGoNext}
				class="nav-button"
				class:nav-button-disabled={!canGoNext}
				aria-label="Go to next round"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
					class="h-4 w-4"
				>
					<path
						fill-rule="evenodd"
						d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
						clip-rule="evenodd"
					/>
				</svg>
			</button>

			<!-- Last button -->
			<button
				type="button"
				onclick={goToLast}
				disabled={!canGoLast}
				class="nav-button"
				class:nav-button-disabled={!canGoLast}
				aria-label="Go to last round"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
					class="h-4 w-4"
				>
					<path
						d="M4.21 5.23a.75.75 0 011.06-.02l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.04-1.08L8.168 10 4.23 6.29a.75.75 0 01-.02-1.06zm6 0a.75.75 0 011.06-.02l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.04-1.08L14.168 10 10.23 6.29a.75.75 0 01-.02-1.06z"
					/>
				</svg>
			</button>
		</div>

		<!-- Live toggle button -->
		<button
			type="button"
			onclick={onToggleLive}
			class="live-button"
			class:live-button-active={isLive}
			aria-label={isLive ? 'Disable live mode' : 'Enable live mode'}
			aria-pressed={isLive}
		>
			<span class="live-indicator" class:live-indicator-active={isLive}></span>
			<span class="text-sm font-medium">Live</span>
		</button>
	</div>

	<!-- Slider for quick navigation -->
	{#if maxRound > 1}
		<div class="flex items-center gap-3">
			<span class="text-xs text-gray-500">1</span>
			<input
				type="range"
				min="1"
				max={maxRound}
				value={currentRound}
				oninput={handleSliderChange}
				disabled={isLive}
				class="slider"
				class:slider-disabled={isLive}
				aria-label="Round slider"
			/>
			<span class="text-xs text-gray-500">{maxRound}</span>
		</div>
	{/if}
</div>

<style>
	/* Navigation button base styles */
	.nav-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 0.375rem;
		background-color: rgb(55 65 81); /* gray-700 */
		color: rgb(229 231 235); /* gray-200 */
		transition:
			background-color 150ms ease,
			color 150ms ease;
	}

	.nav-button:hover:not(:disabled) {
		background-color: rgb(75 85 99); /* gray-600 */
		color: white;
	}

	.nav-button:active:not(:disabled) {
		background-color: rgb(107 114 128); /* gray-500 */
	}

	.nav-button-disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* Live button styles */
	.live-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background-color: rgb(55 65 81); /* gray-700 */
		color: rgb(156 163 175); /* gray-400 */
		transition:
			background-color 150ms ease,
			color 150ms ease;
	}

	.live-button:hover {
		background-color: rgb(75 85 99); /* gray-600 */
	}

	.live-button-active {
		background-color: rgb(20 83 45); /* green-900 */
		color: rgb(134 239 172); /* green-300 */
	}

	.live-button-active:hover {
		background-color: rgb(22 101 52); /* green-800 */
	}

	/* Live indicator dot */
	.live-indicator {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 9999px;
		background-color: rgb(107 114 128); /* gray-500 */
	}

	.live-indicator-active {
		background-color: rgb(74 222 128); /* green-400 */
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	/* Slider styles */
	.slider {
		flex: 1;
		height: 0.375rem;
		border-radius: 9999px;
		background-color: rgb(55 65 81); /* gray-700 */
		appearance: none;
		cursor: pointer;
	}

	.slider::-webkit-slider-thumb {
		appearance: none;
		width: 1rem;
		height: 1rem;
		border-radius: 9999px;
		background-color: rgb(96 165 250); /* blue-400 */
		cursor: pointer;
		transition:
			background-color 150ms ease,
			transform 150ms ease;
	}

	.slider::-webkit-slider-thumb:hover {
		background-color: rgb(147 197 253); /* blue-300 */
		transform: scale(1.1);
	}

	.slider::-moz-range-thumb {
		width: 1rem;
		height: 1rem;
		border: none;
		border-radius: 9999px;
		background-color: rgb(96 165 250); /* blue-400 */
		cursor: pointer;
		transition:
			background-color 150ms ease,
			transform 150ms ease;
	}

	.slider::-moz-range-thumb:hover {
		background-color: rgb(147 197 253); /* blue-300 */
		transform: scale(1.1);
	}

	.slider::-moz-range-track {
		background-color: rgb(55 65 81); /* gray-700 */
		border-radius: 9999px;
		height: 0.375rem;
	}

	.slider-disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.slider-disabled::-webkit-slider-thumb {
		cursor: not-allowed;
	}

	.slider-disabled::-moz-range-thumb {
		cursor: not-allowed;
	}
</style>

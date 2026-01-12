<script lang="ts">
	interface Props {
		title?: string;
		message: string;
		onRetry?: () => void;
		variant?: 'error' | 'warning' | 'info';
	}

	let { title = 'Error', message, onRetry, variant = 'error' }: Props = $props();

	const variantStyles = {
		error: {
			bg: 'bg-red-950/50',
			border: 'border-red-800',
			icon: 'text-red-500',
			title: 'text-red-400',
			button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
		},
		warning: {
			bg: 'bg-yellow-950/50',
			border: 'border-yellow-800',
			icon: 'text-yellow-500',
			title: 'text-yellow-400',
			button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
		},
		info: {
			bg: 'bg-blue-950/50',
			border: 'border-blue-800',
			icon: 'text-blue-500',
			title: 'text-blue-400',
			button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
		}
	};

	const styles = $derived(variantStyles[variant]);
</script>

<div
	class="error-display flex flex-col items-center gap-4 rounded-lg border p-8 {styles.bg} {styles.border}"
>
	<!-- Icon -->
	{#if variant === 'error'}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="currentColor"
			class="h-12 w-12 {styles.icon}"
		>
			<path
				fill-rule="evenodd"
				d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
				clip-rule="evenodd"
			/>
		</svg>
	{:else if variant === 'warning'}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="currentColor"
			class="h-12 w-12 {styles.icon}"
		>
			<path
				fill-rule="evenodd"
				d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
				clip-rule="evenodd"
			/>
		</svg>
	{:else}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="currentColor"
			class="h-12 w-12 {styles.icon}"
		>
			<path
				fill-rule="evenodd"
				d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
				clip-rule="evenodd"
			/>
		</svg>
	{/if}

	<!-- Title -->
	<h2 class="text-lg font-semibold {styles.title}">
		{title}
	</h2>

	<!-- Message -->
	<p class="max-w-md text-center text-gray-400">
		{message}
	</p>

	<!-- Retry Button -->
	{#if onRetry}
		<button
			onclick={onRetry}
			class="mt-2 flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-white transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:outline-none {styles.button}"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 20 20"
				fill="currentColor"
				class="h-4 w-4"
			>
				<path
					fill-rule="evenodd"
					d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
					clip-rule="evenodd"
				/>
			</svg>
			Try Again
		</button>
	{/if}
</div>

<style>
	.error-display {
		animation: fade-in 0.3s ease-out;
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

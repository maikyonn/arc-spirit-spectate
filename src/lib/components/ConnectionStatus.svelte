<script lang="ts">
	interface Props {
		isConnected: boolean;
		isReconnecting?: boolean;
		onReconnect?: () => void;
	}

	let { isConnected, isReconnecting = false, onReconnect }: Props = $props();
</script>

{#if !isConnected}
	<div class="connection-banner fixed bottom-4 left-1/2 z-50 -translate-x-1/2 transform">
		<div
			class="flex items-center gap-3 rounded-lg border border-yellow-800 bg-yellow-950/90 px-4 py-3 shadow-lg backdrop-blur-sm"
		>
			{#if isReconnecting}
				<!-- Reconnecting state -->
				<div
					class="h-4 w-4 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent"
				></div>
				<span class="text-sm font-medium text-yellow-400">Reconnecting...</span>
			{:else}
				<!-- Disconnected state -->
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
					class="h-5 w-5 text-yellow-500"
				>
					<path
						fill-rule="evenodd"
						d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
						clip-rule="evenodd"
					/>
				</svg>
				<span class="text-sm font-medium text-yellow-400">Connection lost</span>
				{#if onReconnect}
					<button
						onclick={onReconnect}
						class="ml-2 rounded-md bg-yellow-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-yellow-500 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-yellow-950 focus:outline-none"
					>
						Reconnect
					</button>
				{/if}
			{/if}
		</div>
	</div>
{/if}

<style>
	.connection-banner {
		animation: slide-up 0.3s ease-out;
	}

	@keyframes slide-up {
		from {
			opacity: 0;
			transform: translate(-50%, 20px);
		}
		to {
			opacity: 1;
			transform: translate(-50%, 0);
		}
	}
</style>

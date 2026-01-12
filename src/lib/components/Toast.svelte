<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		message: string;
		type?: 'info' | 'success' | 'warning';
		show: boolean;
		autoDismiss?: boolean;
		dismissAfter?: number;
		onDismiss?: () => void;
		onAction?: () => void;
		actionLabel?: string;
	}

	let {
		message,
		type = 'info',
		show,
		autoDismiss = true,
		dismissAfter = 5000,
		onDismiss,
		onAction,
		actionLabel
	}: Props = $props();

	let visible = $state(false);
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	// Handle visibility with animation
	$effect(() => {
		if (show) {
			visible = true;
			if (autoDismiss) {
				if (timeoutId) clearTimeout(timeoutId);
				timeoutId = setTimeout(() => {
					handleDismiss();
				}, dismissAfter);
			}
		}
	});

	function handleDismiss() {
		visible = false;
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
		// Small delay for exit animation
		setTimeout(() => {
			onDismiss?.();
		}, 150);
	}

	function handleAction() {
		onAction?.();
		handleDismiss();
	}

	// Cleanup on unmount
	onMount(() => {
		return () => {
			if (timeoutId) clearTimeout(timeoutId);
		};
	});

	// Type-based styling
	const typeStyles = {
		info: {
			bg: 'bg-blue-900/90',
			border: 'border-blue-700',
			icon: 'text-blue-400',
			text: 'text-blue-100'
		},
		success: {
			bg: 'bg-green-900/90',
			border: 'border-green-700',
			icon: 'text-green-400',
			text: 'text-green-100'
		},
		warning: {
			bg: 'bg-yellow-900/90',
			border: 'border-yellow-700',
			icon: 'text-yellow-400',
			text: 'text-yellow-100'
		}
	};

	const styles = $derived(typeStyles[type]);
</script>

{#if show}
	<div class="toast-container" class:toast-visible={visible} class:toast-hidden={!visible}>
		<div class="toast {styles.bg} {styles.border}">
			<!-- Icon -->
			<div class="toast-icon {styles.icon}">
				{#if type === 'info'}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
						class="h-5 w-5"
					>
						<path
							fill-rule="evenodd"
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
							clip-rule="evenodd"
						/>
					</svg>
				{:else if type === 'success'}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
						class="h-5 w-5"
					>
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
							clip-rule="evenodd"
						/>
					</svg>
				{:else}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
						class="h-5 w-5"
					>
						<path
							fill-rule="evenodd"
							d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
							clip-rule="evenodd"
						/>
					</svg>
				{/if}
			</div>

			<!-- Message -->
			<p class="toast-message {styles.text}">{message}</p>

			<!-- Action button (optional) -->
			{#if onAction && actionLabel}
				<button type="button" onclick={handleAction} class="toast-action">
					{actionLabel}
				</button>
			{/if}

			<!-- Dismiss button -->
			<button
				type="button"
				onclick={handleDismiss}
				class="toast-dismiss"
				aria-label="Dismiss notification"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
					class="h-4 w-4"
				>
					<path
						d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
					/>
				</svg>
			</button>
		</div>
	</div>
{/if}

<style>
	.toast-container {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		z-index: 50;
		transition:
			opacity 150ms ease,
			transform 150ms ease;
	}

	.toast-visible {
		opacity: 1;
		transform: translateY(0);
	}

	.toast-hidden {
		opacity: 0;
		transform: translateY(1rem);
	}

	.toast {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		border-radius: 0.5rem;
		border-width: 1px;
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.3),
			0 4px 6px -4px rgba(0, 0, 0, 0.2);
		backdrop-filter: blur(8px);
		max-width: 24rem;
	}

	.toast-icon {
		flex-shrink: 0;
	}

	.toast-message {
		flex: 1;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.toast-action {
		flex-shrink: 0;
		padding: 0.375rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.025em;
		color: rgb(147 197 253);
		background-color: rgba(59, 130, 246, 0.2);
		border-radius: 0.375rem;
		transition: background-color 150ms ease;
	}

	.toast-action:hover {
		background-color: rgba(59, 130, 246, 0.3);
	}

	.toast-dismiss {
		flex-shrink: 0;
		padding: 0.25rem;
		color: rgb(156 163 175);
		border-radius: 0.25rem;
		transition:
			color 150ms ease,
			background-color 150ms ease;
	}

	.toast-dismiss:hover {
		color: rgb(229 231 235);
		background-color: rgba(255, 255, 255, 0.1);
	}
</style>

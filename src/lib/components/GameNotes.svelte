<script lang="ts">
	import { marked } from 'marked';
	import type { GameNotes, PlayerFeedback } from '$lib/types';

	// Configure marked
	marked.setOptions({
		breaks: true,
		gfm: true
	});

	interface Props {
		notes: GameNotes | null;
		feedback: PlayerFeedback[];
		onEditNotes?: () => void;
		onAddFeedback?: () => void;
	}

	let { notes, feedback, onEditNotes, onAddFeedback }: Props = $props();

	// Calculate average ratings
	const averageRatings = $derived(() => {
		if (feedback.length === 0) return null;
		const sum = feedback.reduce(
			(acc, f) => ({
				complexity: acc.complexity + f.rating_complexity,
				enjoyment: acc.enjoyment + f.rating_enjoyment,
				othersEnjoyment: acc.othersEnjoyment + f.rating_others_enjoyment
			}),
			{ complexity: 0, enjoyment: 0, othersEnjoyment: 0 }
		);
		return {
			complexity: (sum.complexity / feedback.length).toFixed(1),
			enjoyment: (sum.enjoyment / feedback.length).toFixed(1),
			othersEnjoyment: (sum.othersEnjoyment / feedback.length).toFixed(1)
		};
	});

	// Format date nicely
	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Check if there's any content to display
	const hasContent = $derived(
		notes?.summary || (notes?.improvements && notes.improvements.length > 0) || feedback.length > 0
	);
</script>

{#if hasContent || onEditNotes}
	<section class="game-notes-container">
		<!-- Decorative corner accents -->
		<div class="corner-accent top-left"></div>
		<div class="corner-accent top-right"></div>
		<div class="corner-accent bottom-left"></div>
		<div class="corner-accent bottom-right"></div>

		<!-- Section Header -->
		<header class="notes-header">
			<div class="header-line"></div>
			<h2 class="header-title">
				<span class="title-accent">Game</span> Analysis
			</h2>
			<div class="header-line"></div>
		</header>

		<div class="notes-content">
			<!-- Host Summary Section -->
			{#if notes?.summary}
				<div class="summary-section">
					<div class="section-label">
						<span class="label-icon">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
								<path
									d="M3.5 2.75a.75.75 0 00-1.5 0v14.5a.75.75 0 001.5 0v-4.392l1.657-.348a6.449 6.449 0 014.271.572 7.948 7.948 0 005.965.524l2.078-.64A.75.75 0 0018 11.75V3.332a.75.75 0 00-.96-.72l-2.142.658a6.45 6.45 0 01-4.635-.468 7.949 7.949 0 00-5.498-.648L3.5 2.475v.275z"
								/>
							</svg>
						</span>
						Host Summary
					</div>
					<div class="summary-text">
						{@html marked.parse(notes.summary)}
					</div>
				</div>
			{/if}

			<!-- Improvements List -->
			{#if notes?.improvements && notes.improvements.length > 0}
				<div class="improvements-section">
					<div class="section-label">
						<span class="label-icon">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z"
									clip-rule="evenodd"
								/>
							</svg>
						</span>
						Areas for Improvement
					</div>
					<ul class="improvements-list">
						{#each notes.improvements as improvement, i}
							<li class="improvement-item" style="--delay: {i * 0.1}s">
								<span class="improvement-number">{String(i + 1).padStart(2, '0')}</span>
								<span class="improvement-text">{improvement}</span>
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			<!-- Player Ratings Overview -->
			{#if feedback.length > 0}
				{@const avg = averageRatings()}
				{#if avg}
					<div class="ratings-overview">
						<div class="section-label">
							<span class="label-icon">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
									<path
										fill-rule="evenodd"
										d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
										clip-rule="evenodd"
									/>
								</svg>
							</span>
							Player Ratings
							<span class="feedback-count"
								>({feedback.length} review{feedback.length !== 1 ? 's' : ''})</span
							>
						</div>
						<div class="ratings-grid">
							<div class="rating-card complexity">
								<div class="rating-label">Complexity</div>
								<div class="rating-value">{avg.complexity}</div>
								<div class="rating-bar">
									<div class="rating-fill" style="width: {parseFloat(avg.complexity) * 10}%"></div>
								</div>
							</div>
							<div class="rating-card enjoyment">
								<div class="rating-label">My Enjoyment</div>
								<div class="rating-value">{avg.enjoyment}</div>
								<div class="rating-bar">
									<div class="rating-fill" style="width: {parseFloat(avg.enjoyment) * 10}%"></div>
								</div>
							</div>
							<div class="rating-card others">
								<div class="rating-label">Others' Enjoyment</div>
								<div class="rating-value">{avg.othersEnjoyment}</div>
								<div class="rating-bar">
									<div
										class="rating-fill"
										style="width: {parseFloat(avg.othersEnjoyment) * 10}%"
									></div>
								</div>
							</div>
						</div>
					</div>
				{/if}

				<!-- Individual Feedback Cards -->
				<div class="feedback-section">
					<div class="section-label">
						<span class="label-icon">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
								<path
									d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z"
								/>
							</svg>
						</span>
						Player Reviews
					</div>
					<div class="feedback-cards">
						{#each feedback as fb, i}
							<article class="feedback-card" style="--delay: {i * 0.15}s">
								<header class="feedback-header">
									<span class="player-name">{fb.player_name}</span>
									<time class="feedback-date">{formatDate(fb.created_at)}</time>
								</header>
								{#if fb.feedback_text}
									<p class="feedback-text">{fb.feedback_text}</p>
								{/if}
								<div class="feedback-ratings">
									<span class="mini-rating" title="Complexity">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											fill="currentColor"
											class="rating-icon complexity"
										>
											<path
												d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zM5.05 3.05a.75.75 0 011.06 0l1.062 1.06A.75.75 0 116.11 5.173L5.05 4.11a.75.75 0 010-1.06zm9.9 0a.75.75 0 010 1.06l-1.06 1.062a.75.75 0 01-1.062-1.061l1.061-1.06a.75.75 0 011.06 0zM3 8a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 013 8zm11 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 0114 8zm-8.082.757a.75.75 0 01.424.974l-1 2.414A.75.75 0 013.944 11.6l1-2.414a.75.75 0 01.974-.429zm8.164 0a.75.75 0 01.974.43l1 2.413a.75.75 0 01-1.398.544l-1-2.414a.75.75 0 01.424-.973zM10 11a1 1 0 100-2 1 1 0 000 2z"
											/>
										</svg>
										{fb.rating_complexity}
									</span>
									<span class="mini-rating" title="My Enjoyment">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											fill="currentColor"
											class="rating-icon enjoyment"
										>
											<path
												d="M10 1a6 6 0 00-3.815 10.631C7.237 12.5 8 13.443 8 14.456v.644a.75.75 0 00.572.729 6.016 6.016 0 002.856 0A.75.75 0 0012 15.1v-.644c0-1.013.762-1.957 1.815-2.825A6 6 0 0010 1zM8.863 17.414a.75.75 0 00-.226 1.483 9.066 9.066 0 002.726 0 .75.75 0 00-.226-1.483 7.553 7.553 0 01-2.274 0z"
											/>
										</svg>
										{fb.rating_enjoyment}
									</span>
									<span class="mini-rating" title="Others' Enjoyment">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											fill="currentColor"
											class="rating-icon others"
										>
											<path
												d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z"
											/>
										</svg>
										{fb.rating_others_enjoyment}
									</span>
								</div>
							</article>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Action Buttons -->
		<footer class="notes-actions">
			{#if onEditNotes}
				<button class="action-btn host-btn" onclick={onEditNotes}>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
						<path
							d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z"
						/>
					</svg>
					Host Notes
				</button>
			{/if}
			{#if onAddFeedback}
				<button class="action-btn feedback-btn" onclick={onAddFeedback}>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z"
							clip-rule="evenodd"
						/>
					</svg>
					Add Review
				</button>
			{/if}
		</footer>
	</section>
{/if}

<style>
	@import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap');

	.game-notes-container {
		position: relative;
		margin: 1.5rem;
		padding: 2rem;
		background: linear-gradient(
			135deg,
			rgba(15, 15, 25, 0.95) 0%,
			rgba(25, 20, 40, 0.9) 50%,
			rgba(15, 15, 25, 0.95) 100%
		);
		border: 1px solid rgba(139, 92, 246, 0.2);
		border-radius: 4px;
		box-shadow:
			0 0 60px -20px rgba(139, 92, 246, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
		animation: container-reveal 0.6s ease-out;
	}

	@keyframes container-reveal {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Corner accents */
	.corner-accent {
		position: absolute;
		width: 20px;
		height: 20px;
		border-color: rgba(139, 92, 246, 0.5);
		border-style: solid;
		border-width: 0;
	}
	.corner-accent.top-left {
		top: -1px;
		left: -1px;
		border-top-width: 2px;
		border-left-width: 2px;
	}
	.corner-accent.top-right {
		top: -1px;
		right: -1px;
		border-top-width: 2px;
		border-right-width: 2px;
	}
	.corner-accent.bottom-left {
		bottom: -1px;
		left: -1px;
		border-bottom-width: 2px;
		border-left-width: 2px;
	}
	.corner-accent.bottom-right {
		bottom: -1px;
		right: -1px;
		border-bottom-width: 2px;
		border-right-width: 2px;
	}

	/* Header */
	.notes-header {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.header-line {
		flex: 1;
		height: 1px;
		background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.4), transparent);
	}

	.header-title {
		font-family: 'Crimson Pro', Georgia, serif;
		font-size: 1.75rem;
		font-weight: 400;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: #e5e5e5;
		white-space: nowrap;
	}

	.title-accent {
		font-weight: 600;
		color: #a78bfa;
	}

	/* Content */
	.notes-content {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	/* Section labels */
	.section-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.7rem;
		font-weight: 500;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: #a78bfa;
		margin-bottom: 0.75rem;
	}

	.label-icon {
		display: flex;
		width: 14px;
		height: 14px;
	}
	.label-icon svg {
		width: 100%;
		height: 100%;
	}

	.feedback-count {
		color: #6b7280;
		font-weight: 400;
	}

	/* Summary section */
	.summary-section {
		animation: fade-in 0.5s ease-out 0.1s both;
	}

	.summary-text {
		font-family: 'Crimson Pro', Georgia, serif;
		font-size: 1.1rem;
		line-height: 1.7;
		color: #d1d5db;
		padding: 1rem 1.5rem;
		border-left: 3px solid rgba(139, 92, 246, 0.5);
		background: rgba(139, 92, 246, 0.05);
	}

	.summary-text :global(p) {
		margin: 0 0 0.75rem 0;
	}

	.summary-text :global(p:last-child) {
		margin-bottom: 0;
	}

	.summary-text :global(ul),
	.summary-text :global(ol) {
		margin: 0 0 0.75rem 0;
		padding-left: 1.5rem;
	}

	.summary-text :global(li) {
		margin-bottom: 0.25rem;
	}

	.summary-text :global(blockquote) {
		margin: 0.75rem 0;
		padding-left: 1rem;
		border-left: 2px solid rgba(139, 92, 246, 0.4);
		color: #9ca3af;
		font-style: italic;
	}

	.summary-text :global(strong) {
		font-weight: 600;
		color: #f3f4f6;
	}

	.summary-text :global(em) {
		font-style: italic;
	}

	.summary-text :global(u) {
		text-decoration: underline;
	}

	.summary-text :global(s),
	.summary-text :global(del) {
		text-decoration: line-through;
		color: #9ca3af;
	}

	.summary-text :global(h1),
	.summary-text :global(h2),
	.summary-text :global(h3),
	.summary-text :global(h4) {
		font-family: 'JetBrains Mono', monospace;
		font-weight: 600;
		color: #f3f4f6;
		margin: 0 0 0.75rem 0;
	}

	.summary-text :global(h1) {
		font-size: 1.4rem;
	}
	.summary-text :global(h2) {
		font-size: 1.2rem;
	}
	.summary-text :global(h3) {
		font-size: 1.05rem;
	}

	.summary-text :global(code) {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.85em;
		padding: 0.125rem 0.375rem;
		background: rgba(139, 92, 246, 0.15);
		border-radius: 3px;
		color: #c4b5fd;
	}

	.summary-text :global(pre) {
		margin: 0.75rem 0;
		padding: 0.75rem 1rem;
		background: rgba(0, 0, 0, 0.4);
		border-radius: 4px;
		overflow-x: auto;
	}

	.summary-text :global(pre code) {
		padding: 0;
		background: transparent;
	}

	.summary-text :global(a) {
		color: #a78bfa;
		text-decoration: underline;
	}

	.summary-text :global(a:hover) {
		color: #c4b5fd;
	}

	.summary-text :global(hr) {
		margin: 1rem 0;
		border: none;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	/* Improvements section */
	.improvements-section {
		animation: fade-in 0.5s ease-out 0.2s both;
	}

	.improvements-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.improvement-item {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 0.75rem 1rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 2px;
		animation: slide-in 0.4s ease-out calc(0.3s + var(--delay)) both;
	}

	.improvement-number {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.75rem;
		font-weight: 500;
		color: #a78bfa;
		background: rgba(139, 92, 246, 0.15);
		padding: 0.25rem 0.5rem;
		border-radius: 2px;
		flex-shrink: 0;
	}

	.improvement-text {
		font-size: 0.95rem;
		line-height: 1.5;
		color: #d1d5db;
	}

	/* Ratings overview */
	.ratings-overview {
		animation: fade-in 0.5s ease-out 0.3s both;
	}

	.ratings-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 1rem;
	}

	.rating-card {
		padding: 1rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 4px;
		text-align: center;
	}

	.rating-label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.65rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #9ca3af;
		margin-bottom: 0.5rem;
	}

	.rating-value {
		font-family: 'Crimson Pro', Georgia, serif;
		font-size: 2.5rem;
		font-weight: 600;
		line-height: 1;
		margin-bottom: 0.75rem;
	}

	.rating-card.complexity .rating-value {
		color: #f59e0b;
	}
	.rating-card.enjoyment .rating-value {
		color: #10b981;
	}
	.rating-card.others .rating-value {
		color: #3b82f6;
	}

	.rating-bar {
		height: 4px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 2px;
		overflow: hidden;
	}

	.rating-fill {
		height: 100%;
		border-radius: 2px;
		transition: width 0.8s ease-out;
	}

	.rating-card.complexity .rating-fill {
		background: linear-gradient(90deg, #f59e0b, #fbbf24);
	}
	.rating-card.enjoyment .rating-fill {
		background: linear-gradient(90deg, #10b981, #34d399);
	}
	.rating-card.others .rating-fill {
		background: linear-gradient(90deg, #3b82f6, #60a5fa);
	}

	/* Feedback section */
	.feedback-section {
		animation: fade-in 0.5s ease-out 0.4s both;
	}

	.feedback-cards {
		display: grid;
		gap: 1rem;
	}

	.feedback-card {
		padding: 1rem 1.25rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-left: 3px solid rgba(139, 92, 246, 0.3);
		border-radius: 0 4px 4px 0;
		animation: slide-in 0.4s ease-out calc(0.5s + var(--delay)) both;
	}

	.feedback-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.player-name {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.85rem;
		font-weight: 500;
		color: #e5e7eb;
	}

	.feedback-date {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.65rem;
		color: #6b7280;
	}

	.feedback-text {
		font-size: 0.9rem;
		line-height: 1.6;
		color: #9ca3af;
		margin: 0 0 0.75rem 0;
	}

	.feedback-ratings {
		display: flex;
		gap: 1rem;
	}

	.mini-rating {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.75rem;
		color: #9ca3af;
	}

	.rating-icon {
		width: 14px;
		height: 14px;
	}
	.rating-icon.complexity {
		color: #f59e0b;
	}
	.rating-icon.enjoyment {
		color: #10b981;
	}
	.rating-icon.others {
		color: #3b82f6;
	}

	/* Actions */
	.notes-actions {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.05);
	}

	.action-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1.25rem;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		border: 1px solid;
		border-radius: 2px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.action-btn svg {
		width: 14px;
		height: 14px;
	}

	.host-btn {
		background: rgba(139, 92, 246, 0.1);
		border-color: rgba(139, 92, 246, 0.3);
		color: #a78bfa;
	}
	.host-btn:hover {
		background: rgba(139, 92, 246, 0.2);
		border-color: rgba(139, 92, 246, 0.5);
		box-shadow: 0 0 20px -5px rgba(139, 92, 246, 0.3);
	}

	.feedback-btn {
		background: rgba(16, 185, 129, 0.1);
		border-color: rgba(16, 185, 129, 0.3);
		color: #34d399;
	}
	.feedback-btn:hover {
		background: rgba(16, 185, 129, 0.2);
		border-color: rgba(16, 185, 129, 0.5);
		box-shadow: 0 0 20px -5px rgba(16, 185, 129, 0.3);
	}

	/* Animations */
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slide-in {
		from {
			opacity: 0;
			transform: translateX(-10px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	/* Responsive */
	@media (max-width: 640px) {
		.game-notes-container {
			margin: 1rem;
			padding: 1.25rem;
		}

		.header-title {
			font-size: 1.25rem;
			letter-spacing: 0.1em;
		}

		.summary-text {
			font-size: 1.1rem;
			padding: 0.75rem 1rem;
		}

		.ratings-grid {
			grid-template-columns: 1fr;
		}

		.notes-actions {
			flex-direction: column;
		}

		.action-btn {
			justify-content: center;
		}
	}
</style>

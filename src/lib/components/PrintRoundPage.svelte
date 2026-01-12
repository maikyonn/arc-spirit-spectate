<script lang="ts">
	import type { BagsData, PlayerSnapshot, Spirit } from '$lib/types';

	interface Props {
		gameId: string;
		round: number;
		timestamp: string | null;
		players: PlayerSnapshot[];
		bags: BagsData | null;
	}

	let { gameId, round, timestamp, players, bags }: Props = $props();

	const sortedPlayers = $derived(() =>
		[...players].sort((a, b) => a.playerColor.localeCompare(b.playerColor))
	);

	const spiritWorldCount = $derived(
		() => (bags?.hexSpirits as { count?: number } | undefined)?.count ?? null
	);
	const monstersCount = $derived(
		() => (bags?.monsters as { count?: number } | undefined)?.count ?? null
	);

	const formattedTimestamp = $derived(() => {
		if (!timestamp) return '';
		const date = new Date(timestamp);
		if (Number.isNaN(date.getTime())) return String(timestamp);
		return date.toLocaleString();
	});

	function spiritsBySlot(spirits: Spirit[]) {
		return new Map(spirits.map((s) => [s.slotIndex, s]));
	}
</script>

<section class="print-page">
	<header class="page-header">
		<div class="title">
			Arc Spirits — {gameId}
		</div>
		<div class="meta">
			Round {round}{#if formattedTimestamp}
				• {formattedTimestamp}{/if}
		</div>
	</header>

	<div class="page-body">
		<div class="players-grid">
			{#each sortedPlayers() as p (p.playerColor)}
				{@const spiritMap = spiritsBySlot(p.spirits)}
				<div class="player-card">
					<div class="player-header">
						<div class="player-color">{p.playerColor}</div>
						<div class="player-name">{p.selectedCharacter}</div>
					</div>

					<div class="stats">
						<div class="stat">
							<span class="label">Blood</span><span class="value">{p.blood}</span>
						</div>
						<div class="stat">
							<span class="label">Barrier</span><span class="value">{p.barrier}</span>
						</div>
						<div class="stat">
							<span class="label">Status</span>
							<span class="value">{p.statusToken ?? '—'} ({p.statusLevel})</span>
						</div>
						<div class="stat">
							<span class="label">VP</span><span class="value">{p.victoryPoints}</span>
						</div>
					</div>

					<div class="section">
						<div class="section-title">Spirits</div>
						<div class="slots-grid slots-7">
							{#each [1, 2, 3, 4, 5, 6, 7] as i}
								{@const s = spiritMap.get(i)}
								<div class="slot">
									<div class="slot-index">{i}</div>
									<div class="slot-value">{s?.name ?? '—'}</div>
								</div>
							{/each}
						</div>
					</div>

					<div class="section">
						<div class="section-title">Runes</div>
						<div class="slots-grid slots-4">
							{#each [1, 2, 3, 4] as i}
								{@const r = (p.runes ?? []).find((x) => x.slotIndex === i)}
								<div class="slot">
									<div class="slot-index">{i}</div>
									<div class="slot-value">{r?.hasRune ? (r.name ?? 'Rune') : '—'}</div>
								</div>
							{/each}
						</div>
					</div>

					{#if (p.handDraws ?? []).length > 0}
						<div class="section">
							<div class="section-title">Hand Draws</div>
							<div class="chips">
								{#each (p.handDraws ?? []).slice(0, 10) as draw, i (`${draw.guid ?? 'draw'}-${i}`)}
									<span class="chip">
										{draw.name ?? 'Unknown'}{#if draw.cost != null}
											({draw.cost}){/if}
									</span>
								{/each}
								{#if p.handDraws.length > 10}
									<span class="chip muted">+{p.handDraws.length - 10} more</span>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<div class="bags-row">
			<div class="bag">
				<span class="label">Spirit World Bag</span>
				<span class="value">{spiritWorldCount == null ? '—' : spiritWorldCount}</span>
			</div>
			<div class="bag">
				<span class="label">Monsters</span>
				<span class="value">{monstersCount == null ? '—' : monstersCount}</span>
			</div>
		</div>
	</div>
</section>

<style>
	.print-page {
		background: white;
		color: black;
		border: 1px solid #e5e7eb;
		border-radius: 10px;
		padding: 16px;
		margin: 0 auto 16px;
	}

	.page-header {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin-bottom: 10px;
	}

	.title {
		font-weight: 800;
		font-size: 16px;
		letter-spacing: -0.01em;
	}

	.meta {
		color: #4b5563;
		font-size: 12px;
	}

	.players-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 10px;
	}

	.player-card {
		border: 1px solid #e5e7eb;
		border-radius: 10px;
		padding: 10px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		break-inside: avoid;
	}

	.player-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 8px;
	}

	.player-color {
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #374151;
	}

	.player-name {
		font-size: 13px;
		font-weight: 800;
		text-align: right;
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 6px 10px;
	}

	.stat {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		font-size: 11px;
		padding: 6px 8px;
		border-radius: 8px;
		background: #f9fafb;
		border: 1px solid #f3f4f6;
	}

	.stat .label {
		color: #6b7280;
		font-weight: 700;
	}

	.stat .value {
		font-weight: 800;
	}

	.section-title {
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #6b7280;
		margin-bottom: 4px;
	}

	.slots-grid {
		display: grid;
		gap: 6px;
	}

	.slots-7 {
		grid-template-columns: repeat(7, minmax(0, 1fr));
	}

	.slots-4 {
		grid-template-columns: repeat(4, minmax(0, 1fr));
	}

	.slot {
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 6px;
		min-height: 42px;
		display: flex;
		flex-direction: column;
		gap: 4px;
		overflow: hidden;
	}

	.slot-index {
		font-size: 10px;
		font-weight: 800;
		color: #6b7280;
	}

	.slot-value {
		font-size: 10px;
		font-weight: 700;
		line-height: 1.15;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.chip {
		font-size: 10px;
		border: 1px solid #e5e7eb;
		border-radius: 999px;
		padding: 4px 8px;
		background: #fff;
		white-space: nowrap;
	}

	.chip.muted {
		color: #6b7280;
		background: #f9fafb;
	}

	.bags-row {
		margin-top: 10px;
		display: flex;
		gap: 12px;
		align-items: center;
		justify-content: flex-end;
	}

	.bag {
		display: flex;
		gap: 8px;
		align-items: baseline;
		padding: 6px 10px;
		border: 1px solid #e5e7eb;
		border-radius: 999px;
		background: #f9fafb;
	}

	.bag .label {
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: #6b7280;
	}

	.bag .value {
		font-size: 12px;
		font-weight: 900;
	}

	@media print {
		.print-page {
			border: none;
			border-radius: 0;
			padding: 0;
			margin: 0;
		}
	}
</style>

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		Chart,
		LineController,
		LineElement,
		PointElement,
		LinearScale,
		CategoryScale,
		Title,
		Tooltip,
		Legend,
		type ChartConfiguration,
		type ActiveElement,
		type ChartEvent
	} from 'chart.js';

	// Register Chart.js components
	Chart.register(
		LineController,
		LineElement,
		PointElement,
		LinearScale,
		CategoryScale,
		Title,
		Tooltip,
		Legend
	);

	// Player color mapping for chart lines
	const CHART_COLORS: Record<string, string> = {
		Red: '#ef4444',
		Blue: '#3b82f6',
		Orange: '#f97316',
		Green: '#22c55e',
		Purple: '#a855f7',
		Yellow: '#eab308'
	};

	interface GraphDataPoint {
		round: number;
		players: Array<{ color: string; blood: number; victoryPoints: number; barrier: number }>;
	}

	interface Props {
		type: 'victoryPoints' | 'blood' | 'barrier' | 'barrierGained';
		data: GraphDataPoint[];
		currentRound: number;
		onRoundClick?: (round: number) => void;
	}

	let { type, data, currentRound, onRoundClick }: Props = $props();

	let canvasElement: HTMLCanvasElement;
	let chartInstance: Chart | null = null;

	// Derive chart title based on type
	const chartTitle = $derived(
		type === 'victoryPoints'
			? 'Victory Points'
			: type === 'blood'
				? 'Arcane Blood'
				: type === 'barrierGained'
					? 'Total Barrier Gained'
					: 'Barrier'
	);

	// Calculate cumulative barrier gained for each player
	const barrierGainedByPlayer = $derived(() => {
		if (type !== 'barrierGained') return new Map<string, number[]>();

		const result = new Map<string, number[]>();
		const prevBarrier = new Map<string, number>();

		data.forEach((round, roundIndex) => {
			round.players.forEach((player) => {
				if (!result.has(player.color)) {
					result.set(player.color, []);
				}

				const prev = prevBarrier.get(player.color) ?? 0;
				const gained = Math.max(0, player.barrier - prev);
				const cumulative =
					roundIndex === 0 ? gained : (result.get(player.color)?.at(-1) ?? 0) + gained;

				result.get(player.color)!.push(cumulative);
				prevBarrier.set(player.color, player.barrier);
			});
		});

		return result;
	});

	// Get unique player colors from data
	const playerColors = $derived(() => {
		if (data.length === 0) return [];
		const colors = new Set<string>();
		data.forEach((round) => {
			round.players.forEach((player) => {
				colors.add(player.color);
			});
		});
		return Array.from(colors).sort();
	});

	// Build datasets for each player
	const datasets = $derived(() => {
		const colors = playerColors();
		return colors.map((color) => {
			let playerData: (number | null)[];

			if (type === 'barrierGained') {
				playerData = barrierGainedByPlayer().get(color) ?? data.map(() => null);
			} else {
				playerData = data.map((round) => {
					const player = round.players.find((p) => p.color === color);
					if (!player) return null;
					if (type === 'blood') return player.blood;
					if (type === 'victoryPoints') return player.victoryPoints;
					return player.barrier;
				});
			}

			return {
				label: color,
				data: playerData,
				borderColor: CHART_COLORS[color] ?? '#888888',
				backgroundColor: CHART_COLORS[color] ?? '#888888',
				borderWidth: 2,
				pointRadius: 4,
				pointHoverRadius: 6,
				tension: 0.1,
				spanGaps: true
			};
		});
	});

	// X-axis labels (round numbers)
	const labels = $derived(data.map((d) => `R${d.round}`));

	// Custom plugin for current round vertical line indicator
	const currentRoundLinePlugin = {
		id: 'currentRoundLine',
		afterDraw(chart: Chart) {
			if (data.length === 0) return;

			const roundIndex = data.findIndex((d) => d.round === currentRound);
			if (roundIndex === -1) return;

			const { ctx, chartArea, scales } = chart;
			const xScale = scales.x;

			if (!xScale || !chartArea) return;

			const x = xScale.getPixelForValue(roundIndex);

			ctx.save();
			ctx.beginPath();
			ctx.moveTo(x, chartArea.top);
			ctx.lineTo(x, chartArea.bottom);
			ctx.lineWidth = 2;
			ctx.strokeStyle = 'rgba(168, 85, 247, 0.8)';
			ctx.setLineDash([5, 5]);
			ctx.stroke();
			ctx.restore();

			// Draw a small triangle indicator at the top
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(x, chartArea.top - 5);
			ctx.lineTo(x - 6, chartArea.top - 12);
			ctx.lineTo(x + 6, chartArea.top - 12);
			ctx.closePath();
			ctx.fillStyle = 'rgba(168, 85, 247, 0.9)';
			ctx.fill();
			ctx.restore();
		}
	};

	// Handle click on chart
	function handleChartClick(event: ChartEvent, elements: ActiveElement[], chart: Chart) {
		if (!onRoundClick) return;

		if (elements.length > 0) {
			const index = elements[0].index;
			const round = data[index]?.round;
			if (round !== undefined) {
				onRoundClick(round);
			}
		} else {
			// Allow clicking on the x-axis area to navigate
			const xScale = chart.scales.x;
			if (xScale && event.x !== null) {
				const value = xScale.getValueForPixel(event.x as number);
				if (value !== undefined && value >= 0 && value < data.length) {
					const roundIndex = Math.round(value as number);
					const round = data[roundIndex]?.round;
					if (round !== undefined) {
						onRoundClick(round);
					}
				}
			}
		}
	}

	// Chart configuration
	function getChartConfig(): ChartConfiguration<'line'> {
		return {
			type: 'line',
			data: {
				labels: labels,
				datasets: datasets()
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: {
					mode: 'index',
					intersect: false
				},
				onClick: handleChartClick,
				plugins: {
					legend: {
						display: true,
						position: 'top',
						labels: {
							color: '#d1d5db',
							font: {
								size: 11
							},
							usePointStyle: true,
							pointStyle: 'circle',
							padding: 12
						}
					},
					title: {
						display: true,
						text: chartTitle,
						color: '#f3f4f6',
						font: {
							size: 14,
							weight: 'bold'
						},
						padding: {
							top: 8,
							bottom: 12
						}
					},
					tooltip: {
						backgroundColor: 'rgba(17, 24, 39, 0.95)',
						titleColor: '#ffffff',
						bodyColor: '#d1d5db',
						borderColor: '#374151',
						borderWidth: 1,
						padding: 10,
						displayColors: true,
						callbacks: {
							title: (items) => {
								if (items.length > 0) {
									return `Round ${data[items[0].dataIndex]?.round ?? items[0].dataIndex + 1}`;
								}
								return '';
							},
							label: (context) => {
								const label = context.dataset.label ?? '';
								const value = context.parsed.y;
								const unit =
									type === 'blood'
										? ' blood'
										: type === 'victoryPoints'
											? ' VP'
											: type === 'barrierGained'
												? ' barrier gained'
												: ' barrier';
								return `${label}: ${value}${unit}`;
							}
						}
					}
				},
				scales: {
					x: {
						grid: {
							color: 'rgba(55, 65, 81, 0.5)',
							lineWidth: 1
						},
						ticks: {
							color: '#9ca3af',
							font: {
								size: 10
							},
							maxRotation: 0
						},
						border: {
							color: '#4b5563'
						}
					},
					y: {
						beginAtZero: true,
						grid: {
							color: 'rgba(55, 65, 81, 0.5)',
							lineWidth: 1
						},
						ticks: {
							color: '#9ca3af',
							font: {
								size: 10
							},
							stepSize:
								type === 'victoryPoints' || type === 'barrier' || type === 'barrierGained'
									? 1
									: undefined
						},
						border: {
							color: '#4b5563'
						}
					}
				},
				elements: {
					point: {
						hoverBorderWidth: 2,
						hoverBorderColor: '#ffffff'
					}
				}
			},
			plugins: [currentRoundLinePlugin]
		};
	}

	// Create chart on mount
	onMount(() => {
		if (canvasElement) {
			chartInstance = new Chart(canvasElement, getChartConfig());
		}
	});

	// Update chart when data changes
	$effect(() => {
		if (chartInstance) {
			chartInstance.data.labels = labels;
			chartInstance.data.datasets = datasets();
			if (chartInstance.options.plugins?.title) {
				(chartInstance.options.plugins.title as { text: string }).text = chartTitle;
			}
			chartInstance.update('none');
		}
	});

	// Update chart when currentRound changes (for the vertical line)
	$effect(() => {
		// Access currentRound to create dependency
		const _ = currentRound;
		if (chartInstance) {
			chartInstance.update('none');
		}
	});

	// Cleanup on destroy
	onDestroy(() => {
		if (chartInstance) {
			chartInstance.destroy();
			chartInstance = null;
		}
	});
</script>

<div class="resource-graph-container">
	<canvas bind:this={canvasElement}></canvas>
</div>

<style>
	.resource-graph-container {
		width: 100%;
		height: 220px;
		background-color: rgb(17 24 39);
		border-radius: 0.5rem;
		padding: 0.75rem;
		border: 1px solid rgb(55 65 81);
	}

	canvas {
		width: 100% !important;
		height: 100% !important;
		cursor: pointer;
	}
</style>

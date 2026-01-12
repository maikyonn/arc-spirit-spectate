<script lang="ts">
	import type { SpiritHexType } from '$lib/hex/gridConfig';

	interface Spirit {
		slotIndex: number;
		id: string;
		name: string;
		cost: number;
	}

	interface Props {
		hex: SpiritHexType;
		spirit?: Spirit | null;
		imageUrl?: string | null;
		slotIndex: number;
		externalImage?: boolean;
	}

	let { hex, spirit = null, imageUrl = null, slotIndex, externalImage = false }: Props = $props();

	// Generate unique IDs for this hex's elements
	const clipId = $derived(`hex-clip-${slotIndex}`);
	const gradientId = $derived(`hex-gradient-${slotIndex}`);
	const shadowId = $derived(`hex-shadow-${slotIndex}`);

	// Convert corners to SVG polygon points string
	const polygonPoints = $derived(hex.corners.map((c) => `${c.x},${c.y}`).join(' '));

	// Calculate center of the hex for positioning elements
	const center = $derived({
		x: hex.corners.reduce((sum, c) => sum + c.x, 0) / hex.corners.length,
		y: hex.corners.reduce((sum, c) => sum + c.y, 0) / hex.corners.length
	});

	// Calculate bounding box for the image
	const bounds = $derived({
		minX: Math.min(...hex.corners.map((c) => c.x)),
		minY: Math.min(...hex.corners.map((c) => c.y)),
		maxX: Math.max(...hex.corners.map((c) => c.x)),
		maxY: Math.max(...hex.corners.map((c) => c.y))
	});

	const hexWidth = $derived(bounds.maxX - bounds.minX);
	const hexHeight = $derived(bounds.maxY - bounds.minY);
</script>

<g class="spirit-hex" data-slot={slotIndex}>
	<!-- Define clipPath and gradients -->
	<defs>
		<clipPath id={clipId}>
			<polygon points={polygonPoints} />
		</clipPath>
		<!-- Subtle gradient for empty slots -->
		<radialGradient id={gradientId} cx="50%" cy="50%" r="70%">
			<stop offset="0%" stop-color="rgb(55, 65, 81)" stop-opacity="0.4" />
			<stop offset="100%" stop-color="rgb(31, 41, 55)" stop-opacity="0.6" />
		</radialGradient>
		<!-- Drop shadow filter -->
		<filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
			<feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.5)" />
		</filter>
	</defs>

	<!-- Hex background/border with enhanced styling -->
	<polygon
		points={polygonPoints}
		class="hex-border"
		fill={spirit
			? externalImage
				? 'rgba(0, 0, 0, 0.06)'
				: 'rgba(30, 30, 40, 0.95)'
			: `url(#${gradientId})`}
		stroke={spirit ? '#8b5cf6' : '#4b5563'}
		stroke-width={spirit ? '2.5' : '1.5'}
		filter={spirit ? `url(#${shadowId})` : 'none'}
	/>

	<!-- Subtle inner glow for filled hexes -->
	{#if spirit}
		<polygon
			points={polygonPoints}
			fill="none"
			stroke="rgba(139, 92, 246, 0.3)"
			stroke-width="1"
			transform="scale(0.92)"
			transform-origin="{center.x} {center.y}"
		/>
	{/if}

	<!-- Spirit image with hexagonal clip -->
	{#if spirit && imageUrl}
		<image
			href={imageUrl}
			x={bounds.minX}
			y={bounds.minY}
			width={hexWidth}
			height={hexHeight}
			preserveAspectRatio="xMidYMid slice"
			clip-path="url(#{clipId})"
			class="spirit-image"
		/>
		<!-- Subtle vignette overlay -->
		<polygon
			points={polygonPoints}
			fill="none"
			stroke="rgba(0, 0, 0, 0.4)"
			stroke-width="8"
			clip-path="url(#{clipId})"
		/>
	{:else if spirit && externalImage}
		<!-- Image rendered externally by parent -->
	{:else if !spirit}
		<!-- Empty slot - just subtle hex outline, no numbers -->
	{:else}
		<!-- Spirit without image - show name with better styling -->
		<rect
			x={center.x - 40}
			y={center.y - 12}
			width="80"
			height="24"
			rx="4"
			fill="rgba(0, 0, 0, 0.6)"
		/>
		<text
			x={center.x}
			y={center.y}
			text-anchor="middle"
			dominant-baseline="middle"
			fill="#e5e7eb"
			font-size="11"
			font-weight="600"
			font-family="system-ui, sans-serif"
		>
			{spirit.name.length > 10 ? spirit.name.slice(0, 10) + '...' : spirit.name}
		</text>
	{/if}
</g>

<style>
	.spirit-hex {
		cursor: pointer;
	}

	.spirit-hex .hex-border {
		transition:
			stroke 0.2s ease,
			stroke-width 0.2s ease,
			filter 0.2s ease;
	}

	.spirit-hex:hover .hex-border {
		stroke: #a78bfa;
		stroke-width: 3;
		filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.5));
	}

	.spirit-hex .spirit-image {
		transition: opacity 0.2s ease;
	}

	.spirit-hex:hover .spirit-image {
		opacity: 0.9;
	}
</style>

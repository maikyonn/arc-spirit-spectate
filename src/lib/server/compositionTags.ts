export function normalizeCompositionTag(input: string): string | null {
	const normalized = input.trim().toLowerCase().replace(/\s+/g, ' ');
	if (!normalized) return null;
	return normalized.slice(0, 64);
}

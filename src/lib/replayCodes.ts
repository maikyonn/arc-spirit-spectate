export function toShortReplayCode(navigationCount: number): string {
	const nav = Number.isFinite(navigationCount) ? Math.max(0, Math.floor(navigationCount)) : 0;
	return String(nav).padStart(4, '0');
}

export function toFullReplayCode(gameId: string, navigationCount: number): string {
	return `${gameId}:${Math.max(0, Math.floor(navigationCount))}`;
}

import { describe, expect, it } from 'vitest';
import { fire } from './testHelpers';

describe('Tree of Growth', () => {
	it('gains one Forest Rune in the awakening phase', () => {
		const { player, log } = fire({ 'Tree of Growth': 1 }, 'awakeningPhase');
		expect(player.mats).toHaveLength(1);
		expect(player.mats[0]).toMatchObject({ name: 'Floral Patch Rune', type: 'rune', hasRune: true });
		expect(log.some((line) => /Tree of Growth.*Forest Rune/i.test(line))).toBe(true);
	});

	it('does not fire during Rest', () => {
		const { player } = fire({ 'Tree of Growth': 1 }, 'onRest');
		expect(player.mats).toHaveLength(0);
	});
});

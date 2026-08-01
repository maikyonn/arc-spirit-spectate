/**
 * Fighter — declarative Rest and monster-kill breakpoint ladders.
 *
 * DB-intended behavior (source of truth):
 *   On Rest: 2/3/4/5 Fighter traits -> gain 1/2/5/10 Basic Attack dice.
 *   On Monster Kill: 2 traits -> gain 1 Arcane Blood; 5 traits -> gain 2 total.
 *
 * Only the highest qualifying numeric breakpoint fires (selectBreakpoint picks the
 * single highest threshold <= count), so the grants are NOT cumulative across rungs.
 * Below the first rung (count < 2) the ability is dormant — nothing is granted.
 *
 * UX channel: the granted dice surface as an attributed reward/rest log line
 * ("Fighter: Gained N basic attack dice."), and the mechanical attackDice pool grows
 * — never a silent no-op. The flat 10-die cap clamps the count-5 (+10) grant.
 */

import { describe, it, expect } from 'vitest';
import { applyTrigger } from '../apply';
import { fire, makePlayer, makeState, spirit } from './testHelpers';

/** Fire onRest for a Red player whose single awakened spirit carries N Fighter traits. */
function rest(count: number) {
	return fire({ Fighter: count }, 'onRest');
}

/** Fire the combat-result trigger for a player carrying N awakened Fighter traits. */
function monsterCombat(count: number, killed: boolean, faceDown = false) {
	const player = makePlayer({
		spirits: [spirit(1, { Fighter: count }, { faceDown })]
	});
	const state = makeState(player);
	const log: string[] = [];
	applyTrigger(state, 'Red', 'onMonsterKill', log, {
		combat: { dealt: killed ? 5 : 1, overkill: 0, killed }
	});
	return { player, log };
}

describe('Fighter', () => {
	it('2 traits: gains 1 basic attack die', () => {
		const { player, log } = rest(2);
		expect(player.attackDice.length).toBe(1);
		expect(player.attackDice.every((d) => d.tier === 'basic')).toBe(true);
		// Surfaces to the player as an attributed log line (no silent no-op).
		expect(log.some((l) => l.includes('Fighter: Gained 1 basic attack dice.'))).toBe(true);
	});

	it('3 traits: gains 2 basic attack dice', () => {
		const { player, log } = rest(3);
		expect(player.attackDice.length).toBe(2);
		expect(player.attackDice.every((d) => d.tier === 'basic')).toBe(true);
		expect(log.some((l) => l.includes('Fighter: Gained 2 basic attack dice.'))).toBe(true);
	});

	it('4 traits: gains 5 basic attack dice', () => {
		const { player, log } = rest(4);
		expect(player.attackDice.length).toBe(5);
		expect(player.attackDice.every((d) => d.tier === 'basic')).toBe(true);
		expect(log.some((l) => l.includes('Fighter: Gained 5 basic attack dice.'))).toBe(true);
	});

	it('5 traits: gains 10 basic attack dice (fills the flat 10-die cap in one rest)', () => {
		const { player, log } = rest(5);
		expect(player.attackDice.length).toBe(10);
		expect(player.attackDice.every((d) => d.tier === 'basic')).toBe(true);
		expect(log.some((l) => l.includes('Fighter: Gained 10 basic attack dice.'))).toBe(true);
	});

	it('only the highest qualifying rung fires (grants are not cumulative)', () => {
		// At count 4 the +5 rung fires, NOT +1 +2 +5 (=8). Confirms breakpoint selection.
		expect(rest(4).player.attackDice.length).toBe(5);
		// At count 6 (above the top rung) the +10 rung still fires (and clamps at cap 10).
		expect(rest(6).player.attackDice.length).toBe(10);
	});

	it('below the first rung (1 trait): no dice, no Fighter log line (dormant, not a silent grant)', () => {
		const { player, log } = rest(1);
		expect(player.attackDice.length).toBe(0);
		expect(log.some((l) => l.startsWith('Fighter:'))).toBe(false);
	});

	it('respects the flat 10-die cap when a pool already holds dice', () => {
		// Pre-seed 4 dice, then a count-5 (+10) rest: only 6 fit under the cap of 10.
		const { player, log } = fire({ Fighter: 5 }, 'onRest', {
			player: {
				attackDice: Array.from({ length: 4 }, (_, i) => ({
					instanceId: `seed${i}`,
					tier: 'basic' as const
				}))
			}
		});
		expect(player.attackDice.length).toBe(10);
		// The clamped grant is still surfaced (6 actually added).
		expect(log.some((l) => l.includes('Fighter: Gained 6 basic attack dice.'))).toBe(true);
	});

	it('is inactive when the Fighter spirit is face-down (unawakened)', () => {
		const { player, log } = fire({ Fighter: 5 }, 'onRest', {
			player: {
				spirits: [
					{
						slotIndex: 1,
						id: 's1',
						name: 'Spirit 1',
						cost: 2,
						classes: { Fighter: 5 },
						origins: {},
						isFaceDown: true
					}
				]
			}
		});
		expect(player.attackDice.length).toBe(0);
		expect(log.some((l) => l.startsWith('Fighter:'))).toBe(false);
	});

	it('does not fire on a non-Rest trigger (onCultivate)', () => {
		const { player, log } = fire({ Fighter: 5 }, 'onCultivate');
		expect(player.attackDice.length).toBe(0);
		expect(log.some((l) => l.startsWith('Fighter:'))).toBe(false);
	});

	it('2 through 4 traits: gains 1 Arcane Blood when a monster is killed', () => {
		for (const count of [2, 3, 4]) {
			const { player, log } = monsterCombat(count, true);
			expect(player.arcaneBlood).toBe(1);
			expect(log).toContain('Fighter: Gained 1 Arcane Blood.');
		}
	});

	it('5 or more traits: gains 2 total Arcane Blood when a monster is killed', () => {
		for (const count of [5, 6]) {
			const { player, log } = monsterCombat(count, true);
			expect(player.arcaneBlood).toBe(2);
			expect(log).toContain('Fighter: Gained 2 Arcane Blood.');
		}
	});

	it('does not gain Arcane Blood below 2 Fighter traits', () => {
		const { player, log } = monsterCombat(1, true);
		expect(player.arcaneBlood ?? 0).toBe(0);
		expect(log.some((line) => line.startsWith('Fighter:'))).toBe(false);
	});

	it('does not gain Arcane Blood when the monster survives', () => {
		const { player, log } = monsterCombat(4, false);
		expect(player.arcaneBlood ?? 0).toBe(0);
		expect(log.some((line) => line.startsWith('Fighter:'))).toBe(false);
	});

	it('does not gain Arcane Blood from a face-down Fighter spirit', () => {
		const { player, log } = monsterCombat(4, true, true);
		expect(player.arcaneBlood ?? 0).toBe(0);
		expect(log.some((line) => line.startsWith('Fighter:'))).toBe(false);
	});
});

import { describe, it, expect } from 'vitest';
import { ability, decisions } from './undercover';
import { makePlayer, ctxFor } from './testHelpers';

describe('Undercover (onPlayerInteraction)', () => {
	it('offers the Fairy Relic choice when an opponent is encountered', () => {
		const player = makePlayer();
		const blue = makePlayer({ playerColor: 'Blue' });
		const ctx = ctxFor(player, { trigger: 'onPlayerInteraction', extra: { Blue: blue } });
		ctx.opponent = 'Blue';
		ability[0].run!(ctx);
		expect(player.pendingDecisions[0]).toMatchObject({ kind: 'undercoverFairyRelics' });
		expect(ctx.log.some((line) => /Fairy Relic/i.test(line))).toBe(true);
	});

	it('the yes choice gives both players one Fairy Relic', () => {
		const player = makePlayer();
		const blue = makePlayer({ playerColor: 'Blue' });
		const ctx = ctxFor(player, { trigger: 'onPlayerInteraction', extra: { Blue: blue } });
		decisions.undercoverFairyRelics(ctx, 'yes:Blue');
		expect(player.mats.some((m) => m.name === 'Fairy Relic')).toBe(true);
		expect(blue.mats.some((m) => m.name === 'Fairy Relic')).toBe(true);
	});

	it('the no choice changes nothing', () => {
		const player = makePlayer();
		const blue = makePlayer({ playerColor: 'Blue' });
		const ctx = ctxFor(player, { trigger: 'onPlayerInteraction', extra: { Blue: blue } });
		decisions.undercoverFairyRelics(ctx, 'no');
		expect(player.mats).toHaveLength(0);
		expect(blue.mats).toHaveLength(0);
	});
});

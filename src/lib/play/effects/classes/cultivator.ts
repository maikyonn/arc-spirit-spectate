import { nextId } from '../../rng';
import { relicOptions } from '../../locationInteractions';
import type { ClassAbility, ClassDecisions } from './types';

// Cultivator — the max barrier engine, super-linear ladder (2/3/4/5 → +1/+2/+5/+10):
// a 5-Cultivator pool MAXES max barrier (cap 10) in a single Cultivate. A lone
// Cultivator grants nothing. gainMaxBarrier is capped at 10 and raises capacity
// without restoring current barrier.
export const ability: ClassAbility[] = [
	{
		on: 'onCultivate',
		breakpoints: [
			{ count: 2, actions: [{ kind: 'gainMaxBarrier', amount: 1 }] },
			{ count: 3, actions: [{ kind: 'gainMaxBarrier', amount: 2 }] },
			{ count: 4, actions: [{ kind: 'gainMaxBarrier', amount: 5 }] },
			{ count: 5, actions: [{ kind: 'gainMaxBarrier', amount: 10 }] }
		]
	},
	{
		on: 'onCultivate',
		run(ctx) {
			if (ctx.traitCount < 5) return;
			ctx.player.pendingDecisions.push({
				id: nextId(ctx.state.rng, 'dec'),
				source: 'class',
				kind: 'cultivatorRelic',
				prompt: 'Cultivator: choose any relic.',
				options: relicOptions().map((r, index) => ({ id: String(index), label: r.name }))
			});
			ctx.log.push('Cultivator: choose 1 relic.');
		}
	}
];

export const decisions: ClassDecisions = {
	cultivatorRelic(ctx, optionId) {
		const relics = relicOptions();
		const index = Math.max(0, Math.min(relics.length - 1, Number(optionId) || 0));
		const relic = relics[index];
		ctx.player.mats.push({
			slotIndex: ctx.player.mats.length + 1,
			hasRune: true,
			id: relic.runeId,
			name: relic.name,
			type: 'relic',
			special: true
		});
		ctx.player.relics += 1;
		ctx.log.push(`Cultivator: gained ${relic.name}.`);
	}
};

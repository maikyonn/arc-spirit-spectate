import { originRuneForName } from '../../locationInteractions';
import type { ClassAbility, ClassHandler } from './types';

/** Tree of Growth — "In the awakening phase, gain 1 Forest Rune." */
const gainForestRune: ClassHandler = (ctx) => {
	const rune = originRuneForName('Floral Patch');
	if (!rune) return;
	const amount = ctx.player.doubleRunes ? 2 : 1;
	for (let i = 0; i < amount; i += 1) {
		ctx.player.mats.push({
			slotIndex: ctx.player.mats.length + 1,
			hasRune: true,
			id: rune.runeId,
			name: rune.name,
			originId: rune.originId ?? undefined,
			classId: rune.classId ?? undefined,
			special: rune.special,
			type: rune.type
		});
	}
	ctx.log.push(`Tree of Growth: gained ${amount} Forest Rune${amount === 1 ? '' : 's'}.`);
};

export const ability: ClassAbility[] = [{ on: 'awakeningPhase', run: gainForestRune }];

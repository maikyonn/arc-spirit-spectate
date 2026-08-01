import type { ClassAbility } from './types';

// Fighter — the dice engine. SUPER-LINEAR Rest breakpoints (counts 2/3/4/5 →
// +1/+2/+5/+10 dice) reward stacking. Monster kills also grant 1 Arcane Blood at
// count 2, then 2 total Arcane Blood at count 5.
export const ability: ClassAbility[] = [
	{
		on: 'onRest',
		breakpoints: [
			{ count: 2, actions: [{ kind: 'gainAttackDice', tier: 'basic', amount: 1 }] },
			{ count: 3, actions: [{ kind: 'gainAttackDice', tier: 'basic', amount: 2 }] },
			{ count: 4, actions: [{ kind: 'gainAttackDice', tier: 'basic', amount: 5 }] },
			{ count: 5, actions: [{ kind: 'gainAttackDice', tier: 'basic', amount: 10 }] }
		]
	},
	{
		on: 'onMonsterKill',
		breakpoints: [
			{
				count: 2,
				actions: [
					{
						kind: 'conditional',
						when: { kind: 'killed' },
						then: [{ kind: 'gainArcaneBlood', amount: 1 }]
					}
				]
			},
			{
				count: 5,
				actions: [
					{
						kind: 'conditional',
						when: { kind: 'killed' },
						then: [{ kind: 'gainArcaneBlood', amount: 2 }]
					}
				]
			}
		]
	}
];

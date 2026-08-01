-- Fully undo the temporary Arcane Blood and monster-corruption reward experiment.
update arc_spirits_assets.monsters_v2 as monster
set reward_track = coalesce((
    select jsonb_agg(icon_id order by ordinal)
    from jsonb_array_elements_text(monster.reward_track) with ordinality as reward(icon_id, ordinal)
    where icon_id <> 'd6f613f7-deba-4517-8570-7503cebabc7b'
), '[]'::jsonb)
where monster.reward_track ? 'd6f613f7-deba-4517-8570-7503cebabc7b';

update arc_spirits_assets.classes
set effect_schema = '[
  {
    "color": "bronze",
    "count": 2,
    "effects": [
      {
        "type": "benefit",
        "description": "On Rest, gain 1 Basic Attack Dice"
      }
    ]
  },
  {
    "color": "bronze",
    "count": 3,
    "effects": [
      {
        "type": "benefit",
        "description": "On Rest, gain 2 Basic Attack Dice"
      }
    ]
  },
  {
    "color": "silver",
    "count": 4,
    "effects": [
      {
        "type": "benefit",
        "description": "On Rest, gain 5 Basic Attack Dice"
      }
    ]
  },
  {
    "count": 5,
    "effects": [
      {
        "type": "benefit",
        "description": "On Rest, gain 10 Basic Attack Dice and the Fighter Crown"
      }
    ]
  }
]'::jsonb
where name = 'Fighter';

alter table arc_spirits_assets.monsters_v2
    drop column if exists corruption_reward_track,
    drop column if exists corruption_choose_amount;

delete from arc_spirits_assets.icon_pool
where id = 'd6f613f7-deba-4517-8570-7503cebabc7b';

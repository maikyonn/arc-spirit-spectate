-- Keep the Fighter trait card aligned with its executable monster-kill rewards.
update arc_spirits_assets.classes
set effect_schema = '[
  {
    "color": "bronze",
    "count": 2,
    "effects": [
      {
        "type": "benefit",
        "description": "On Rest, gain 1 Basic Attack Dice"
      },
      {
        "type": "benefit",
        "description": "On Monster Kill, gain 1 Arcane Blood"
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
      },
      {
        "type": "benefit",
        "description": "On Monster Kill, gain 2 total Arcane Blood"
      }
    ]
  }
]'::jsonb
where name = 'Fighter';

-- Arcane Blood remains available from monster corruption rewards and class effects,
-- but is no longer a selectable reward for killing a monster.
update arc_spirits_assets.monsters_v2 as monster
set reward_track = coalesce((
    select jsonb_agg(icon_id order by ordinal)
    from jsonb_array_elements_text(monster.reward_track) with ordinality as reward(icon_id, ordinal)
    where icon_id <> 'd6f613f7-deba-4517-8570-7503cebabc7b'
), '[]'::jsonb)
where monster.reward_track ? 'd6f613f7-deba-4517-8570-7503cebabc7b';

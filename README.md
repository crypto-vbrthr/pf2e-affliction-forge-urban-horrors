# PF2E Affliction Forge: Urban Horrors

A bilingual DE/EN library add-on for **PF2E Affliction Forge 0.1.63+** containing 32 original urban afflictions for city campaigns, intrigue, slums, sewers, graveyards, guild wars, cults, and Creature Forge matching.

## Highlights

- 32 original afflictions from level 0 to 20
- Diseases, poisons, and curses with an urban identity
- Sewer, graveyard, harbor, tenement, foundry, palace, guild, cult, and night-market themes
- 6 true weapon injury poisons using the existing Affliction Forge charge workflow
- Canonical creature, family, habitat, theme, origin, and delivery semantic tags
- Advanced stages with persistent damage, virulent disease, concentration gates, speech blocking, condition locks, healing restrictions, and a level-20 death effect
- Foundry 14-safe managed world-compendium synchronization
- Read-only provider registration through the public Affliction Forge library API

## Creature Forge contract

Every entry carries `habitat:urban`. More specific matching includes families such as rat, snake, fish, and parasite, plus creature types including humanoid, undead, spirit, fungus, ooze, aberration, construct, celestial, fiend, and fey.

## Installation

Install this module next to `pf2e-affliction-forge`, enable both modules, and start the world as a GM once. The add-on creates or synchronizes its managed world compendium and registers it as a read-only Affliction Forge library.

## Development tests

```bash
npm test
```

The tests locate Affliction Forge by its `module.json` id in a sibling folder. For a non-standard development layout, set `PF2E_AFFLICTION_FORGE_PATH` to the core module directory.

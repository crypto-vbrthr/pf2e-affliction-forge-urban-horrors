const MODULE_ID = "pf2e-affliction-forge-urban-horrors";
const CONTENT_VERSION = "0.1.1";
const I18N_PREFIX = "PF2E_AFFLICTION_UH.Content";

const token = (slug, key) => `@i18n:${I18N_PREFIX}.${slug}.${key}`;
const restrictions = ({ locks = [], healing = "none", damageTypes = [], blocked = [] } = {}) => ({ conditionLocks: locks.map(([slug, minimum]) => ({ slug, minimum })), healing, unhealableDamageTypes: [...damageTypes], blockedCapabilities: [...blocked] });
const duration = ([value, unit]) => ({ value, unit });
const condition = (slug, value = null) => value == null ? { type: "condition", slug } : { type: "condition", slug, value };
const damage = (formula, damageType, persistent = false) => ({ type: "damage", formula, damageType, ...(persistent ? { persistent: true } : {}) });
const death = (category = "death-effect") => ({ type: "death", category });

function effect(slug, stageNumber, components, nameKey = null) {
  if (!components.length) return null;
  return { schemaVersion: 2, id: `${MODULE_ID}.${slug}.stage-${stageNumber}`, name: token(slug, nameKey ?? `Stage${stageNumber}.Name`), duration: { value: -1, unit: "unlimited", expiry: null }, components, application: {}, metadata: { originModule: MODULE_ID, originFeature: "urban-horrors-stage" } };
}

function componentFromSpec(entry) {
  if (entry[0] === "condition") return condition(entry[1], entry[2]);
  if (entry[0] === "damage") return damage(entry[1], entry[2], false);
  if (entry[0] === "damagePersistent") return damage(entry[1], entry[2], true);
  if (entry[0] === "death") return death(entry[1]);
  throw new Error(`Unsupported Urban Horrors component type: ${entry[0]}`);
}

function makeStage(slug, stageNumber, stageSpec) {
  const [durationSpec, componentSpecs, options = {}] = stageSpec;
  const components = componentSpecs.map(componentFromSpec);
  const stageRestrictions = restrictions({ locks: options.locks ?? [], healing: options.healing ?? "none", blocked: options.blockSpeak ? ["speak"] : [] });
  const preActionGates = options.gate ? [{ id: `${slug}.stage-${stageNumber}.gate`, label: token(slug, `Stage${stageNumber}.Gate`), trigger: { actionKinds: ["spell-cast", "item-activation"], requiredTraits: ["concentrate"] }, check: { kind: "flat", dc: options.gate }, blockOnFailure: true }] : [];
  return { id: `stage-${stageNumber}`, number: stageNumber, name: token(slug, `Stage${stageNumber}.Name`), description: token(slug, `Stage${stageNumber}.Description`), duration: duration(durationSpec), expiryAction: options.expiry ?? "check", check: null, restrictions: stageRestrictions, effectPersistence: "stage", effectPersistenceDuration: null, effectComponentPersistence: [], effectComponentPersistenceDurations: [], effect: effect(slug, stageNumber, components), numericModifiers: [], periodicEffects: [], preActionGates, reactions: [] };
}

function makeDefinition(spec) {
  const themes = Object.entries(spec.tags).flatMap(([namespace, values]) => values.map((value) => `${namespace}:${value}`));
  const normalProgression = { criticalSuccess: { action: "stage-delta", delta: -2 }, success: { action: "stage-delta", delta: -1 }, failure: { action: "stage-delta", delta: 1 }, criticalFailure: { action: "stage-delta", delta: 2 } };
  const stubbornProgression = { criticalSuccess: { action: "stage-delta", delta: -1 }, success: { action: "stay" }, failure: { action: "stage-delta", delta: 1 }, criticalFailure: { action: "stage-delta", delta: 2 } };
  return { schemaVersion: 2, id: `${MODULE_ID}.${spec.slug}`, name: token(spec.slug, "Name"), description: token(spec.slug, "Description"), img: "icons/svg/poison.svg", afflictionType: spec.type, level: spec.level, rarity: spec.rarity, traits: [spec.type, ...(spec.virulent === true ? ["virulent"] : [])], themes, saveDefaults: { execution: "player", visibility: "public" }, identification: { initialState: spec.identification ?? "identified" }, delivery: { injuryPoison: spec.injuryPoison === true }, multipleExposure: "default", restrictions: restrictions({ locks: spec.locks ?? [], healing: spec.rootHealing ?? "none" }), checks: [{ id: "primary", label: token(spec.slug, "SaveLabel"), kind: "save", statistic: spec.stat, dcMode: "fixed", dc: spec.dc, policy: null }], initialCheck: { checkIds: ["primary"], combine: "single", outcomes: { criticalSuccess: { action: "reject" }, success: { action: "reject" }, failure: { action: "set-stage", stage: 1 }, criticalFailure: { action: "set-stage", stage: Math.min(2, spec.stages.length) } } }, onset: spec.onset ? duration(spec.onset) : null, maximumDuration: spec.maxDuration ? duration(spec.maxDuration) : null, defaultStageCheck: { checkIds: ["primary"], combine: "single", outcomes: spec.stubborn ? stubbornProgression : normalProgression }, progression: { belowStageOne: "recover", aboveMaximumStage: "clamp", virulent: spec.virulent === true }, stages: spec.stages.map((stage, index) => makeStage(spec.slug, index + 1, stage)), metadata: { originModule: MODULE_ID, originFeature: "urban-horrors-library", contentVersion: CONTENT_VERSION, contentLicense: "original-homebrew", creatureForgeReady: true } };
}

const SPECS = [
  {
    "slug": "alley-cough",
    "level": 0,
    "dc": 14,
    "type": "disease",
    "rarity": "uncommon",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "humanoid",
        "animal"
      ],
      "habitat": [
        "urban"
      ],
      "theme": [
        "disease"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "inhaled"
      ],
      "family": [
        "rat"
      ]
    },
    "stages": [
      [
        [
          8,
          "hours"
        ],
        [
          [
            "condition",
            "fatigued"
          ]
        ],
        {}
      ],
      [
        [
          8,
          "hours"
        ],
        [
          [
            "condition",
            "sickened",
            1
          ],
          [
            "condition",
            "fatigued"
          ]
        ],
        {}
      ],
      [
        [
          8,
          "hours"
        ],
        [
          [
            "damage",
            "1d6",
            "poison"
          ],
          [
            "condition",
            "sickened",
            1
          ],
          [
            "condition",
            "fatigued"
          ]
        ],
        {}
      ]
    ],
    "onset": [
      1,
      "hours"
    ],
    "maxDuration": [
      3,
      "days"
    ],
    "stubborn": false,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none",
    "injuryPoison": false
  },
  {
    "slug": "gutterblood-fever",
    "level": 1,
    "dc": 15,
    "type": "disease",
    "rarity": "uncommon",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "animal",
        "humanoid"
      ],
      "habitat": [
        "urban",
        "underground"
      ],
      "theme": [
        "disease",
        "blood"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "bite",
        "injury"
      ],
      "family": [
        "rat"
      ]
    },
    "stages": [
      [
        [
          8,
          "hours"
        ],
        [
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          8,
          "hours"
        ],
        [
          [
            "damage",
            "1d6",
            "poison"
          ],
          [
            "condition",
            "sickened",
            1
          ],
          [
            "condition",
            "fatigued"
          ]
        ],
        {}
      ],
      [
        [
          8,
          "hours"
        ],
        [
          [
            "damage",
            "1d6",
            "poison"
          ],
          [
            "condition",
            "drained",
            1
          ],
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ]
    ],
    "onset": [
      1,
      "hours"
    ],
    "maxDuration": [
      4,
      "days"
    ],
    "stubborn": false,
    "virulent": true,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none",
    "injuryPoison": false
  },
  {
    "slug": "sewer-bloom",
    "level": 2,
    "dc": 16,
    "type": "disease",
    "rarity": "uncommon",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "fungus",
        "humanoid"
      ],
      "habitat": [
        "urban",
        "underground"
      ],
      "theme": [
        "disease",
        "spores",
        "fungal"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "inhaled"
      ],
      "family": [
        "parasite"
      ]
    },
    "stages": [
      [
        [
          6,
          "hours"
        ],
        [
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          6,
          "hours"
        ],
        [
          [
            "damage",
            "1d6",
            "poison"
          ],
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          6,
          "hours"
        ],
        [
          [
            "damage",
            "1d6",
            "poison"
          ],
          [
            "condition",
            "drained",
            1
          ],
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ]
    ],
    "onset": [
      10,
      "minutes"
    ],
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": false,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none",
    "injuryPoison": false
  },
  {
    "slug": "quiet-knife-resin",
    "level": 3,
    "dc": 18,
    "type": "poison",
    "rarity": "uncommon",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "humanoid"
      ],
      "habitat": [
        "urban"
      ],
      "theme": [
        "poison",
        "toxin"
      ],
      "origin": [
        "alchemical"
      ],
      "delivery": [
        "weapon",
        "injury"
      ]
    },
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "1d6",
            "poison"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "2d6",
            "poison"
          ],
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "2d6",
            "poison"
          ],
          [
            "condition",
            "clumsy",
            1
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ]
    ],
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "stubborn": false,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none",
    "injuryPoison": true
  },
  {
    "slug": "red-ledger-curse",
    "level": 4,
    "dc": 19,
    "type": "curse",
    "rarity": "uncommon",
    "stat": "will",
    "tags": {
      "creature": [
        "humanoid"
      ],
      "habitat": [
        "urban"
      ],
      "theme": [
        "curse",
        "mental"
      ],
      "origin": [
        "occult"
      ],
      "delivery": [
        "ability"
      ]
    },
    "stages": [
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "stupefied",
            1
          ],
          [
            "condition",
            "frightened",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "stupefied",
            2
          ],
          [
            "condition",
            "frightened",
            1
          ]
        ],
        {
          "gate": 5
        }
      ]
    ],
    "onset": null,
    "maxDuration": [
      7,
      "days"
    ],
    "stubborn": true,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none",
    "injuryPoison": false
  },
  {
    "slug": "night-market-venom",
    "level": 5,
    "dc": 20,
    "type": "poison",
    "rarity": "uncommon",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "humanoid",
        "animal"
      ],
      "habitat": [
        "urban"
      ],
      "theme": [
        "poison",
        "venom"
      ],
      "origin": [
        "alchemical",
        "natural"
      ],
      "delivery": [
        "weapon",
        "injury"
      ],
      "family": [
        "snake"
      ]
    },
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "2d6",
            "poison"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "2d6",
            "poison"
          ],
          [
            "condition",
            "enfeebled",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "3d6",
            "poison"
          ],
          [
            "condition",
            "enfeebled",
            1
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ]
    ],
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "stubborn": false,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none",
    "injuryPoison": true
  },
  {
    "slug": "tenement-pox",
    "level": 6,
    "dc": 22,
    "type": "disease",
    "rarity": "uncommon",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "humanoid",
        "animal"
      ],
      "habitat": [
        "urban"
      ],
      "theme": [
        "disease"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "contact",
        "inhaled"
      ],
      "family": [
        "rat"
      ]
    },
    "stages": [
      [
        [
          8,
          "hours"
        ],
        [
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          8,
          "hours"
        ],
        [
          [
            "damage",
            "2d6",
            "poison"
          ],
          [
            "condition",
            "sickened",
            1
          ],
          [
            "condition",
            "fatigued"
          ]
        ],
        {}
      ],
      [
        [
          8,
          "hours"
        ],
        [
          [
            "damage",
            "2d6",
            "poison"
          ],
          [
            "condition",
            "drained",
            1
          ],
          [
            "condition",
            "sickened",
            2
          ]
        ],
        {}
      ]
    ],
    "onset": [
      4,
      "hours"
    ],
    "maxDuration": [
      4,
      "days"
    ],
    "stubborn": false,
    "virulent": true,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none",
    "injuryPoison": false
  },
  {
    "slug": "whisper-alley-hex",
    "level": 6,
    "dc": 22,
    "type": "curse",
    "rarity": "uncommon",
    "stat": "will",
    "tags": {
      "creature": [
        "humanoid",
        "spirit"
      ],
      "habitat": [
        "urban"
      ],
      "theme": [
        "curse",
        "shadow",
        "mental"
      ],
      "origin": [
        "occult"
      ],
      "delivery": [
        "aura",
        "ability"
      ]
    },
    "stages": [
      [
        [
          1,
          "hours"
        ],
        [
          [
            "condition",
            "frightened",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "hours"
        ],
        [
          [
            "condition",
            "frightened",
            1
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {
          "blockSpeak": true
        }
      ],
      [
        [
          1,
          "hours"
        ],
        [
          [
            "damage",
            "2d6",
            "spirit"
          ],
          [
            "condition",
            "stupefied",
            2
          ]
        ],
        {
          "blockSpeak": true,
          "gate": 5
        }
      ]
    ],
    "onset": null,
    "maxDuration": [
      1,
      "days"
    ],
    "stubborn": true,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none",
    "injuryPoison": false
  },
  {
    "slug": "guildbreaker-poison",
    "level": 7,
    "dc": 23,
    "type": "poison",
    "rarity": "uncommon",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "humanoid"
      ],
      "habitat": [
        "urban"
      ],
      "theme": [
        "poison",
        "toxin",
        "blood"
      ],
      "origin": [
        "alchemical"
      ],
      "delivery": [
        "weapon",
        "injury"
      ]
    },
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "2d6",
            "poison"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "2d6",
            "poison"
          ],
          [
            "condition",
            "enfeebled",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "3d6",
            "poison"
          ],
          [
            "condition",
            "drained",
            1
          ],
          [
            "condition",
            "enfeebled",
            1
          ]
        ],
        {}
      ]
    ],
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "stubborn": false,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none",
    "injuryPoison": true
  },
  {
    "slug": "graveyard-miasma",
    "level": 8,
    "dc": 24,
    "type": "disease",
    "rarity": "uncommon",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "undead",
        "humanoid",
        "spirit"
      ],
      "habitat": [
        "urban"
      ],
      "theme": [
        "disease",
        "necrotic"
      ],
      "origin": [
        "undead",
        "occult"
      ],
      "delivery": [
        "inhaled",
        "aura"
      ]
    },
    "stages": [
      [
        [
          4,
          "hours"
        ],
        [
          [
            "condition",
            "fatigued"
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "2d6",
            "void"
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "3d6",
            "void"
          ],
          [
            "condition",
            "drained",
            1
          ],
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ]
    ],
    "onset": [
      10,
      "minutes"
    ],
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": false,
    "virulent": true,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none",
    "injuryPoison": false
  },
  {
    "slug": "watchmans-sleep",
    "level": 8,
    "dc": 24,
    "type": "poison",
    "rarity": "uncommon",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "humanoid"
      ],
      "habitat": [
        "urban"
      ],
      "theme": [
        "poison",
        "toxin",
        "mental"
      ],
      "origin": [
        "alchemical"
      ],
      "delivery": [
        "ingested"
      ]
    },
    "stages": [
      [
        [
          1,
          "minutes"
        ],
        [
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "minutes"
        ],
        [
          [
            "condition",
            "slowed",
            1
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "minutes"
        ],
        [
          [
            "condition",
            "slowed",
            2
          ],
          [
            "condition",
            "stupefied",
            2
          ]
        ],
        {
          "gate": 5
        }
      ]
    ],
    "onset": [
      1,
      "minutes"
    ],
    "maxDuration": [
      10,
      "minutes"
    ],
    "stubborn": false,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none",
    "injuryPoison": false
  },
  {
    "slug": "bell-tower-curse",
    "level": 9,
    "dc": 26,
    "type": "curse",
    "rarity": "uncommon",
    "stat": "will",
    "tags": {
      "creature": [
        "humanoid",
        "spirit"
      ],
      "habitat": [
        "urban"
      ],
      "theme": [
        "curse",
        "mental"
      ],
      "origin": [
        "occult",
        "magical"
      ],
      "delivery": [
        "aura",
        "ability"
      ]
    },
    "stages": [
      [
        [
          1,
          "hours"
        ],
        [
          [
            "condition",
            "frightened",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "hours"
        ],
        [
          [
            "damage",
            "2d6",
            "spirit"
          ],
          [
            "condition",
            "frightened",
            1
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "hours"
        ],
        [
          [
            "damage",
            "3d6",
            "spirit"
          ],
          [
            "condition",
            "stupefied",
            2
          ]
        ],
        {
          "blockSpeak": true,
          "gate": 5
        }
      ]
    ],
    "onset": null,
    "maxDuration": [
      1,
      "days"
    ],
    "stubborn": true,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none",
    "injuryPoison": false
  },
  {
    "slug": "red-quay-venom",
    "level": 9,
    "dc": 26,
    "type": "poison",
    "rarity": "uncommon",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "humanoid",
        "animal"
      ],
      "habitat": [
        "urban",
        "coastal"
      ],
      "theme": [
        "poison",
        "venom",
        "blood"
      ],
      "origin": [
        "alchemical",
        "natural"
      ],
      "delivery": [
        "weapon",
        "injury"
      ],
      "family": [
        "fish"
      ]
    },
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "3d6",
            "poison"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "3d6",
            "poison"
          ],
          [
            "damagePersistent",
            "1d6",
            "bleed"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "4d6",
            "poison"
          ],
          [
            "damagePersistent",
            "1d6",
            "bleed"
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ]
    ],
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "stubborn": false,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none",
    "injuryPoison": true
  },
  {
    "slug": "foundry-lung",
    "level": 10,
    "dc": 27,
    "type": "disease",
    "rarity": "uncommon",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "humanoid",
        "construct",
        "elemental"
      ],
      "habitat": [
        "urban"
      ],
      "theme": [
        "disease",
        "elemental",
        "corruption"
      ],
      "origin": [
        "technological",
        "alchemical"
      ],
      "delivery": [
        "inhaled"
      ]
    },
    "stages": [
      [
        [
          4,
          "hours"
        ],
        [
          [
            "condition",
            "fatigued"
          ],
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "3d6",
            "fire"
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "3d6",
            "fire"
          ],
          [
            "damagePersistent",
            "1d6",
            "fire"
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {
          "healing": "affliction-damage"
        }
      ]
    ],
    "onset": [
      10,
      "minutes"
    ],
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": false,
    "virulent": true,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none",
    "injuryPoison": false
  },
  {
    "slug": "maskmakers-blight",
    "level": 10,
    "dc": 27,
    "type": "curse",
    "rarity": "uncommon",
    "stat": "will",
    "tags": {
      "creature": [
        "humanoid",
        "fey"
      ],
      "habitat": [
        "urban"
      ],
      "theme": [
        "curse",
        "mental",
        "mutation"
      ],
      "origin": [
        "occult",
        "magical"
      ],
      "delivery": [
        "contact",
        "ability"
      ]
    },
    "stages": [
      [
        [
          1,
          "hours"
        ],
        [
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "hours"
        ],
        [
          [
            "condition",
            "stupefied",
            1
          ],
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {
          "gate": 5
        }
      ],
      [
        [
          1,
          "hours"
        ],
        [
          [
            "damage",
            "3d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            2
          ],
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {
          "blockSpeak": true,
          "gate": 5
        }
      ]
    ],
    "onset": null,
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": true,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none",
    "injuryPoison": false
  },
  {
    "slug": "kings-well-fever",
    "level": 11,
    "dc": 28,
    "type": "disease",
    "rarity": "uncommon",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "humanoid",
        "ooze"
      ],
      "habitat": [
        "urban"
      ],
      "theme": [
        "disease",
        "corruption"
      ],
      "origin": [
        "occult",
        "natural"
      ],
      "delivery": [
        "ingested"
      ]
    },
    "stages": [
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "2d6",
            "poison"
          ],
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "3d6",
            "poison"
          ],
          [
            "condition",
            "drained",
            1
          ],
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "4d6",
            "poison"
          ],
          [
            "condition",
            "drained",
            2
          ],
          [
            "condition",
            "sickened",
            2
          ]
        ],
        {}
      ]
    ],
    "onset": [
      10,
      "minutes"
    ],
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": false,
    "virulent": true,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none",
    "injuryPoison": false
  },
  {
    "slug": "ink-eater-hex",
    "level": 11,
    "dc": 28,
    "type": "curse",
    "rarity": "uncommon",
    "stat": "will",
    "tags": {
      "creature": [
        "humanoid",
        "aberration"
      ],
      "habitat": [
        "urban"
      ],
      "theme": [
        "curse",
        "mental"
      ],
      "origin": [
        "occult"
      ],
      "delivery": [
        "contact",
        "ability"
      ]
    },
    "stages": [
      [
        [
          1,
          "hours"
        ],
        [
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "hours"
        ],
        [
          [
            "damage",
            "3d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {
          "blockSpeak": true
        }
      ],
      [
        [
          1,
          "hours"
        ],
        [
          [
            "damage",
            "4d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            2
          ]
        ],
        {
          "blockSpeak": true,
          "gate": 7
        }
      ]
    ],
    "onset": null,
    "maxDuration": [
      1,
      "days"
    ],
    "stubborn": true,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none",
    "injuryPoison": false
  },
  {
    "slug": "cathedral-ash",
    "level": 12,
    "dc": 30,
    "type": "disease",
    "rarity": "uncommon",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "humanoid",
        "celestial",
        "undead"
      ],
      "habitat": [
        "urban"
      ],
      "theme": [
        "disease",
        "necrotic"
      ],
      "origin": [
        "divine",
        "undead"
      ],
      "delivery": [
        "inhaled"
      ]
    },
    "stages": [
      [
        [
          4,
          "hours"
        ],
        [
          [
            "condition",
            "fatigued"
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "3d6",
            "spirit"
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "4d6",
            "spirit"
          ],
          [
            "condition",
            "drained",
            2
          ]
        ],
        {
          "healing": "affliction-damage"
        }
      ]
    ],
    "onset": [
      10,
      "minutes"
    ],
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": false,
    "virulent": true,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none",
    "injuryPoison": false
  },
  {
    "slug": "moonless-alley-toxin",
    "level": 12,
    "dc": 30,
    "type": "poison",
    "rarity": "uncommon",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "humanoid",
        "spirit"
      ],
      "habitat": [
        "urban"
      ],
      "theme": [
        "poison",
        "toxin",
        "shadow"
      ],
      "origin": [
        "alchemical",
        "occult"
      ],
      "delivery": [
        "weapon",
        "injury"
      ]
    },
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "3d6",
            "poison"
          ],
          [
            "damage",
            "1d6",
            "void"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "4d6",
            "poison"
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "4d6",
            "poison"
          ],
          [
            "damage",
            "2d6",
            "void"
          ],
          [
            "condition",
            "stupefied",
            2
          ]
        ],
        {}
      ]
    ],
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "stubborn": false,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none",
    "injuryPoison": true
  },
  {
    "slug": "plaguehouse-bloom",
    "level": 13,
    "dc": 31,
    "type": "disease",
    "rarity": "uncommon",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "fungus",
        "humanoid"
      ],
      "habitat": [
        "urban",
        "underground"
      ],
      "theme": [
        "disease",
        "spores",
        "fungal"
      ],
      "origin": [
        "natural",
        "occult"
      ],
      "delivery": [
        "inhaled",
        "contact"
      ],
      "family": [
        "parasite"
      ]
    },
    "stages": [
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "3d6",
            "poison"
          ],
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "4d6",
            "poison"
          ],
          [
            "condition",
            "drained",
            1
          ],
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "4d6",
            "poison"
          ],
          [
            "condition",
            "drained",
            2
          ],
          [
            "condition",
            "sickened",
            2
          ]
        ],
        {
          "healing": "affliction-damage"
        }
      ]
    ],
    "onset": [
      10,
      "minutes"
    ],
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": false,
    "virulent": true,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none",
    "injuryPoison": false
  },
  {
    "slug": "debt-collectors-mark",
    "level": 13,
    "dc": 31,
    "type": "curse",
    "rarity": "uncommon",
    "stat": "will",
    "tags": {
      "creature": [
        "humanoid",
        "fiend"
      ],
      "habitat": [
        "urban"
      ],
      "theme": [
        "curse",
        "blood"
      ],
      "origin": [
        "occult",
        "divine"
      ],
      "delivery": [
        "ability",
        "contact"
      ]
    },
    "stages": [
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "damage",
            "3d6",
            "spirit"
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "damage",
            "4d6",
            "spirit"
          ],
          [
            "condition",
            "drained",
            2
          ]
        ],
        {
          "locks": [
            [
              "drained",
              1
            ]
          ],
          "healing": "affliction-damage"
        }
      ]
    ],
    "onset": null,
    "maxDuration": [
      7,
      "days"
    ],
    "stubborn": true,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none",
    "injuryPoison": false
  },
  {
    "slug": "black-carriage-fever",
    "level": 14,
    "dc": 32,
    "type": "disease",
    "rarity": "uncommon",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "humanoid",
        "undead"
      ],
      "habitat": [
        "urban"
      ],
      "theme": [
        "disease",
        "necrotic"
      ],
      "origin": [
        "undead"
      ],
      "delivery": [
        "aura",
        "contact"
      ]
    },
    "stages": [
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "3d6",
            "void"
          ],
          [
            "condition",
            "fatigued"
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "4d6",
            "void"
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "5d6",
            "void"
          ],
          [
            "condition",
            "drained",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ]
    ],
    "onset": [
      10,
      "minutes"
    ],
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": false,
    "virulent": true,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none",
    "injuryPoison": false
  },
  {
    "slug": "courtiers-last-toast",
    "level": 14,
    "dc": 32,
    "type": "poison",
    "rarity": "uncommon",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "humanoid"
      ],
      "habitat": [
        "urban"
      ],
      "theme": [
        "poison",
        "toxin",
        "mental"
      ],
      "origin": [
        "alchemical"
      ],
      "delivery": [
        "ingested"
      ]
    },
    "stages": [
      [
        [
          1,
          "minutes"
        ],
        [
          [
            "damage",
            "3d6",
            "poison"
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "minutes"
        ],
        [
          [
            "damage",
            "4d6",
            "poison"
          ],
          [
            "condition",
            "stupefied",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "minutes"
        ],
        [
          [
            "damage",
            "5d6",
            "poison"
          ],
          [
            "condition",
            "stupefied",
            2
          ],
          [
            "condition",
            "slowed",
            2
          ]
        ],
        {
          "gate": 7
        }
      ]
    ],
    "onset": [
      1,
      "minutes"
    ],
    "maxDuration": [
      10,
      "minutes"
    ],
    "stubborn": false,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none",
    "injuryPoison": false
  },
  {
    "slug": "undercity-crown",
    "level": 15,
    "dc": 34,
    "type": "curse",
    "rarity": "uncommon",
    "stat": "will",
    "tags": {
      "creature": [
        "ooze",
        "humanoid",
        "aberration"
      ],
      "habitat": [
        "urban",
        "underground"
      ],
      "theme": [
        "curse",
        "corruption",
        "mutation"
      ],
      "origin": [
        "occult"
      ],
      "delivery": [
        "contact",
        "aura"
      ]
    },
    "stages": [
      [
        [
          1,
          "hours"
        ],
        [
          [
            "condition",
            "sickened",
            1
          ],
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "hours"
        ],
        [
          [
            "damage",
            "4d6",
            "void"
          ],
          [
            "condition",
            "clumsy",
            2
          ],
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "hours"
        ],
        [
          [
            "damage",
            "5d6",
            "void"
          ],
          [
            "condition",
            "drained",
            1
          ],
          [
            "condition",
            "clumsy",
            2
          ]
        ],
        {
          "healing": "affliction-damage"
        }
      ]
    ],
    "onset": null,
    "maxDuration": [
      1,
      "days"
    ],
    "stubborn": true,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none",
    "injuryPoison": false
  },
  {
    "slug": "saintless-benediction",
    "level": 15,
    "dc": 34,
    "type": "curse",
    "rarity": "uncommon",
    "stat": "will",
    "tags": {
      "creature": [
        "humanoid",
        "celestial",
        "fiend"
      ],
      "habitat": [
        "urban"
      ],
      "theme": [
        "curse",
        "mental"
      ],
      "origin": [
        "divine",
        "occult"
      ],
      "delivery": [
        "ability",
        "aura"
      ]
    },
    "stages": [
      [
        [
          1,
          "hours"
        ],
        [
          [
            "condition",
            "frightened",
            1
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "hours"
        ],
        [
          [
            "damage",
            "4d6",
            "spirit"
          ],
          [
            "condition",
            "stupefied",
            2
          ]
        ],
        {
          "blockSpeak": true,
          "gate": 7
        }
      ],
      [
        [
          1,
          "hours"
        ],
        [
          [
            "damage",
            "5d6",
            "spirit"
          ],
          [
            "condition",
            "drained",
            1
          ],
          [
            "condition",
            "stupefied",
            2
          ]
        ],
        {
          "blockSpeak": true,
          "gate": 7
        }
      ]
    ],
    "onset": null,
    "maxDuration": [
      1,
      "days"
    ],
    "stubborn": true,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none",
    "injuryPoison": false
  },
  {
    "slug": "city-eater-mold",
    "level": 16,
    "dc": 35,
    "type": "disease",
    "rarity": "uncommon",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "fungus",
        "ooze",
        "humanoid"
      ],
      "habitat": [
        "urban",
        "underground"
      ],
      "theme": [
        "disease",
        "spores",
        "fungal",
        "corruption"
      ],
      "origin": [
        "occult",
        "natural"
      ],
      "delivery": [
        "inhaled",
        "contact"
      ],
      "family": [
        "parasite"
      ]
    },
    "stages": [
      [
        [
          2,
          "hours"
        ],
        [
          [
            "damage",
            "4d6",
            "poison"
          ],
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          2,
          "hours"
        ],
        [
          [
            "damage",
            "5d6",
            "poison"
          ],
          [
            "condition",
            "drained",
            1
          ],
          [
            "condition",
            "sickened",
            2
          ]
        ],
        {}
      ],
      [
        [
          2,
          "hours"
        ],
        [
          [
            "damage",
            "6d6",
            "poison"
          ],
          [
            "condition",
            "drained",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {
          "healing": "affliction-damage"
        }
      ]
    ],
    "onset": [
      10,
      "minutes"
    ],
    "maxDuration": [
      1,
      "days"
    ],
    "stubborn": false,
    "virulent": true,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none",
    "injuryPoison": false
  },
  {
    "slug": "glass-district-curse",
    "level": 16,
    "dc": 35,
    "type": "curse",
    "rarity": "uncommon",
    "stat": "will",
    "tags": {
      "creature": [
        "humanoid",
        "construct"
      ],
      "habitat": [
        "urban"
      ],
      "theme": [
        "curse",
        "mental"
      ],
      "origin": [
        "arcane",
        "magical"
      ],
      "delivery": [
        "contact",
        "ability"
      ]
    },
    "stages": [
      [
        [
          1,
          "hours"
        ],
        [
          [
            "condition",
            "dazzled"
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "hours"
        ],
        [
          [
            "damage",
            "4d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            2
          ]
        ],
        {
          "gate": 7
        }
      ],
      [
        [
          1,
          "hours"
        ],
        [
          [
            "damage",
            "5d6",
            "mental"
          ],
          [
            "condition",
            "slowed",
            1
          ],
          [
            "condition",
            "stupefied",
            2
          ]
        ],
        {
          "gate": 7
        }
      ]
    ],
    "onset": null,
    "maxDuration": [
      1,
      "days"
    ],
    "stubborn": true,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none",
    "injuryPoison": false
  },
  {
    "slug": "midnight-procession",
    "level": 17,
    "dc": 36,
    "type": "curse",
    "rarity": "uncommon",
    "stat": "will",
    "tags": {
      "creature": [
        "spirit",
        "undead",
        "humanoid"
      ],
      "habitat": [
        "urban"
      ],
      "theme": [
        "curse",
        "necrotic",
        "shadow"
      ],
      "origin": [
        "undead",
        "occult"
      ],
      "delivery": [
        "aura",
        "ability"
      ]
    },
    "stages": [
      [
        [
          1,
          "hours"
        ],
        [
          [
            "condition",
            "frightened",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "hours"
        ],
        [
          [
            "damage",
            "5d6",
            "spirit"
          ],
          [
            "condition",
            "drained",
            1
          ],
          [
            "condition",
            "frightened",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "hours"
        ],
        [
          [
            "damage",
            "6d6",
            "void"
          ],
          [
            "condition",
            "drained",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {
          "locks": [
            [
              "drained",
              1
            ]
          ]
        }
      ]
    ],
    "onset": null,
    "maxDuration": [
      1,
      "days"
    ],
    "stubborn": true,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none",
    "injuryPoison": false
  },
  {
    "slug": "crown-sewer-venom",
    "level": 17,
    "dc": 36,
    "type": "poison",
    "rarity": "uncommon",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "humanoid",
        "animal"
      ],
      "habitat": [
        "urban",
        "underground"
      ],
      "theme": [
        "poison",
        "venom",
        "corruption"
      ],
      "origin": [
        "alchemical",
        "natural"
      ],
      "delivery": [
        "weapon",
        "injury"
      ],
      "family": [
        "snake"
      ]
    },
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "5d6",
            "poison"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "6d6",
            "poison"
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "7d6",
            "poison"
          ],
          [
            "condition",
            "drained",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ]
    ],
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "stubborn": false,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none",
    "injuryPoison": true
  },
  {
    "slug": "thousand-windows-blight",
    "level": 18,
    "dc": 38,
    "type": "disease",
    "rarity": "uncommon",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "humanoid",
        "aberration"
      ],
      "habitat": [
        "urban"
      ],
      "theme": [
        "disease",
        "mental",
        "corruption"
      ],
      "origin": [
        "occult",
        "magical"
      ],
      "delivery": [
        "aura",
        "inhaled"
      ]
    },
    "stages": [
      [
        [
          2,
          "hours"
        ],
        [
          [
            "damage",
            "4d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          2,
          "hours"
        ],
        [
          [
            "damage",
            "5d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            2
          ],
          [
            "condition",
            "fatigued"
          ]
        ],
        {
          "gate": 7
        }
      ],
      [
        [
          2,
          "hours"
        ],
        [
          [
            "damage",
            "6d6",
            "mental"
          ],
          [
            "condition",
            "drained",
            1
          ],
          [
            "condition",
            "stupefied",
            2
          ]
        ],
        {
          "blockSpeak": true,
          "gate": 7
        }
      ]
    ],
    "onset": [
      10,
      "minutes"
    ],
    "maxDuration": [
      1,
      "days"
    ],
    "stubborn": false,
    "virulent": true,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none",
    "injuryPoison": false
  },
  {
    "slug": "empty-throne-curse",
    "level": 19,
    "dc": 39,
    "type": "curse",
    "rarity": "uncommon",
    "stat": "will",
    "tags": {
      "creature": [
        "humanoid",
        "fiend",
        "spirit"
      ],
      "habitat": [
        "urban"
      ],
      "theme": [
        "curse",
        "mental",
        "shadow"
      ],
      "origin": [
        "occult",
        "divine"
      ],
      "delivery": [
        "ability",
        "aura"
      ]
    },
    "stages": [
      [
        [
          1,
          "hours"
        ],
        [
          [
            "damage",
            "5d6",
            "spirit"
          ],
          [
            "condition",
            "frightened",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "hours"
        ],
        [
          [
            "damage",
            "6d6",
            "spirit"
          ],
          [
            "condition",
            "drained",
            1
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {
          "gate": 9
        }
      ],
      [
        [
          1,
          "hours"
        ],
        [
          [
            "damage",
            "7d6",
            "void"
          ],
          [
            "condition",
            "drained",
            2
          ],
          [
            "condition",
            "stupefied",
            2
          ]
        ],
        {
          "blockSpeak": true,
          "gate": 9,
          "locks": [
            [
              "drained",
              1
            ]
          ]
        }
      ]
    ],
    "onset": null,
    "maxDuration": [
      1,
      "days"
    ],
    "stubborn": true,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none",
    "injuryPoison": false
  },
  {
    "slug": "last-bell-dead-city",
    "level": 20,
    "dc": 40,
    "type": "curse",
    "rarity": "rare",
    "stat": "will",
    "tags": {
      "creature": [
        "undead",
        "spirit",
        "humanoid"
      ],
      "habitat": [
        "urban"
      ],
      "theme": [
        "curse",
        "necrotic",
        "shadow"
      ],
      "origin": [
        "undead",
        "occult"
      ],
      "delivery": [
        "aura",
        "ability"
      ]
    },
    "stages": [
      [
        [
          1,
          "hours"
        ],
        [
          [
            "damage",
            "6d6",
            "spirit"
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "hours"
        ],
        [
          [
            "damage",
            "7d6",
            "void"
          ],
          [
            "condition",
            "drained",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {
          "gate": 9
        }
      ],
      [
        [
          1,
          "hours"
        ],
        [
          [
            "damage",
            "8d6",
            "void"
          ],
          [
            "condition",
            "drained",
            2
          ],
          [
            "death",
            "death-effect"
          ]
        ],
        {
          "locks": [
            [
              "drained",
              1
            ]
          ],
          "healing": "affliction-damage"
        }
      ]
    ],
    "onset": null,
    "maxDuration": [
      1,
      "days"
    ],
    "stubborn": true,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none",
    "injuryPoison": false
  }
];

export const URBAN_HORRORS_MODULE_ID = MODULE_ID;
export const URBAN_HORRORS_CONTENT_VERSION = CONTENT_VERSION;
export const URBAN_HORRORS_DEFINITIONS = Object.freeze(SPECS.map(makeDefinition));
export function createUrbanHorrorsDefinitions() { return URBAN_HORRORS_DEFINITIONS.map((definition) => structuredClone(definition)); }

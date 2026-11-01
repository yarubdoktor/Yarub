# IRON FRONT — Architecture Decision Record

**Status:** Accepted  
**Decision:** Adopt the modified B architecture as the long-term target architecture.  
**Scope:** `IRON-FRONT/` only.  
**Technology decision:** Keep the current React + TypeScript + Three.js / React Three Fiber + Capacitor stack. No engine or framework replacement is approved by this decision.

## 1. Architectural goals

IRON FRONT is a hybrid RTS: players develop a base and command armies on an open battlefield. The architecture must support independent simulation, responsive presentation, testable gameplay systems, and measured scaling toward large battles (including a target of 1,000+ units).

The 1,000+ unit target is a performance objective, not a guarantee from folder structure. It must be demonstrated through profiling and repeatable load tests.

## 2. Target source layout

```text
src/
├── engine/
│   ├── core/          # Engine composition, loop, clock, typed event contracts
│   ├── simulation/    # Authoritative world state and fixed-step simulation orchestration
│   ├── ecs/           # Entity IDs, component data, system contracts/storage
│   ├── world/         # World model, terrain, spatial queries and occupancy
│   ├── navigation/    # Grid, hierarchical paths, flow fields, steering, reservations
│   ├── units/         # Unit data access and unit-focused systems
│   ├── buildings/     # Building data access and building-focused systems
│   ├── combat/        # Targeting, damage, projectiles and combat resolution
│   ├── ai/            # Decision-making and tactical behaviours
│   ├── economy/       # Resources, production and costs
│   ├── input/         # Device input translated into game commands
│   ├── renderer/      # Three.js presentation of simulation snapshots/state
│   ├── effects/       # Visual effects presentation
│   ├── audio/         # Audio presentation and playback
│   ├── assets/        # Asset loading, caching and lifecycle
│   └── persistence/   # Save/load serialization and migrations
├── game/
│   ├── data/          # Declarative game balance/configuration data
│   ├── rules/         # IRON FRONT gameplay rules
│   └── missions/      # Mission definitions and scenario setup
├── scenes/            # Scene composition and lifecycle
│   └── adapters/      # Explicit bridge between React lifecycle and engine scenes
├── ui/
│   ├── hooks/
│   └── components/
└── App.tsx            # Application composition and UI root
```

This is the target organization, not a claim that every folder or subsystem already exists. Add folders when their first real implementation is needed; do not create empty abstractions just to match the diagram.

## 3. Dependency rules

Dependencies point inward toward domain and simulation logic. Presentation and platform layers may depend on engine-facing contracts; the simulation must never depend on presentation or platform code.

| From | May depend on | Must not depend on |
|---|---|---|
| `ui/`, `App.tsx` | scene adapters, public engine/application APIs, UI contracts | internal mutable simulation stores or renderer internals |
| `scenes/`, `scenes/adapters/` | engine public APIs, renderer, input, UI integration | React from core simulation modules |
| `engine/renderer/` | renderer-facing read models, asset/effect interfaces, Three.js | React UI, gameplay authority, direct mutation of simulation state |
| `engine/input/` | input platform APIs, command interfaces | direct mutation of unit/component data |
| `engine/simulation/` | core contracts, ECS, world and gameplay systems | React, Three.js, DOM, browser UI, renderer, audio playback |
| `engine/units/`, `buildings/`, `combat/`, `ai/`, `economy/`, `navigation/` | simulation contracts, ECS data, world/domain contracts | React, Three.js, DOM, UI, renderer |
| `engine/world/`, `engine/ecs/`, `engine/core/` | lower-level engine/domain contracts and types | feature managers that depend back on them, UI or rendering frameworks |
| `game/rules/`, `game/data/`, `game/missions/` | domain contracts and declarative data | React components and renderer implementation |
| `engine/persistence/` | serializable domain state and versioned save contracts | React component state and Three.js scene objects |

### Non-negotiable boundaries

1. Simulation is authoritative for gameplay outcomes. Rendering never decides movement, hits, damage, victory or defeat.
2. Simulation code must be runnable in tests without mounting React, creating a DOM, or initializing Three.js/WebGL.
3. The renderer reads simulation state or presentation snapshots. It does not own authoritative health, resources, orders or unit positions.
4. UI and input submit commands through a defined application/engine boundary. They do not edit simulation stores directly.
5. Avoid circular imports. Lower-level modules must not import higher-level feature modules. Shared contracts belong in a single lower-level location.
6. Do not duplicate event definitions. There must be one authoritative typed event contract; avoid parallel competing definitions in `core/EventBus` and `shared/events`.
7. Keep module APIs narrow. A manager must not become a catch-all owner of unrelated systems.

## 4. ECS and simulation rules

- An Entity is an identifier, not a base class for gameplay objects.
- Components are focused data structures; they do not inherit gameplay behaviour.
- Systems implement behaviour by operating on the relevant component data.
- Prefer composition over deep inheritance.
- Keep simulation updates deterministic where practical: explicit inputs, controlled time steps, stable update ordering and reproducible tests.
- Use a fixed-step simulation clock independent of the render frame rate. Rendering may interpolate between simulation states but must not advance authoritative gameplay.
- Define system ownership clearly so that two systems do not silently write the same state in conflicting ways.

## 5. Navigation and large-battle readiness

Navigation is a pipeline, not a single A* function. The design may combine:

- Grid or navigation graph and spatial occupancy queries.
- Hierarchical pathfinding for long-distance movement.
- Flow fields for groups sharing destinations.
- Local steering and collision avoidance for nearby interactions.
- Reservation, priority or traffic rules to prevent units blocking narrow passages and each other.

Do not implement every technique prematurely. Select and profile techniques against representative battle scenarios. Spatial indexing, update scheduling, data layout and rendering instancing/level-of-detail must be measured as unit counts grow.

## 6. Testing and performance gates

- Unit-test gameplay systems without React or Three.js.
- Test command handling, movement, targeting, combat and save/load independently.
- Add integration tests for system ordering and complete simulation ticks.
- Create repeatable stress scenarios at increasing unit counts, including 100, 300, 500 and 1,000+ units.
- Record frame time, simulation tick time, memory use, pathfinding cost and worst-case spikes.
- Do not claim a unit-count target is achieved until it passes on the agreed target mobile devices and representative battle conditions.

## 7. Migration policy and current implementation

The repository already contains an initial engine core and a loop integration. Current files include `engine/core/GameEngine.ts`, `engine/core/GameLoop.ts`, `engine/core/EventBus.ts`, `engine/systems/registerGameSystems.ts` and `engine/createGameEngine.ts`.

The current implementation is an initial foundation, not yet the complete target architecture. In particular, existing gameplay systems still live under `game/` and the application currently imports some gameplay commands directly. This is recorded as migration work, not treated as compliance with the final dependency rules.

Migrate incrementally, preserving a working game at each stage:

1. Define stable simulation/domain contracts and command boundaries.
2. Move authoritative gameplay state and systems behind the simulation layer.
3. Make UI and input submit commands rather than mutate gameplay state.
4. Make the renderer consume read-only presentation data.
5. Add ECS/navigation capabilities only as validated gameplay needs require them.
6. Profile and optimize using repeatable stress tests.

Do not perform a wholesale rewrite solely to match the folder tree.

## 8. Change control

This document is the architectural reference for future work in `IRON-FRONT/`. Any intentional exception or structural change must explain the reason, affected dependency boundaries, migration impact and test evidence. Do not change the approved technology stack, build an APK, or broaden changes outside `IRON-FRONT/` without explicit user approval.

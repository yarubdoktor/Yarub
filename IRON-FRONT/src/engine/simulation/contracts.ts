import type { BuildingKind, GameState, UnitKind } from './model';

/**
 * Commands are intent messages from UI, input or AI.
 * They describe what a caller requests; simulation systems remain authoritative
 * and decide whether the request is valid and what state changes follow.
 */
export type GameCommand =
  | { type: 'units/select'; unitIds: number[]; additive?: boolean }
  | { type: 'units/move'; unitIds: number[]; x: number; z: number }
  | { type: 'units/attack'; unitIds: number[]; targetUnitId: number }
  | { type: 'units/attack-base'; unitIds: number[] }
  | { type: 'units/hold'; unitIds: number[] }
  | { type: 'buildings/queue'; buildingKind: BuildingKind }
  | { type: 'units/train'; unitKind: UnitKind };

/** Read-only view exposed to presentation and application layers. */
export type SimulationSnapshot = Readonly<GameState>;

/** Minimal boundary consumed by UI/input adapters; implementation comes later. */
export interface SimulationPort {
  getSnapshot(): SimulationSnapshot;
  dispatch(command: GameCommand): void;
  subscribe(listener: (snapshot: SimulationSnapshot) => void): () => void;
}

/** A pure simulation step transforms one state snapshot into the next. */
export type SimulationStep = (
  previous: GameState,
  deltaSeconds: number,
) => GameState;

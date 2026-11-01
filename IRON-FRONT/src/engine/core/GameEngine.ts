import type { GameState } from '../simulation/model';
import { EventBus, type EngineEventMap } from './EventBus';

export type GameSystem = {
  name: string;
  priority: number;
  update: (state: GameState, deltaSeconds: number) => GameState;
};

/**
 * Deterministic game simulation coordinator.
 * Systems receive immutable state and return the next state.
 * Rendering and UI are deliberately kept outside this class.
 */
export class GameEngine {
  readonly events = new EventBus<EngineEventMap>();
  private systems: GameSystem[] = [];

  registerSystem(system: GameSystem): void {
    if (this.systems.some(existing => existing.name === system.name)) {
      throw new Error('Game system already registered: ' + system.name);
    }
    this.systems = [...this.systems, system].sort((a, b) => a.priority - b.priority);
  }

  getSystemNames(): string[] {
    return this.systems.map(system => system.name);
  }

  step(previous: GameState, deltaSeconds = 1): GameState {
    if (previous.outcome !== 'playing') return previous;
    const ticked = { ...previous, tick: previous.tick + 1 };
    const next = this.systems.reduce(
      (state, system) => system.update(state, deltaSeconds),
      ticked,
    );
    this.events.emit('engine:tick', { tick: next.tick, deltaSeconds });
    if (next.outcome === 'victory' || next.outcome === 'defeat') {
      this.events.emit('mission:outcome', { outcome: next.outcome });
    }
    return next;
  }
}

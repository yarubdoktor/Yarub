import type { GameState } from './model';
import type { GameCommand, SimulationPort, SimulationSnapshot } from './contracts';
import type { GameEngine } from '../core/GameEngine';
import { queueBuilding } from '../../game/buildingSystem';
import { issueAttack, issueAttackBase, issueMove, holdSelected } from '../../game/combatSystem';
import { queueUnit } from '../../game/trainingSystem';

/**
 * Owns the authoritative single-player state.
 * Commands are translated here; presentation layers never mutate game state.
 */
export class SimulationRuntime implements SimulationPort {
  private state: GameState;
  private listeners = new Set<(snapshot: SimulationSnapshot) => void>();

  constructor(private readonly engine: GameEngine, initialState: GameState) {
    this.state = initialState;
  }

  getSnapshot(): SimulationSnapshot {
    return this.state;
  }

  subscribe(listener: (snapshot: SimulationSnapshot) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  dispatch(command: GameCommand): void {
    if (this.state.outcome !== 'playing' && command.type !== 'units/select') return;
    const selected = new Set(command.type === 'units/select' ? command.unitIds : command.unitIds);
    let next = this.state;

    switch (command.type) {
      case 'units/select':
        next = {
          ...next,
          units: next.units.map(unit => {
            if (unit.faction !== 'player' || unit.hp <= 0) return unit;
            const shouldSelect = selected.has(unit.id);
            return { ...unit, selected: command.additive ? (shouldSelect ? !unit.selected : unit.selected) : shouldSelect };
          }),
        };
        break;
      case 'units/move': {
        const chosen = next.units.map(unit => ({ ...unit, selected: unit.faction === 'player' && selected.has(unit.id) }));
        next = issueMove({ ...next, units: chosen }, command.x, command.z);
        break;
      }
      case 'units/attack': {
        const chosen = next.units.map(unit => ({ ...unit, selected: unit.faction === 'player' && selected.has(unit.id) }));
        next = issueAttack({ ...next, units: chosen }, command.targetUnitId);
        break;
      }
      case 'units/attack-base': {
        const chosen = next.units.map(unit => ({ ...unit, selected: unit.faction === 'player' && selected.has(unit.id) }));
        next = issueAttackBase({ ...next, units: chosen });
        break;
      }
      case 'units/hold': {
        const chosen = next.units.map(unit => ({ ...unit, selected: unit.faction === 'player' && selected.has(unit.id) }));
        next = holdSelected({ ...next, units: chosen });
        break;
      }
      case 'buildings/queue':
        next = queueBuilding(next, command.buildingKind);
        break;
      case 'units/train':
        next = queueUnit(next, command.unitKind);
        break;
    }

    if (next !== this.state) this.publish(next);
  }

  step(deltaSeconds: number): void {
    const next = this.engine.step(this.state, deltaSeconds);
    if (next !== this.state) this.publish(next);
  }

  /** Used by save-game loading and mission restart; the supplied state is normalized by the caller. */
  restore(snapshot: GameState): void {
    this.publish(snapshot);
  }

  private publish(next: GameState): void {
    this.state = next;
    for (const listener of this.listeners) listener(this.state);
  }
}

import {
  advanceCombat,
  advanceEnemyWaves,
} from '../../game/combatSystem';
import { advanceConstruction } from '../../game/buildingSystem';
import { advanceTraining } from '../../game/trainingSystem';
import type { GameEngine } from '../core/GameEngine';

/** Registers the authoritative single-player simulation pipeline. */
export function registerGameSystems(engine: GameEngine): void {
  engine.registerSystem({
    name: 'construction',
    priority: 10,
    update: state => advanceConstruction(state),
  });
  engine.registerSystem({
    name: 'training',
    priority: 20,
    update: state => advanceTraining(state),
  });
  engine.registerSystem({
    name: 'combat',
    priority: 30,
    update: state => advanceCombat(state),
  });
  engine.registerSystem({
    name: 'enemy-waves',
    priority: 40,
    update: state => advanceEnemyWaves(state),
  });
}

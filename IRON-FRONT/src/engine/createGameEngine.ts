import { GameEngine } from './core/GameEngine';
import { registerGameSystems } from './systems/registerGameSystems';

export function createGameEngine(): GameEngine {
  const engine = new GameEngine();
  registerGameSystems(engine);
  return engine;
}

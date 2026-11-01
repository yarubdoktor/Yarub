import type { Cost, GameState, Resources } from './types';
import { BUILDINGS } from './catalog';

export function canAfford(resources: Resources, cost: Cost): boolean {
  return resources.steel >= cost.steel && resources.fuel >= cost.fuel && resources.power >= cost.power;
}
export function payCost(resources: Resources, cost: Cost): Resources {
  return { ...resources, steel:resources.steel-cost.steel, fuel:resources.fuel-cost.fuel, power:resources.power-cost.power };
}
export function produceResources(state: GameState): Resources {
  const income = { steel:2, fuel:1, power:0, ammo:0 };
  for (const building of state.buildings) {
    if (building.status !== 'active') continue;
    const spec = BUILDINGS.find(item=>item.kind===building.kind);
    if (!spec?.income) continue;
    income.steel += 0;
    income.fuel += spec.income.fuel ?? 0;
    income.power += spec.income.power ?? 0;
    income.ammo += spec.income.ammo ?? 0;
  }
  return {
    steel:Math.min(99999,state.resources.steel+income.steel),
    fuel:Math.min(99999,state.resources.fuel+income.fuel),
    power:Math.min(99999,state.resources.power+income.power),
    ammo:Math.min(99999,state.resources.ammo+income.ammo),
  };
}
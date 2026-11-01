import type { Building, BuildingKind, GameState, Resources } from '../model';
import { BUILDINGS } from '../../../game/catalog';
import { INITIAL_LOGISTICS } from './logisticsSystem';

const POWER_DEMAND:Partial<Record<BuildingKind,number>> = {
  barracks:1, refinery:1, factory:2, research:2, watchtower:1, hospital:1, ammo:1,
};
const POWER_PRIORITY:Record<BuildingKind,number> = {
  hq:0, power:1, barracks:2, factory:3, refinery:4, ammo:5, hospital:6, research:7, watchtower:8,
};
const BASE_CAPACITY:Resources = {steel:2500,fuel:1800,power:1200,ammo:1200};

function calculateCapacity(state:GameState):Resources {
  const hqLevel=Math.max(1,...state.buildings.filter(b=>b.kind==='hq').map(b=>b.level));
  const capacity={...BASE_CAPACITY,
    steel:BASE_CAPACITY.steel+((hqLevel-1)*500),
    fuel:BASE_CAPACITY.fuel+((hqLevel-1)*500),
    power:BASE_CAPACITY.power+((hqLevel-1)*300),
    ammo:BASE_CAPACITY.ammo+((hqLevel-1)*300),
  };
  for(const building of state.buildings) {
    if(building.status!=='active')continue;
    if(building.kind==='refinery')capacity.fuel+=500*building.level;
    if(building.kind==='power')capacity.power+=300*building.level;
    if(building.kind==='ammo')capacity.ammo+=500*building.level;
  }
  return capacity;
}

function allocatePower(buildings:Building[]):{buildings:Building[];generation:number;demand:number;supplied:number} {
  const active=buildings.filter(b=>b.status==='active');
  const generation=2+active.filter(b=>b.kind==='power').reduce((sum,b)=>sum+(BUILDINGS.find(s=>s.kind==='power')?.income?.power??5)*b.level,0);
  const demand=active.reduce((sum,b)=>sum+(POWER_DEMAND[b.kind]??0)*b.level,0);
  let remaining=generation;
  const poweredIds=new Set<string>();
  const consumers=[...active].filter(b=>(POWER_DEMAND[b.kind]??0)>0)
    .sort((a,b)=>POWER_PRIORITY[a.kind]-POWER_PRIORITY[b.kind]||a.id.localeCompare(b.id));
  for(const building of active)if(building.kind==='hq'||building.kind==='power')poweredIds.add(building.id);
  for(const building of consumers) {
    const required=(POWER_DEMAND[building.kind]??0)*building.level;
    if(remaining>=required){poweredIds.add(building.id);remaining-=required;}
  }
  const nextBuildings=buildings.map(b=>({...b,powered:b.status==='active'&&poweredIds.has(b.id)}));
  const supplied=consumers.filter(b=>poweredIds.has(b.id)).reduce((sum,b)=>sum+(POWER_DEMAND[b.kind]??0)*b.level,0);
  return {buildings:nextBuildings,generation,demand,supplied};
}

export function advanceEconomy(state:GameState):GameState {
  const allocation=allocatePower(state.buildings);
  const resourceCapacity=calculateCapacity({...state,buildings:allocation.buildings});
  const income:Resources={steel:2,fuel:1,power:0,ammo:0};
  for(const building of allocation.buildings) {
    if(!building.powered)continue;
    const spec=BUILDINGS.find(item=>item.kind===building.kind);
    if(!spec?.income)continue;
    income.steel+=spec.income.steel??0;
    income.fuel+=spec.income.fuel??0;
    income.power+=spec.income.power??0;
    income.ammo+=spec.income.ammo??0;
  }
  const resources:Resources={
    steel:Math.min(resourceCapacity.steel,state.resources.steel+income.steel),
    fuel:Math.min(resourceCapacity.fuel,state.resources.fuel+income.fuel),
    power:Math.min(resourceCapacity.power,state.resources.power+income.power),
    ammo:Math.min(resourceCapacity.ammo,state.resources.ammo+income.ammo),
  };
  return {...state,buildings:allocation.buildings,resources,resourceCapacity,
    powerGrid:{generation:allocation.generation,demand:allocation.demand,supplied:allocation.supplied}};
}

/** Adds defaults for saves created before the economy simulation was introduced. */
export function normalizeEconomyState(state:GameState):GameState {
  const legacy=state as GameState & {resourceCapacity?:Resources;powerGrid?:GameState['powerGrid']};
  const buildings=legacy.buildings.map(building=>({...building,
    powered:typeof building.powered==='boolean'?building.powered:building.status==='active'}));
  const normalized={...legacy,logistics:legacy.logistics??INITIAL_LOGISTICS,buildings,
    resourceCapacity:legacy.resourceCapacity??{...BASE_CAPACITY},
    powerGrid:legacy.powerGrid??{generation:2,demand:0,supplied:0}};
  return advanceEconomy(normalized);
}

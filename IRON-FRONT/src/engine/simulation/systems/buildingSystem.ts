import type { Building, BuildingKind, GameState } from '../model';
import { BUILDINGS } from '../../../game/catalog';
import { canAfford, payCost, produceResources } from '../../../game/economy';

const SLOTS = [
  {x:-8.2,z:1.2},{x:-5.2,z:1.2},{x:-8.2,z:5.2},{x:-5.2,z:5.2},
  {x:-11,z:-1.2},{x:-2.4,z:1.2},{x:-2.4,z:5.2},{x:-11,z:8.5},
  {x:-5.2,z:8.5},{x:-8.2,z:-1.2},\n  {x:-14,z:-1.2},{x:-14,z:4},{x:-14,z:8.5},{x:-5.2,z:-1.2},\n  {x:-2.4,z:-1.2},{x:-2.4,z:8.5},{x:-11,z:4},{x:-8.2,z:8.5},
];

export function queueBuilding(state: GameState, kind: BuildingKind): GameState {
  const spec = BUILDINGS.find(item=>item.kind===kind);
  if (!spec) return {...state,message:'UNKNOWN BUILDING BLUEPRINT'};
  if (!canAfford(state.resources,spec.cost)) return {...state,message:'INSUFFICIENT RESOURCES FOR CONSTRUCTION'};
  if (state.buildings.filter(b=>b.kind===kind).length >= (kind==='watchtower'?4:1)) return {...state,message:'BUILD LIMIT REACHED FOR THIS STRUCTURE'};
  const occupied = new Set(state.buildings.map(b=>b.x+':'+b.z));
  const slot = SLOTS.find(point=>!occupied.has(point.x+':'+point.z));
  if (!slot) return {...state,message:'NO AVAILABLE CONSTRUCTION PLOT INSIDE THE FORTRESS'};
  const building: Building = {
    id:'BLD-'+String(state.nextBuildingId).padStart(3,'0'),kind,level:1,hp:100,maxHp:100,
    ...slot,status:'constructing',remaining:spec.seconds,buildSeconds:spec.seconds,
  };
  return {...state,resources:payCost(state.resources,spec.cost),buildings:[...state.buildings,building],
    nextBuildingId:state.nextBuildingId+1,message:spec.name+' CONSTRUCTION STARTED'};
}

export function advanceConstruction(state: GameState): GameState {
  const buildings = state.buildings.map(b=>{
    if(b.status!=='constructing') return b;
    const remaining=Math.max(0,b.remaining-1);
    return {...b,remaining,status:remaining===0?'active' as const:'constructing' as const};
  });
  const completed=state.buildings.find((b,i)=>b.status==='constructing'&&buildings[i].status==='active');
  const progressed={...state,buildings};
  const withIncome={...progressed,resources:produceResources(progressed)};
  return completed ? {...withIncome,message:BUILDINGS.find(s=>s.kind===completed.kind)?.name+' CONSTRUCTION COMPLETE'} : withIncome;
}
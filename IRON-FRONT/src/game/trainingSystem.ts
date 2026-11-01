import type { GameState, Unit, UnitKind } from './types';

const TRAINING:Record<UnitKind,{steel:number;fuel:number;ammo:number;seconds:number}> = {
  infantry:{steel:90,fuel:15,ammo:8,seconds:8},
  tank:{steel:260,fuel:90,ammo:24,seconds:18},
};

export function queueUnit(state:GameState,kind:UnitKind):GameState {
  if(state.outcome!=='playing')return state;
  const required=kind==='tank'?'factory':'barracks';
  if(!state.buildings.some(b=>b.kind===required&&b.status==='active'))
    return {...state,message:kind==='tank'?'BUILD AN ARMORED FACTORY FIRST':'FIELD BARRACKS REQUIRED'};
  if(state.trainingQueue.length>=4)return {...state,message:'REINFORCEMENT QUEUE IS FULL'};
  const cost=TRAINING[kind];
  if(state.resources.steel<cost.steel||state.resources.fuel<cost.fuel||state.resources.ammo<cost.ammo)
    return {...state,message:'INSUFFICIENT STEEL, FUEL OR AMMUNITION'};
  const order={id:state.nextTrainingId,kind,remaining:cost.seconds,seconds:cost.seconds};
  return {...state,resources:{...state.resources,steel:state.resources.steel-cost.steel,fuel:state.resources.fuel-cost.fuel,ammo:state.resources.ammo-cost.ammo},
    trainingQueue:[...state.trainingQueue,order],nextTrainingId:state.nextTrainingId+1,message:(kind==='tank'?'ARMORED VEHICLE':'INFANTRY SQUAD')+' ADDED TO REINFORCEMENT QUEUE'};
}

function createUnit(id:number,kind:UnitKind):Unit {
  const tank=kind==='tank';
  return {id,faction:'player',x:-4.1,z:8.2+(id%3)*1.1,hp:tank?120:80,maxHp:tank?120:80,kind,
    selected:false,order:'idle',targetX:-4.1,targetZ:8.2+(id%3)*1.1,targetId:null,
    range:tank?6:3.8,damage:tank?27:12,speed:tank?1.2:1.65,cooldown:0};
}

export function advanceTraining(state:GameState):GameState {
  if(!state.trainingQueue.length||state.outcome!=='playing')return state;
  const [current,...rest]=state.trainingQueue;
  const remaining=Math.max(0,current.remaining-1);
  if(remaining>0)return {...state,trainingQueue:[{...current,remaining},...rest]};
  const unit=createUnit(state.nextUnitId,current.kind);
  return {...state,trainingQueue:rest,units:[...state.units,unit],nextUnitId:state.nextUnitId+1,
    message:(current.kind==='tank'?'ARMORED VEHICLE':'INFANTRY SQUAD')+' REINFORCEMENTS DEPLOYED'};
}
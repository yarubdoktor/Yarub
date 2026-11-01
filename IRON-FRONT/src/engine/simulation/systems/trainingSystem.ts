import type { GameState, Unit, UnitKind } from '../model';

const TRAINING:Record<UnitKind,{steel:number;fuel:number;ammo:number;seconds:number}> = {
  infantry:{steel:90,fuel:15,ammo:8,seconds:8},
  tank:{steel:260,fuel:90,ammo:24,seconds:18},
};

export function queueUnit(state:GameState,kind:UnitKind):GameState {
  if(state.outcome!=='playing')return state;
  const required=kind==='tank'?'factory':'barracks';
  const facility=state.buildings.find(b=>b.kind===required&&b.status==='active');
  if(!facility)
    return {...state,message:kind==='tank'?'BUILD AN ARMORED FACTORY FIRST':'FIELD BARRACKS REQUIRED'};
  if(!facility.powered)return {...state,message:'TRAINING FACILITY HAS NO POWER'};
  if(state.trainingQueue.length>=4)return {...state,message:'REINFORCEMENT QUEUE IS FULL'};
  const cost=TRAINING[kind];
  const missing=[
    state.resources.steel<cost.steel?'الفولاذ '+state.resources.steel+'/'+cost.steel:'',
    state.resources.fuel<cost.fuel?'الوقود '+state.resources.fuel+'/'+cost.fuel:'',
    state.resources.ammo<cost.ammo?'الذخيرة '+state.resources.ammo+'/'+cost.ammo:'',
  ].filter(Boolean);
  if(missing.length)
    return {...state,message:'موارد التدريب غير كافية — الناقص: '+missing.join('، ')};
  const order={id:state.nextTrainingId,kind,remaining:cost.seconds,seconds:cost.seconds};
  return {...state,resources:{...state.resources,steel:state.resources.steel-cost.steel,fuel:state.resources.fuel-cost.fuel,ammo:state.resources.ammo-cost.ammo},
    trainingQueue:[...state.trainingQueue,order],nextTrainingId:state.nextTrainingId+1,message:(kind==='tank'?'ARMORED VEHICLE':'INFANTRY SQUAD')+' ADDED TO REINFORCEMENT QUEUE'};
}

function createUnit(id:number,kind:UnitKind,rallyPoint:GameState['rallyPoint'],state:GameState):Unit {
  const tank=kind==='tank';
  const productionBuilding=state.buildings.find(b=>b.kind===(tank?'factory':'barracks')&&b.status==='active');
  const x=(productionBuilding?.x??-8.2)+2.1+((id%3)-1)*.7;
  const z=(productionBuilding?.z??5.2)+2.1+Math.floor(id%4)*.65;
  return {id,faction:'player',x,z,hp:tank?120:80,maxHp:tank?120:80,kind,
    selected:false,order:rallyPoint?'move':'idle',targetX:rallyPoint?.x??x,targetZ:rallyPoint?.z??z,targetId:null,
    range:tank?6:3.8,damage:tank?27:12,speed:tank?1.2:1.65,cooldown:0};
}

export function advanceTraining(state:GameState):GameState {
  if(!state.trainingQueue.length||state.outcome!=='playing')return state;
  const [current,...rest]=state.trainingQueue;
  const required=current.kind==='tank'?'factory':'barracks';
  const facility=state.buildings.find(b=>b.kind===required&&b.status==='active'&&b.powered);
  if(!facility)return state;
  const remaining=Math.max(0,current.remaining-1);
  if(remaining>0)return {...state,trainingQueue:[{...current,remaining},...rest]};
  const unit=createUnit(state.nextUnitId,current.kind,state.rallyPoint??null,state);
  return {...state,trainingQueue:rest,units:[...state.units,unit],nextUnitId:state.nextUnitId+1,
    message:(current.kind==='tank'?'ARMORED VEHICLE':'INFANTRY SQUAD')+' REINFORCEMENTS DEPLOYED'};
}

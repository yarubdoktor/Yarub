import type { GameState, Unit } from './types';

const distance=(a:Unit,b:Unit)=>Math.hypot(a.x-b.x,a.z-b.z);
const moveToward=(unit:Unit,x:number,z:number):Unit=>{
  const dx=x-unit.x,dz=z-unit.z,d=Math.hypot(dx,dz);
  if(d<0.12)return {...unit,x,targetX:x,targetZ:z,order:unit.order==='move'?'idle':unit.order};
  const step=Math.min(d,unit.speed);
  return {...unit,x:unit.x+dx/d*step,z:unit.z+dz/d*step};
};

export function issueMove(state:GameState,x:number,z:number):GameState {
  const units=state.units.map(u=>u.faction==='player'&&u.selected?{...u,order:'move' as const,targetX:x,targetZ:z,targetId:null}:u);
  const count=units.filter(u=>u.faction==='player'&&u.selected).length;
  return count?{...state,units,message:count+' UNIT(S) MOVING TO DESIGNATED POSITION'}:{...state,message:'SELECT FRIENDLY UNITS FIRST'};
}

export function issueAttack(state:GameState,targetId:number):GameState {
  const target=state.units.find(u=>u.id===targetId&&u.faction==='enemy'&&u.hp>0);
  if(!target)return state;
  const units=state.units.map(u=>u.faction==='player'&&u.selected?{...u,order:'attack' as const,targetId,targetX:target.x,targetZ:target.z}:u);
  const count=units.filter(u=>u.faction==='player'&&u.selected).length;
  return count?{...state,units,message:'ATTACK ORDER CONFIRMED — HOSTILE '+targetId}:{...state,message:'SELECT FRIENDLY UNITS FIRST'};
}

export function advanceCombat(state:GameState):GameState {
  let units=state.units.filter(u=>u.hp>0).map(u=>({...u,cooldown:Math.max(0,u.cooldown-1)}));
  units=units.map(unit=>{
    if(unit.faction==='enemy'&&unit.order==='idle'){
      const target=units.filter(v=>v.faction==='player').sort((a,b)=>distance(unit,a)-distance(unit,b))[0];
      if(target)return {...unit,order:'attack' as const,targetId:target.id,targetX:target.x,targetZ:target.z};
    }
    return unit;
  });
  units=units.map(unit=>{
    if(unit.order==='attack'&&unit.targetId!==null){
      const target=units.find(v=>v.id===unit.targetId&&v.hp>0);
      if(!target)return {...unit,order:'idle' as const,targetId:null};
      const moved={...unit,targetX:target.x,targetZ:target.z};
      if(distance(moved,target)>unit.range*.88)return moveToward(moved,target.x,target.z);
      return moved;
    }
    if(unit.order==='move')return moveToward(unit,unit.targetX,unit.targetZ);
    return unit;
  });
  const damage=new Map<number,number>();
  units.forEach(unit=>{
    if(unit.order!=='attack'||unit.targetId===null||unit.cooldown>0)return;
    const target=units.find(v=>v.id===unit.targetId&&v.hp>0);
    if(target&&distance(unit,target)<=unit.range)damage.set(target.id,(damage.get(target.id)||0)+unit.damage);
  });
  units=units.map(u=>damage.has(u.id)?{...u,hp:Math.max(0,u.hp-(damage.get(u.id)||0)),cooldown:1}:u);
  const destroyed=state.units.filter(u=>u.hp>0&&units.some(v=>v.id===u.id&&v.hp<=0));
  const playerLosses=destroyed.filter(u=>u.faction==='player').length;
  const enemyLosses=destroyed.filter(u=>u.faction==='enemy').length;
  const survivors=units.map(u=>u.hp<=0?{...u,selected:false,order:'idle' as const}:u);
  const message=enemyLosses?'HOSTILE UNIT DESTROYED':playerLosses?'FRIENDLY UNIT LOST':state.message;
  return {...state,units:survivors,message};
}

export function holdSelected(state:GameState):GameState {
  const units=state.units.map(u=>u.faction==='player'&&u.selected?{...u,order:'idle' as const,targetId:null,targetX:u.x,targetZ:u.z}:u);
  return {...state,units,message:'SELECTED UNITS HOLD POSITION'};
}
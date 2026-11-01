import type { GameState, Unit } from './types';

const PLAYER_HQ={x:-12,z:4};
const ENEMY_HQ={x:20,z:-4};
const distance=(a:{x:number;z:number},b:{x:number;z:number})=>Math.hypot(a.x-b.x,a.z-b.z);
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
export function issueAttackBase(state:GameState):GameState {
  const units=state.units.map(u=>u.faction==='player'&&u.selected?{...u,order:'attack' as const,targetId:-1,targetX:ENEMY_HQ.x,targetZ:ENEMY_HQ.z}:u);
  const count=units.filter(u=>u.faction==='player'&&u.selected).length;
  return count?{...state,units,message:'ALL SELECTED UNITS ADVANCING ON HOSTILE HEADQUARTERS'}:{...state,message:'SELECT FRIENDLY UNITS FIRST'};
}
export function holdSelected(state:GameState):GameState {
  const units=state.units.map(u=>u.faction==='player'&&u.selected?{...u,order:'idle' as const,targetId:null,targetX:u.x,targetZ:u.z}:u);
  return {...state,units,message:'SELECTED UNITS HOLD POSITION'};
}

export function advanceCombat(state:GameState):GameState {
  if(state.outcome!=='playing')return state;
  let units=state.units.filter(u=>u.hp>0).map(u=>({...u,cooldown:Math.max(0,u.cooldown-1)}));
  units=units.map(unit=>{
    if(unit.faction==='enemy'&&unit.order==='idle'){
      const target=units.filter(v=>v.faction==='player').sort((a,b)=>distance(unit,a)-distance(unit,b))[0];
      return target?{...unit,order:'attack' as const,targetId:target.id,targetX:target.x,targetZ:target.z}:
        {...unit,order:'attack' as const,targetId:-2,targetX:PLAYER_HQ.x,targetZ:PLAYER_HQ.z};
    }
    return unit;
  });
  units=units.map(unit=>{
    if(unit.order==='attack'&&unit.targetId!==null){
      if(unit.targetId===-1||unit.targetId===-2){
        const point=unit.targetId===-1?ENEMY_HQ:PLAYER_HQ;
        const hp=unit.targetId===-1?state.enemyHp:state.baseHp;
        if(hp<=0)return {...unit,order:'idle' as const,targetId:null};
        if(distance(unit,point)>unit.range*.88)return moveToward(unit,point.x,point.z);
        return {...unit,targetX:point.x,targetZ:point.z};
      }
      const target=units.find(v=>v.id===unit.targetId&&v.hp>0);
      if(!target)return {...unit,order:'idle' as const,targetId:null};
      if(distance(unit,target)>unit.range*.88)return moveToward({...unit,targetX:target.x,targetZ:target.z},target.x,target.z);
      return {...unit,targetX:target.x,targetZ:target.z};
    }
    if(unit.order==='move')return moveToward(unit,unit.targetX,unit.targetZ);
    return unit;
  });
  const damage=new Map<number,number>();
  let enemyBaseDamage=0,playerBaseDamage=0,ammoSpent=0;
  const firing=new Set<number>();
  units.forEach(unit=>{
    if(unit.order!=='attack'||unit.targetId===null||unit.cooldown>0)return;
    if(unit.faction==='player'&&state.resources.ammo<=ammoSpent)return;
    let inRange=false;
    if(unit.targetId===-1)inRange=distance(unit,ENEMY_HQ)<=unit.range;
    else if(unit.targetId===-2)inRange=distance(unit,PLAYER_HQ)<=unit.range;
    else {const target=units.find(v=>v.id===unit.targetId&&v.hp>0);inRange=!!target&&distance(unit,target)<=unit.range;}
    if(!inRange)return;
    firing.add(unit.id);
    if(unit.faction==='player')ammoSpent++;
    if(unit.targetId===-1)enemyBaseDamage+=unit.damage;
    else if(unit.targetId===-2)playerBaseDamage+=unit.damage;
    else damage.set(unit.targetId,(damage.get(unit.targetId)||0)+unit.damage);
  });
  units=units.map(u=>damage.has(u.id)?{...u,hp:Math.max(0,u.hp-(damage.get(u.id)||0))}:firing.has(u.id)?{...u,cooldown:1}:u);
  const enemyHp=Math.max(0,state.enemyHp-enemyBaseDamage);
  const baseHp=Math.max(0,state.baseHp-playerBaseDamage);
  const destroyed=state.units.filter(u=>u.hp>0&&units.some(v=>v.id===u.id&&v.hp<=0));
  const playerLosses=destroyed.filter(u=>u.faction==='player').length;
  const enemyLosses=destroyed.filter(u=>u.faction==='enemy').length;
  units=units.map(u=>u.hp<=0?{...u,selected:false,order:'idle' as const}:u);
  const outcome=enemyHp<=0?'victory':baseHp<=0?'defeat':'playing';
  const message=outcome==='victory'?'MISSION COMPLETE — HOSTILE HQ DESTROYED':
    outcome==='defeat'?'MISSION FAILED — YOUR HEADQUARTERS HAS FALLEN':
    enemyBaseDamage?'HOSTILE HQ UNDER FIRE':playerBaseDamage?'YOUR HEADQUARTERS IS UNDER ATTACK':
    enemyLosses?'HOSTILE UNIT DESTROYED':playerLosses?'FRIENDLY UNIT LOST':state.message;
  return {...state,units,enemyHp,baseHp,outcome,resources:{...state.resources,ammo:Math.max(0,state.resources.ammo-ammoSpent)},message};
}

export function advanceEnemyWaves(state:GameState):GameState {
  if(state.outcome!=='playing'||state.tick===0||state.tick%60!==0||state.wave>=5)return state;
  const enemyCount=state.units.filter(u=>u.faction==='enemy'&&u.hp>0).length;
  if(enemyCount>=10)return {...state,wave:state.wave+1,message:'HOSTILE REINFORCEMENT WAVE '+(state.wave+1)+' DETECTED — ENEMY CAP REACHED'};
  const wave=state.wave+1;
  const amount=Math.min(2+Math.floor(wave/2),10-enemyCount);
  const newUnits:Unit[]=Array.from({length:amount},(_,i)=>{
    const id=state.nextUnitId+i;
    const tank=wave>=2&&i===0;
    const kind=tank?'tank':'infantry';
    const x=15+(i%2)*2.1,z=-7+((i*4+wave)%5)*3.2;
    return {id,faction:'enemy',x,z,hp:tank?115:75,maxHp:tank?115:75,kind,selected:false,order:'idle',targetX:x,targetZ:z,targetId:null,
      range:tank?5.2:3.4,damage:tank?18:9,speed:tank?1.05:1.35,cooldown:0};
  });
  return {...state,units:[...state.units,...newUnits],wave,nextUnitId:state.nextUnitId+amount,message:'HOSTILE REINFORCEMENT WAVE '+wave+' INBOUND'};
}
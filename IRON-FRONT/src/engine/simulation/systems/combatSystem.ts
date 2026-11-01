import type { GameState, Unit } from '../model';

const PLAYER_HQ={x:-12,z:4};
const ENEMY_HQ={x:54,z:-8};
const distance=(a:{x:number;z:number},b:{x:number;z:number})=>Math.hypot(a.x-b.x,a.z-b.z);
const moveToward=(unit:Unit,x:number,z:number):Unit=>{
  const dx=x-unit.x,dz=z-unit.z,d=Math.hypot(dx,dz);
  if(d<0.12)return {...unit,x,targetX:x,targetZ:z,order:unit.order==='move'?'idle':unit.order};
  const step=Math.min(d,unit.speed);
  return {...unit,x:unit.x+dx/d*step,z:unit.z+dz/d*step};
};

export function issueMove(state:GameState,x:number,z:number):GameState {
  const selected=state.units.filter(u=>u.faction==='player'&&u.selected&&u.hp>0);
  if(!selected.length)return {...state,message:'SELECT FRIENDLY UNITS FIRST'};
  // Give each unit a distinct slot so a group advances in formation instead of
  // converging on one coordinate and stacking on top of itself.
  const columns=Math.ceil(Math.sqrt(selected.length));
  const spacing=selected.some(u=>u.kind==='tank')?2.6:1.55;
  const slots=new Map<number,{x:number;z:number}>();
  selected.forEach((unit,index)=>{
    const row=Math.floor(index/columns);
    const column=index%columns;
    slots.set(unit.id,{
      x:x+(column-(Math.min(columns,selected.length)-1)/2)*spacing,
      z:z+(row-(Math.ceil(selected.length/columns)-1)/2)*spacing,
    });
  });
  const units=state.units.map(unit=>{
    const slot=slots.get(unit.id);
    return slot?{...unit,order:'move' as const,targetX:slot.x,targetZ:slot.z,targetId:null}:unit;
  });
  return {...state,units,message:selected.length+' UNIT(S) MOVING IN FORMATION'};
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
  // Enemy units stay on guard during preparation; they do not initiate combat.
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
  units=units.map(u=>{
    if(damage.has(u.id)){
      const hp=Math.max(0,u.hp-(damage.get(u.id)||0));
      if(u.faction==='enemy'&&hp>0){
        const attacker=units.filter(v=>v.faction==='player'&&v.hp>0).sort((a,b)=>distance(u,a)-distance(u,b))[0];
        return attacker?{...u,hp,order:'attack' as const,targetId:attacker.id,targetX:attacker.x,targetZ:attacker.z}:{...u,hp};
      }
      return {...u,hp};
    }
    return firing.has(u.id)?{...u,cooldown:1}:u;
  });
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
  // No scripted waves during the strategic preparation phase.
  return state;
}

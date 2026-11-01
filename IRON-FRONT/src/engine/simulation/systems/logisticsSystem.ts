import type { GameState, Resources } from '../model';

const MINE = { x: 28, z: 13 };
const BASE = { x: -12, z: 4 };
const ZERO: Resources = { steel: 0, fuel: 0, power: 0, ammo: 0 };
const LOAD: Resources = { steel: 24, fuel: 16, power: 12, ammo: 14 };

function moveToward(x:number,z:number,tx:number,tz:number,distance:number):{x:number;z:number;arrived:boolean} {
  const dx=tx-x,dz=tz-z,length=Math.hypot(dx,dz);
  if(length<=distance||length<0.001)return {x:tx,z:tz,arrived:true};
  return {x:x+dx/length*distance,z:z+dz/length*distance,arrived:false};
}

/** Continuous mine-to-base logistics. Cargo is credited only after the truck unloads. */
export function advanceLogistics(state:GameState,deltaSeconds:number):GameState {
  const logistics=state.logistics;
  if(!logistics)return state;
  let elapsed=logistics.elapsed+deltaSeconds;
  let worker={...logistics.worker};
  let truck={...logistics.truck};
  let cargo={...logistics.cargo};
  let delivered=logistics.delivered;
  const workers=logistics.workers.map(w=>({...w}));
  const workerSpeed=2.4*deltaSeconds;
  for(const w of workers){
    if(w.phase==='walking'){
      const p=moveToward(w.x,w.z,MINE.x+(w.id%2)*1.1,MINE.z+(w.id%2)*.7,workerSpeed);
      w.x=p.x;w.z=p.z;if(p.arrived)w.phase='working';
    }
  }
  const truckSpeed=7.5*deltaSeconds;
  if(truck.phase==='to-mine'){
    const p=moveToward(truck.x,truck.z,MINE.x,MINE.z,truckSpeed);
    truck.x=p.x;truck.z=p.z;if(p.arrived){truck.phase='loading';truck.timer=0;}
  }else if(truck.phase==='loading'){
    truck.timer+=deltaSeconds;
    if(truck.timer>=5){cargo={...LOAD};truck.phase='to-base';}
  }else if(truck.phase==='to-base'){
    const p=moveToward(truck.x,truck.z,BASE.x,BASE.z,truckSpeed);
    truck.x=p.x;truck.z=p.z;if(p.arrived){truck.phase='unloading';truck.timer=0;}
  }else{
    truck.timer+=deltaSeconds;
    if(truck.timer>=2){
      const cap=state.resourceCapacity;
      const resources:Resources={
        steel:Math.min(cap.steel,state.resources.steel+cargo.steel),
        fuel:Math.min(cap.fuel,state.resources.fuel+cargo.fuel),
        power:Math.min(cap.power,state.resources.power+cargo.power),
        ammo:Math.min(cap.ammo,state.resources.ammo+cargo.ammo),
      };
      truck={...truck,phase:'to-mine',timer:0};
      return {...state,resources,logistics:{...logistics,elapsed,workers,worker,truck,cargo:{...ZERO},delivered:delivered+1}};
    }
  }
  return {...state,logistics:{...logistics,elapsed,workers,worker,truck,cargo,delivered}};
}

export const INITIAL_LOGISTICS = {
  mine:{x:MINE.x,z:MINE.z},
  workers:[
    {id:1,x:BASE.x+2,z:BASE.z+3,phase:'walking' as const},
    {id:2,x:BASE.x+3,z:BASE.z+3.5,phase:'walking' as const},
    {id:3,x:BASE.x+4,z:BASE.z+3,phase:'walking' as const},
  ],
  worker:{x:0,z:0},
  truck:{x:BASE.x,z:BASE.z,phase:'to-mine' as const,timer:0},
  cargo:{...ZERO},
  delivered:0,
  elapsed:0,
};

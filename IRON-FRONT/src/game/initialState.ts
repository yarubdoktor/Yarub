import type { GameState } from './types';
import { INITIAL_LOGISTICS } from '../engine/simulation/systems/logisticsSystem';

export const initialGameState:GameState = {
  resources:{steel:900,fuel:650,power:260,ammo:360},
  resourceCapacity:{steel:2500,fuel:1800,power:1200,ammo:1200},
  powerGrid:{generation:2,demand:1,supplied:1},
  logistics:INITIAL_LOGISTICS,
  buildings:[
    {id:'HQ-001',kind:'hq',level:1,hp:100,maxHp:100,x:-12,z:4,status:'active',remaining:0,buildSeconds:0,powered:true},
    {id:'BLD-000',kind:'barracks',level:1,hp:100,maxHp:100,x:-8.2,z:5.2,status:'active',remaining:0,buildSeconds:0,powered:true},
  ],
  units:[
    {id:1,faction:'player',x:-3.2,z:2.5,hp:100,maxHp:100,kind:'tank',selected:false,order:'idle',targetX:-3.2,targetZ:2.5,targetId:null,range:5.5,damage:24,speed:1.35,cooldown:0},
    {id:2,faction:'player',x:-2.2,z:4.2,hp:80,maxHp:80,kind:'infantry',selected:false,order:'idle',targetX:-2.2,targetZ:4.2,targetId:null,range:3.8,damage:12,speed:1.7,cooldown:0},
    {id:3,faction:'player',x:-3.7,z:5.3,hp:80,maxHp:80,kind:'infantry',selected:false,order:'idle',targetX:-3.7,targetZ:5.3,targetId:null,range:3.8,damage:12,speed:1.7,cooldown:0},
    {id:101,faction:'enemy',x:48,z:-13,hp:115,maxHp:115,kind:'tank',selected:false,order:'idle',targetX:48,targetZ:-13,targetId:null,range:5.2,damage:18,speed:1.05,cooldown:0},
    {id:102,faction:'enemy',x:50,z:-7,hp:75,maxHp:75,kind:'infantry',selected:false,order:'idle',targetX:50,targetZ:-7,targetId:null,range:3.4,damage:9,speed:1.35,cooldown:0},
  ],
  trainingQueue:[],enemyHp:100,baseHp:100,tick:0,wave:0,outcome:'playing',rallyPoint:null,
  message:'القاعدة جاهزة — جهّز قواتك ودمّر مقر العدو.',
  nextBuildingId:1,nextUnitId:4,nextTrainingId:1,
};

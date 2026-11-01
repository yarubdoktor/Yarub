import type { GameState } from './types';

export const initialGameState: GameState = {
  resources:{steel:900,fuel:650,power:260,ammo:360},
  buildings:[
    {id:'HQ-001',kind:'hq',level:1,hp:100,maxHp:100,x:-12,z:4,status:'active',remaining:0,buildSeconds:0},
    {id:'BLD-000',kind:'barracks',level:1,hp:100,maxHp:100,x:-8.2,z:5.2,status:'active',remaining:0,buildSeconds:0},
  ],
  units:[
    {id:1,x:-3.2,z:2.5,hp:100,kind:'tank',selected:false},
    {id:2,x:-2.2,z:4.2,hp:80,kind:'infantry',selected:false},
    {id:3,x:-3.7,z:5.3,hp:80,kind:'infantry',selected:false},
  ],
  enemyHp:100,baseHp:100,tick:0,message:'FORTRESS ONLINE — COMMAND AUTHORIZED',nextBuildingId:1,
};
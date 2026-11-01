/** Stable domain model shared by the IRON FRONT simulation and gameplay rules. */

export type BuildingKind = 'hq' | 'barracks' | 'power' | 'refinery' | 'factory' | 'research' | 'watchtower' | 'hospital' | 'ammo';
export type BuildingStatus = 'active' | 'constructing';
export type Cost = { steel:number; fuel:number; power:number };
export type Resources = { steel:number; fuel:number; power:number; ammo:number };
export type PowerGrid = { generation:number; demand:number; supplied:number };
export type Building = { id:string; kind:BuildingKind; level:number; hp:number; maxHp:number; x:number; z:number; status:BuildingStatus; remaining:number; buildSeconds:number; powered:boolean };
export type UnitKind = 'tank' | 'infantry';
export type UnitFaction = 'player' | 'enemy';
export type UnitOrder = 'idle' | 'move' | 'attack';
export type Unit = {
  id:number; faction:UnitFaction; x:number; z:number; hp:number; maxHp:number;
  kind:UnitKind; selected:boolean; order:UnitOrder; targetX:number; targetZ:number;
  targetId:number|null; range:number; damage:number; speed:number; cooldown:number;
};
export type TrainingOrder = { id:number; kind:UnitKind; remaining:number; seconds:number };
export type GameOutcome = 'playing' | 'victory' | 'defeat';
export type GameState = {
  resources:Resources; resourceCapacity:Resources; powerGrid:PowerGrid;
  buildings:Building[]; units:Unit[]; trainingQueue:TrainingOrder[];
  enemyHp:number; baseHp:number; tick:number; wave:number; outcome:GameOutcome;
  /** Global rally point used by newly trained friendly reinforcements. */
  rallyPoint:{x:number;z:number}|null;
  message:string; nextBuildingId:number; nextUnitId:number; nextTrainingId:number;
};

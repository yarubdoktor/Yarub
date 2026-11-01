import type { BuildingKind, Cost } from './types';

export type BuildingSpec = {
  kind: BuildingKind;
  name: string;
  short: string;
  description: string;
  cost: Cost;
  seconds: number;
  income?: Partial<Record<'steel'|'fuel'|'power'|'ammo', number>>;
};

export const BUILDINGS: BuildingSpec[] = [
  { kind:'power', name:'POWER STATION', short:'PWR', description:'Generates electrical power for the base.', cost:{steel:180,fuel:25,power:0}, seconds:12, income:{power:5} },
  { kind:'refinery', name:'FUEL REFINERY', short:'FUEL', description:'Processes and generates fuel reserves.', cost:{steel:220,fuel:40,power:10}, seconds:16, income:{fuel:5} },
  { kind:'factory', name:'ARMORED FACTORY', short:'ARM', description:'Unlocks heavy vehicle production capacity.', cost:{steel:320,fuel:100,power:35}, seconds:22 },
  { kind:'research', name:'RESEARCH CENTER', short:'R&D', description:'Establishes the military technology program.', cost:{steel:280,fuel:30,power:55}, seconds:20 },
  { kind:'watchtower', name:'WATCHTOWER', short:'DEF', description:'Adds a fortified observation and defense point.', cost:{steel:120,fuel:15,power:15}, seconds:10 },
  { kind:'hospital', name:'FIELD HOSPITAL', short:'MED', description:'Provides recovery capacity for damaged units.', cost:{steel:190,fuel:20,power:20}, seconds:15 },
  { kind:'ammo', name:'MUNITIONS DEPOT', short:'AMMO', description:'Produces ammunition for frontline operations.', cost:{steel:210,fuel:45,power:15}, seconds:16, income:{ammo:4} },
];

export const BUILDING_LABELS: Record<BuildingKind,string> = {
  hq:'COMMAND HQ', barracks:'FIELD BARRACKS', power:'POWER STATION', refinery:'FUEL REFINERY',
  factory:'ARMORED FACTORY', research:'RESEARCH CENTER', watchtower:'WATCHTOWER',
  hospital:'FIELD HOSPITAL', ammo:'MUNITIONS DEPOT',
};
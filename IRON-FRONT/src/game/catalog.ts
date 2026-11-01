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
  { kind:'power', name:'محطة الطاقة', short:'طاقة', description:'تنتج الطاقة الكهربائية اللازمة للقاعدة.', cost:{steel:180,fuel:25,power:0}, seconds:12, income:{power:5} },
  { kind:'refinery', name:'مصفاة الوقود', short:'وقود', description:'تعالج الوقود وتزيد الاحتياطي.', cost:{steel:220,fuel:40,power:10}, seconds:16, income:{fuel:5} },
  { kind:'factory', name:'مصنع المدرعات', short:'مدرعات', description:'يفتح إنتاج الدبابات والمركبات الثقيلة.', cost:{steel:320,fuel:100,power:35}, seconds:22 },
  { kind:'research', name:'مركز الأبحاث', short:'بحث', description:'مركز تطوير التقنيات العسكرية.', cost:{steel:280,fuel:30,power:55}, seconds:20 },
  { kind:'watchtower', name:'برج المراقبة', short:'دفاع', description:'نقطة مراقبة محصنة للمساعدة في الدفاع.', cost:{steel:120,fuel:15,power:15}, seconds:10 },
  { kind:'hospital', name:'المستشفى الميداني', short:'طب', description:'يعالج الوحدات المتضررة.', cost:{steel:190,fuel:20,power:20}, seconds:15 },
  { kind:'ammo', name:'مستودع الذخيرة', short:'ذخيرة', description:'ينتج الذخيرة اللازمة للعمليات القتالية.', cost:{steel:210,fuel:45,power:15}, seconds:16, income:{ammo:4} },
];

export const BUILDING_LABELS: Record<BuildingKind,string> = {
  hq:'مقر القيادة', barracks:'ثكنة المشاة', power:'محطة الطاقة', refinery:'مصفاة الوقود',
  factory:'مصنع المدرعات', research:'مركز الأبحاث', watchtower:'برج المراقبة',
  hospital:'المستشفى الميداني', ammo:'مستودع الذخيرة',
};

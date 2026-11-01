import { useEffect, useRef, useState } from 'react';
import { FortressScene } from './game/FortressScene';
import { BUILDINGS } from './game/catalog';
import { initialGameState } from './game/initialState';
import type { BuildingKind, GameState, UnitKind } from './game/types';
import { createGameEngine } from './engine/createGameEngine';
import { GameLoop } from './engine/core/GameLoop';
import { SimulationRuntime } from './engine/simulation/SimulationRuntime';

const buildingNames: Record<BuildingKind,string> = {
  hq:'مقر القيادة', barracks:'ثكنة المشاة', power:'محطة الطاقة', refinery:'مصفاة الوقود',
  factory:'مصنع المدرعات', research:'مركز الأبحاث', watchtower:'برج المراقبة',
  hospital:'المستشفى الميداني', ammo:'مستودع الذخيرة',
};
const buildingDescriptions: Record<BuildingKind,string> = {
  power:'ينتج الطاقة الكهربائية اللازمة للقاعدة.',
  refinery:'يعالج الوقود ويزيد احتياطي الوقود.',
  factory:'يفتح إمكانية إنتاج الدبابات والمركبات الثقيلة.',
  research:'مركز تطوير التقنيات العسكرية.',
  watchtower:'نقطة مراقبة محصنة تساعد في الدفاع.',
  hospital:'يوفر القدرة على معالجة الوحدات المتضررة.',
  ammo:'ينتج الذخيرة اللازمة للعمليات القتالية.',
  hq:'المقر الرئيسي للقيادة والسيطرة.',
  barracks:'تدريب وتجهيز قوات المشاة.',
};
function arabicMessage(message:string):string {
  const exact:Record<string,string> = {
    'FORTRESS ONLINE — BUILD YOUR FORCE AND DESTROY THE HOSTILE HQ':'القاعدة جاهزة — جهّز قواتك ودمّر مقر العدو.',
    'FORTRESS, REINFORCEMENTS AND MISSION STATE SAVED':'تم حفظ القاعدة والتعزيزات وحالة المهمة.',
    'SAVE FAILED — STORAGE UNAVAILABLE':'تعذر الحفظ — مساحة التخزين غير متاحة.',
    'NO SAVED MISSION FOUND':'لا توجد مهمة محفوظة.',
    'SAVE DATA COULD NOT BE LOADED':'تعذر تحميل بيانات الحفظ.',
    'SIMULATION PAUSED':'تم إيقاف المحاكاة مؤقتاً.',
    'SIMULATION RESUMED':'تم استئناف المحاكاة.',
    'UNKNOWN BUILDING BLUEPRINT':'مخطط المبنى غير معروف.',
    'INSUFFICIENT RESOURCES FOR CONSTRUCTION':'الموارد غير كافية للبناء.',
    'NO AVAILABLE CONSTRUCTION PLOT INSIDE THE FORTRESS':'لا توجد مساحة بناء فارغة داخل القاعدة.',
    'BUILD AN ARMORED FACTORY FIRST':'أنشئ مصنع المدرعات وأكمل بناءه قبل تدريب الدبابات.',
    'FIELD BARRACKS REQUIRED':'يجب إنشاء ثكنة للمشاة أولاً.',
    'REINFORCEMENT QUEUE IS FULL':'قائمة تدريب التعزيزات ممتلئة.',
    'INSUFFICIENT STEEL, FUEL OR AMMUNITION':'لا يكفي الفولاذ أو الوقود أو الذخيرة.',
    'TRAINING FACILITY HAS NO POWER':'توقف التدريب — منشأة التدريب لا تحصل على طاقة كافية.',
    'SELECT FRIENDLY UNITS FIRST':'حدد وحداتك أولاً.',
    'ALL SELECTED UNITS ADVANCING ON HOSTILE HEADQUARTERS':'كل الوحدات المحددة تتقدم نحو مقر العدو.',
    'SELECTED UNITS HOLD POSITION':'الوحدات المحددة تثبت مواقعها.',
    'RALLY POINT DESIGNATED':'تم تحديد نقطة تجمع القوات. ستتجه إليها التعزيزات الجديدة.',
    'RALLY POINT CLEARED':'تم إلغاء نقطة تجمع القوات.',
    'MISSION COMPLETE — HOSTILE HQ DESTROYED':'اكتملت المهمة — تم تدمير مقر العدو.',
    'MISSION FAILED — YOUR HEADQUARTERS HAS FALLEN':'فشلت المهمة — تم تدمير مقر قيادتك.',
    'HOSTILE HQ UNDER FIRE':'مقر العدو يتعرض للهجوم.',
    'YOUR HEADQUARTERS IS UNDER ATTACK':'مقر قيادتك يتعرض للهجوم!',
  };
  if(exact[message])return exact[message];
  let m=message.match(/^(\d+) UNIT\(S\) MOVING TO DESIGNATED POSITION$/);
  if(m)return 'الوحدات تتحرك إلى الموقع المحدد: '+m[1];
  m=message.match(/^ATTACK ORDER CONFIRMED — HOSTILE (\d+)$/);
  if(m)return 'تم تأكيد أمر الهجوم على وحدة العدو رقم '+m[1]+'.';
  m=message.match(/^HOSTILE REINFORCEMENT WAVE (\d+) DETECTED — ENEMY CAP REACHED$/);
  if(m)return 'تم رصد موجة تعزيزات العدو رقم '+m[1]+' — وصلت قوات العدو إلى الحد الأقصى.';
  m=message.match(/^HOSTILE REINFORCEMENT WAVE (\d+) INBOUND$/);
  if(m)return 'موجة تعزيزات العدو رقم '+m[1]+' في الطريق!';
  m=message.match(/^(\\d+) UNIT\\(S\\) MOVING IN FORMATION$/);
  if(m)return 'القوات تتقدم بتشكيل منظم: '+m[1]+' وحدة.';
  if(message==='HOSTILE UNIT DESTROYED')return 'تم تدمير وحدة معادية.';
  if(message==='FRIENDLY UNIT LOST')return 'خسرت إحدى وحداتك.';
  if(message.endsWith(' CONSTRUCTION STARTED'))return 'بدأ بناء: '+message.replace(' CONSTRUCTION STARTED','')+'.';
  if(message.endsWith(' CONSTRUCTION COMPLETE'))return 'اكتمل بناء: '+message.replace(' CONSTRUCTION COMPLETE','')+'.';
  if(message.includes('ARMORED VEHICLE')&&message.includes('REINFORCEMENT QUEUE'))return 'تمت إضافة دبابة إلى قائمة التعزيزات.';
  if(message.includes('INFANTRY SQUAD')&&message.includes('REINFORCEMENT QUEUE'))return 'تمت إضافة فرقة مشاة إلى قائمة التعزيزات.';
  if(message.includes('ARMORED VEHICLE')&&message.includes('DEPLOYED'))return 'وصلت تعزيزات الدبابات إلى ساحة المعركة.';
  if(message.includes('INFANTRY SQUAD')&&message.includes('DEPLOYED'))return 'وصلت تعزيزات المشاة إلى ساحة المعركة.';
  return message;
}

export default function App() {
  const [game,setGame]=useState<GameState>(initialGameState);
  const simulationRef=useRef<SimulationRuntime | null>(null);
  const loopRef=useRef<GameLoop | null>(null);
  if(!simulationRef.current)simulationRef.current=new SimulationRuntime(createGameEngine(),initialGameState);
  const simulation=simulationRef.current;
  const [tab,setTab]=useState<'command'|'build'|'army'>('command');
  const [running,setRunning]=useState(true);
  const [moveMode,setMoveMode]=useState(false);
  const [rallyMode,setRallyMode]=useState(false);
  const [addMode,setAddMode]=useState(false);

  useEffect(()=>simulation.subscribe(snapshot=>setGame(snapshot as GameState)),[simulation]);
  useEffect(()=>{
    if(!running)return;
    const loop=new GameLoop(deltaSeconds=>simulation.step(deltaSeconds));
    loopRef.current=loop;
    loop.start();
    return ()=>{loop.stop();if(loopRef.current===loop)loopRef.current=null;};
  },[running,simulation]);
  useEffect(()=>{if(game.outcome!=='playing')setRunning(false);},[game.outcome]);

  const build=(kind:BuildingKind)=>simulation.dispatch({type:'buildings/queue',buildingKind:kind});
  const train=(kind:UnitKind)=>simulation.dispatch({type:'units/train',unitKind:kind});
  const selectUnit=(id:number,isEnemy:boolean,multi:boolean)=>{
    if(game.outcome!=='playing')return;
    if(isEnemy){simulation.dispatch({type:'units/attack',unitIds:game.units.filter(u=>u.faction==='player'&&u.selected&&u.hp>0).map(u=>u.id),targetUnitId:id});setMoveMode(false);setRallyMode(false);return;}
    simulation.dispatch({type:'units/select',unitIds:[id],additive:multi});
  };
  const moveUnits=(x:number,z:number)=>{
    if(rallyMode){simulation.dispatch({type:'units/set-rally-point',x,z});setRallyMode(false);setMoveMode(false);return;}
    if(!moveMode)return;
    simulation.dispatch({type:'units/move',unitIds:game.units.filter(u=>u.faction==='player'&&u.selected&&u.hp>0).map(u=>u.id),x,z});setMoveMode(false);
  };
  const save=()=>{try{localStorage.setItem('iron-front-save-v4',JSON.stringify(game));simulation.restore({...simulation.getSnapshot(),message:'FORTRESS, REINFORCEMENTS AND MISSION STATE SAVED'});}catch{simulation.restore({...simulation.getSnapshot(),message:'SAVE FAILED — STORAGE UNAVAILABLE'});}};
  const load=()=>{try{const raw=localStorage.getItem('iron-front-save-v4')||localStorage.getItem('iron-front-save-v3');if(raw){const saved=JSON.parse(raw) as Partial<GameState>;simulation.restore({...initialGameState,...saved,trainingQueue:saved.trainingQueue||[],wave:saved.wave||0,outcome:saved.outcome||'playing',nextTrainingId:saved.nextTrainingId||1});setMoveMode(false);setRunning(true);}else simulation.restore({...simulation.getSnapshot(),message:'NO SAVED MISSION FOUND'});}catch{simulation.restore({...simulation.getSnapshot(),message:'SAVE DATA COULD NOT BE LOADED'});}};
  const restart=()=>{simulation.restore(initialGameState);setRunning(true);setMoveMode(false);setRallyMode(false);setAddMode(false);setTab('command');};
  const count=(kind:BuildingKind)=>game.buildings.filter(b=>b.kind===kind).length;
  const selectedCount=game.units.filter(u=>u.faction==='player'&&u.selected&&u.hp>0).length;
  const playerUnits=game.units.filter(u=>u.faction==='player'&&u.hp>0);
  const enemyUnits=game.units.filter(u=>u.faction==='enemy'&&u.hp>0);
  const firstTraining=game.trainingQueue[0];
  const tankMissing=[
    game.resources.steel<260?'فولاذ '+game.resources.steel+'/260':null,
    game.resources.fuel<90?'وقود '+game.resources.fuel+'/90':null,
    game.resources.ammo<24?'ذخيرة '+game.resources.ammo+'/24':null,
  ].filter(Boolean);
  const infantryMissing=[
    game.resources.steel<90?'فولاذ '+game.resources.steel+'/90':null,
    game.resources.fuel<15?'وقود '+game.resources.fuel+'/15':null,
    game.resources.ammo<8?'ذخيرة '+game.resources.ammo+'/8':null,
  ].filter(Boolean);

  return <main className="app-shell" dir="rtl" lang="ar">
    <header className="topbar">
      <div className="brand"><div className="brand-mark">IF</div><div><strong>IRON FRONT</strong><span>القيادة العسكرية <i>•</i> عمليات القاعدة</span></div></div>
      <div className="resources">
        <div><small>الفولاذ</small><b>⬡ {game.resources.steel}/{game.resourceCapacity.steel}</b></div><div><small>الوقود</small><b>◈ {game.resources.fuel}/{game.resourceCapacity.fuel}</b></div><div><small>الطاقة</small><b>ϟ {game.resources.power}/{game.resourceCapacity.power}</b></div><div><small>الذخيرة</small><b>▰ {game.resources.ammo}/{game.resourceCapacity.ammo}</b></div>
      </div><button className="save-btn" onClick={save}>حفظ</button>
    </header>
    <section className="battle-area">
      <div className="map-label"><span className="live-dot"/> عملية الستار الحديدي <small>القطاع المحصّن 07 / الموجة {game.wave} / القيادة التكتيكية</small></div>
      <div className="map-stage"><FortressScene state={game} onSelect={(id,enemy,multi)=>selectUnit(id,enemy,multi||addMode)} onMoveOrder={moveUnits}/></div><div className="map-vignette"/>
      <div className="status-stack"><div><small>قاعدة قواتك</small><b>{game.baseHp}% <span className="health"><i style={{width:game.baseHp+'%'}}/></span></b></div><div className="enemy"><small>مقر العدو</small><b>{game.enemyHp}% <span className="health"><i style={{width:game.enemyHp+'%'}}/></span></b></div></div>
      <div className="map-coords">قواتك {playerUnits.length} <span>•</span> العدو {enemyUnits.length} <span>•</span> الموجة {game.wave} <span>•</span> شحنات المنجم {game.logistics.delivered}</div>
      <div className="unit-hint">{rallyMode?'تحديد نقطة التجمع نشط • اضغط على المكان المطلوب':moveMode?'أمر الحركة نشط • اضغط على وجهة التحرك':selectedCount?'الوحدات المحددة: '+selectedCount:'اضغط على جندي أو دبابة من قواتك لتحديدها • اضغط على العدو لمهاجمته'}</div>
      {game.outcome!=='playing'&&<div className="mission-overlay"><div className="mission-card"><small>عملية الستار الحديدي</small><h2>{game.outcome==='victory'?'انتصار':'هزيمة'}</h2><p>{game.outcome==='victory'?'تم تدمير مقر العدو وتأمين القطاع.':'تم تدمير مقر قيادتك وخسرت القطاع.'}</p><button onClick={restart}>إعادة المهمة</button></div></div>}
    </section>
    <section className="command-panel">
      <div className="panel-head"><div><small>مركز القيادة التكتيكية</small><h1>إدارة عمليات القاعدة</h1></div><div className="online"><span/> {running?'المحاكاة تعمل':'المحاكاة متوقفة مؤقتاً'}<small className="grid-status">طاقة التشغيل: {game.powerGrid.supplied}/{game.powerGrid.demand} · الإنتاج {game.powerGrid.generation}</small></div></div>
      <div className="tabs"><button className={tab==='command'?'active':''} onClick={()=>setTab('command')}>الأوامر</button><button className={tab==='build'?'active':''} onClick={()=>setTab('build')}>البناء</button><button className={tab==='army'?'active':''} onClick={()=>setTab('army')}>الجيش والتدريب</button></div>
      {tab==='command'&&<div className="command-content"><div className="briefing"><span className="brief-icon">⌖</span><div><b>التوجيهات العسكرية</b><p>{rallyMode?'اختر موقعاً على الخريطة لتحديد نقطة وصول التعزيزات الجديدة.':moveMode?'اختر نقطة على أرض المعركة لتحريك الوحدات المحددة إليها.':'حدد جنودك أو دباباتك، ثم حرّكهم أو هاجم قوات العدو. يمكنك إصدار أمر بمهاجمة مقر العدو.'}</p></div></div><div className="action-row"><button className={moveMode?'primary-action':''} disabled={!selectedCount||game.outcome!=='playing'} onClick={()=>{setMoveMode(v=>!v);setRallyMode(false);}}>{moveMode?'✕ إلغاء الحركة':'➤ تحريك'}</button><button className={rallyMode?'primary-action':''} disabled={game.outcome!=='playing'} onClick={()=>{setRallyMode(v=>!v);setMoveMode(false);}}>{rallyMode?'✕ إلغاء التجمع':'⚑ نقطة تجمّع'}</button>{game.rallyPoint&&<button onClick={()=>simulation.dispatch({type:'units/clear-rally-point'})}>إلغاء نقطة التجمع</button>}<button className="select-all-action" disabled={!playerUnits.length||game.outcome!=='playing'} onClick={()=>{simulation.dispatch({type:'units/select',unitIds:playerUnits.map(u=>u.id),additive:false});setAddMode(false);setRallyMode(false);setMoveMode(true);}}>▣ تحديد كل القوات ({playerUnits.length})</button><button disabled={!selectedCount} onClick={()=>simulation.dispatch({type:'units/hold',unitIds:game.units.filter(u=>u.faction==='player'&&u.selected&&u.hp>0).map(u=>u.id)})}>Ⅱ تثبيت</button><button className="assault-action" disabled={!selectedCount} onClick={()=>simulation.dispatch({type:'units/attack-base',unitIds:game.units.filter(u=>u.faction==='player'&&u.selected&&u.hp>0).map(u=>u.id)})}>⚑ هجوم على المقر</button><button onClick={()=>{setRunning(!running);simulation.restore({...simulation.getSnapshot(),message:running?'SIMULATION PAUSED':'SIMULATION RESUMED'});}}>{running?'Ⅱ إيقاف مؤقت':'▶ متابعة'}</button><button onClick={load}>↧ تحميل</button></div></div>}
      {tab==='build'&&<div className="construction-wrap"><div className="construction-grid">{BUILDINGS.map(spec=>{const isTower=spec.kind==='watchtower';const active=game.buildings.some(b=>b.kind===spec.kind&&b.status==='active');const powered=game.buildings.some(b=>b.kind===spec.kind&&b.status==='active'&&b.powered);const inProgress=game.buildings.find(b=>b.kind===spec.kind&&b.status==='constructing');const total=count(spec.kind);const limitReached=total>=(isTower?4:1);const canQueueAlongside=isTower;return <article className="construction-card" key={spec.kind}><div className="building-symbol">{spec.short}</div><div className="building-copy"><b>{buildingNames[spec.kind]}</b><small>{buildingDescriptions[spec.kind]}</small><em>{spec.cost.steel} فولاذ · {spec.cost.fuel} وقود · {spec.cost.power} طاقة · {spec.seconds} ثانية</em>{inProgress&&<div className="progress"><i style={{width:(100*(1-inProgress.remaining/inProgress.buildSeconds))+'%'}}/></div>}{active&&<span className={powered?'built-label':'building-offline'}>{powered?(isTower?'أبراج عاملة: '+game.buildings.filter(b=>b.kind===spec.kind&&b.powered).length:'مبني · المستوى 1'):'متوقف — لا توجد طاقة كافية'}</span>}</div><button disabled={(!isTower&&active)||(!canQueueAlongside&&!!inProgress)||limitReached||game.outcome!=='playing'} onClick={()=>build(spec.kind)}>{limitReached?'الحد الأقصى':inProgress?(isTower?'بناء برج إضافي':'قيد البناء'):active?(isTower?'بناء برج إضافي':'مبني'):'بناء'}</button></article>;})}</div></div>}
      {tab==='army'&&<div className="army-panel">
        <div className="recruit-card"><div className="recruit-symbol tank-symbol">د</div><div><b>دبابة قتال رئيسية</b><small>120 صحة · درع ثقيل · 27 ضرر</small><em>260 فولاذ · 90 وقود · 24 ذخيرة · 18 ثانية</em><small className={tankMissing.length?'resource-warning':'resource-ready'}>{tankMissing.length?'ينقصك: '+tankMissing.join('، '):'الموارد كافية للتدريب'}</small></div><button disabled={!game.buildings.some(b=>b.kind==='factory'&&b.status==='active')||game.trainingQueue.length>=4||game.outcome!=='playing'} onClick={()=>train('tank')}>تدريب</button></div>
        <div className="recruit-card"><div className="recruit-symbol infantry-symbol">م</div><div><b>جنود مشاة هجومية</b><small>80 صحة · انتشار سريع · 12 ضرر</small><em>90 فولاذ · 15 وقود · 8 ذخيرة · 8 ثوانٍ</em><small className={infantryMissing.length?'resource-warning':'resource-ready'}>{infantryMissing.length?'ينقصك: '+infantryMissing.join('، '):'الموارد كافية للتدريب'}</small></div><button disabled={!game.buildings.some(b=>b.kind==='barracks'&&b.status==='active')||game.trainingQueue.length>=4||game.outcome!=='playing'} onClick={()=>train('infantry')}>تدريب</button></div>
        <div className="queue-panel"><div className="queue-head"><b>قائمة التعزيزات</b><small>{game.trainingQueue.length}/4 خانات</small></div>{firstTraining?<><div className="queue-current"><span>{firstTraining.kind==='tank'?'دبابة':'مشاة'}</span><b>{firstTraining.remaining} ث</b></div><div className="progress"><i style={{width:(100*(1-firstTraining.remaining/firstTraining.seconds))+'%'}}/></div>{game.trainingQueue.slice(1).map(order=><small className="queue-next" key={order.id}>+ {order.kind==='tank'?'دبابة':'مشاة'} · {order.seconds} ثانية</small>)}</>:<p>لا توجد وحدات قيد التدريب حالياً.</p>}</div>
        <div className="garrison-stats"><div className="garrison-stat"><b>{playerUnits.length}</b><small>قواتك</small></div><div className="garrison-stat"><b>{playerUnits.filter(u=>u.kind==='tank').length}</b><small>دبابات</small></div><div className="garrison-stat"><b>{playerUnits.filter(u=>u.kind==='infantry').length}</b><small>مشاة</small></div><div className="garrison-stat hostile-stat"><b>{enemyUnits.length}</b><small>قوات العدو</small></div><div className="garrison-stat"><b>{game.wave}/5</b><small>الموجات</small></div></div>
      </div>}
      <div className="footer-line"><span className="log-dot"/> {arabicMessage(game.message)}<span className="tick">الوقت {String(Math.floor(game.tick/60)).padStart(2,'0')}:{String(game.tick%60).padStart(2,'0')}</span></div>
    </section>
  </main>;
}

import { useEffect, useRef, useState } from 'react';
import { FortressScene } from './game/FortressScene';
import { BUILDINGS } from './game/catalog';
import { initialGameState } from './game/initialState';
import type { BuildingKind, GameState, UnitKind } from './game/types';
import { createGameEngine } from './engine/createGameEngine';
import { GameLoop } from './engine/core/GameLoop';
import { SimulationRuntime } from './engine/simulation/SimulationRuntime';

export default function App() {
  const [game,setGame]=useState<GameState>(initialGameState);
  const simulationRef=useRef<SimulationRuntime | null>(null);
  const loopRef=useRef<GameLoop | null>(null);
  if(!simulationRef.current)simulationRef.current=new SimulationRuntime(createGameEngine(),initialGameState);
  const simulation=simulationRef.current;
  const [tab,setTab]=useState<'command'|'build'|'army'>('command');
  const [running,setRunning]=useState(true);
  const [moveMode,setMoveMode]=useState(false);
  const [addMode,setAddMode]=useState(false);

  useEffect(()=>simulation.subscribe(snapshot=>setGame(snapshot as GameState)),[simulation]);

  useEffect(()=>{
    if(!running)return;
    const loop=new GameLoop(deltaSeconds=>simulation.step(deltaSeconds));
    loopRef.current=loop;
    loop.start();
    return ()=>{
      loop.stop();
      if(loopRef.current===loop)loopRef.current=null;
    };
  },[running,simulation]);

  useEffect(()=>{if(game.outcome!=='playing')setRunning(false);},[game.outcome]);

  const build=(kind:BuildingKind)=>simulation.dispatch({type:'buildings/queue',buildingKind:kind});
  const train=(kind:UnitKind)=>simulation.dispatch({type:'units/train',unitKind:kind});
  const selectUnit=(id:number,isEnemy:boolean,multi:boolean)=>{
    if(game.outcome!=='playing')return;
    if(isEnemy){simulation.dispatch({type:'units/attack',unitIds:game.units.filter(u=>u.faction==='player'&&u.selected&&u.hp>0).map(u=>u.id),targetUnitId:id});setMoveMode(false);return;}
    simulation.dispatch({type:'units/select',unitIds:[id],additive:multi});
  };
  const moveUnits=(x:number,z:number)=>{
    if(!moveMode)return;
    simulation.dispatch({type:'units/move',unitIds:game.units.filter(u=>u.faction==='player'&&u.selected&&u.hp>0).map(u=>u.id),x,z});setMoveMode(false);
  };
  const save=()=>{try{localStorage.setItem('iron-front-save-v4',JSON.stringify(game));simulation.restore({...simulation.getSnapshot(),message:'FORTRESS, REINFORCEMENTS AND MISSION STATE SAVED'});}catch{simulation.restore({...simulation.getSnapshot(),message:'SAVE FAILED — STORAGE UNAVAILABLE'});}};
  const load=()=>{try{const raw=localStorage.getItem('iron-front-save-v4')||localStorage.getItem('iron-front-save-v3');if(raw){const saved=JSON.parse(raw) as Partial<GameState>;simulation.restore({...initialGameState,...saved,trainingQueue:saved.trainingQueue||[],wave:saved.wave||0,outcome:saved.outcome||'playing',nextTrainingId:saved.nextTrainingId||1});setMoveMode(false);setRunning(true);}else simulation.restore({...simulation.getSnapshot(),message:'NO SAVED MISSION FOUND'});}catch{simulation.restore({...simulation.getSnapshot(),message:'SAVE DATA COULD NOT BE LOADED'});}};
  const restart=()=>{simulation.restore(initialGameState);setRunning(true);setMoveMode(false);setAddMode(false);setTab('command');};
  const count=(kind:BuildingKind)=>game.buildings.filter(b=>b.kind===kind).length;
  const selectedCount=game.units.filter(u=>u.faction==='player'&&u.selected&&u.hp>0).length;
  const playerUnits=game.units.filter(u=>u.faction==='player'&&u.hp>0);
  const enemyUnits=game.units.filter(u=>u.faction==='enemy'&&u.hp>0);
  const firstTraining=game.trainingQueue[0];

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark">IF</div><div><strong>IRON FRONT</strong><span>TOTAL DOMINATION <i>•</i> FORTRESS COMMAND</span></div></div>
      <div className="resources">
        <div><small>STEEL</small><b>⬡ {game.resources.steel}</b></div><div><small>FUEL</small><b>◈ {game.resources.fuel}</b></div><div><small>POWER</small><b>ϟ {game.resources.power}</b></div><div><small>AMMO</small><b>▰ {game.resources.ammo}</b></div>
      </div><button className="save-btn" onClick={save}>SAVE</button>
    </header>
    <section className="battle-area">
      <div className="map-label"><span className="live-dot"/> OPERATION IRON VEIL <small>FORTIFIED SECTOR 07 / WAVE {game.wave} / TACTICAL COMMAND</small></div>
      <div className="map-stage"><FortressScene state={game} onSelect={(id,enemy,multi)=>selectUnit(id,enemy,multi||addMode)} onMoveOrder={moveUnits}/></div><div className="map-vignette"/>
      <div className="status-stack"><div><small>YOUR FORTRESS</small><b>{game.baseHp}% <span className="health"><i style={{width:game.baseHp+'%'}}/></span></b></div><div className="enemy"><small>HOSTILE HQ</small><b>{game.enemyHp}% <span className="health"><i style={{width:game.enemyHp+'%'}}/></span></b></div></div>
      <div className="map-coords">FRIENDLY {playerUnits.length} <span>•</span> HOSTILE {enemyUnits.length} <span>•</span> WAVE {game.wave}</div>
      <div className="unit-hint">{moveMode?'MOVE ORDER ACTIVE • TAP DESTINATION':selectedCount?selectedCount+' UNIT(S) SELECTED':'TAP FRIENDLY TO SELECT • TAP ENEMY TO ENGAGE'}</div>
      {game.outcome!=='playing'&&<div className="mission-overlay"><div className="mission-card"><small>OPERATION IRON VEIL</small><h2>{game.outcome==='victory'?'VICTORY':'DEFEAT'}</h2><p>{game.outcome==='victory'?'Hostile headquarters destroyed. Sector secured.':'Your headquarters has been destroyed. The sector is lost.'}</p><button onClick={restart}>RESTART MISSION</button></div></div>}
    </section>
    <section className="command-panel">
      <div className="panel-head"><div><small>TACTICAL COMMAND</small><h1>FORTRESS OPERATIONS</h1></div><div className="online"><span/> {running?'SIMULATION ACTIVE':'SIMULATION PAUSED'}</div></div>
      <div className="tabs"><button className={tab==='command'?'active':''} onClick={()=>setTab('command')}>COMMAND</button><button className={tab==='build'?'active':''} onClick={()=>setTab('build')}>CONSTRUCTION</button><button className={tab==='army'?'active':''} onClick={()=>setTab('army')}>GARRISON & TRAINING</button></div>
      {tab==='command'&&<div className="command-content"><div className="briefing"><span className="brief-icon">⌖</span><div><b>TACTICAL ORDERS</b><p>{moveMode?'Select a destination on the battlefield. Selected units will move there.':'Select friendly units, move them, engage enemy forces, then order an assault on the hostile HQ.'}</p></div></div><div className="action-row"><button className={moveMode?'primary-action':''} disabled={!selectedCount||game.outcome!=='playing'} onClick={()=>setMoveMode(v=>!v)}>{moveMode?'✕ CANCEL MOVE':'➤ MOVE'}</button><button className={addMode?'primary-action':''} onClick={()=>setAddMode(v=>!v)}>{addMode?'✓ ADD MODE':'＋ ADD UNITS'}</button><button disabled={!selectedCount} onClick={()=>simulation.dispatch({type:'units/hold',unitIds:game.units.filter(u=>u.faction==='player'&&u.selected&&u.hp>0).map(u=>u.id)})}>Ⅱ HOLD</button><button className="assault-action" disabled={!selectedCount} onClick={()=>simulation.dispatch({type:'units/attack-base',unitIds:game.units.filter(u=>u.faction==='player'&&u.selected&&u.hp>0).map(u=>u.id)})}>⚑ ATTACK HQ</button><button onClick={()=>{setRunning(!running);simulation.restore({...simulation.getSnapshot(),message:running?'SIMULATION PAUSED':'SIMULATION RESUMED'});}}>{running?'Ⅱ PAUSE':'▶ RESUME'}</button><button onClick={load}>↧ LOAD</button></div></div>}
      {tab==='build'&&<div className="construction-wrap"><div className="construction-grid">{BUILDINGS.map(spec=>{const active=game.buildings.some(b=>b.kind===spec.kind&&b.status==='active');const inProgress=game.buildings.find(b=>b.kind===spec.kind&&b.status==='constructing');const limitReached=count(spec.kind)>=(spec.kind==='watchtower'?4:1);return <article className="construction-card" key={spec.kind}><div className="building-symbol">{spec.short}</div><div className="building-copy"><b>{spec.name}</b><small>{spec.description}</small><em>{spec.cost.steel} STEEL · {spec.cost.fuel} FUEL · {spec.cost.power} POWER · {spec.seconds} SEC</em>{inProgress&&<div className="progress"><i style={{width:(100*(1-inProgress.remaining/inProgress.buildSeconds))+'%'}}/></div>}{active&&<span className="built-label">OPERATIONAL · LEVEL 1</span>}</div><button disabled={active||!!inProgress||limitReached||game.outcome!=='playing'} onClick={()=>build(spec.kind)}>{active?'BUILT':inProgress?'BUILDING':limitReached?'LIMIT':'BUILD'}</button></article>;})}</div></div>}
      {tab==='army'&&<div className="army-panel">
        <div className="recruit-card"><div className="recruit-symbol tank-symbol">T</div><div><b>MAIN BATTLE TANK</b><small>120 HP · HEAVY ARMOR · 27 DAMAGE</small><em>260 STEEL · 90 FUEL · 24 AMMO · 18 SEC</em></div><button disabled={!game.buildings.some(b=>b.kind==='factory'&&b.status==='active')||game.trainingQueue.length>=4||game.outcome!=='playing'} onClick={()=>train('tank')}>TRAIN</button></div>
        <div className="recruit-card"><div className="recruit-symbol infantry-symbol">I</div><div><b>ASSAULT INFANTRY</b><small>80 HP · FAST DEPLOYMENT · 12 DAMAGE</small><em>90 STEEL · 15 FUEL · 8 AMMO · 8 SEC</em></div><button disabled={!game.buildings.some(b=>b.kind==='barracks'&&b.status==='active')||game.trainingQueue.length>=4||game.outcome!=='playing'} onClick={()=>train('infantry')}>TRAIN</button></div>
        <div className="queue-panel"><div className="queue-head"><b>REINFORCEMENT QUEUE</b><small>{game.trainingQueue.length}/4 SLOTS</small></div>{firstTraining?<><div className="queue-current"><span>{firstTraining.kind==='tank'?'TANK':'INFANTRY'}</span><b>{firstTraining.remaining}s</b></div><div className="progress"><i style={{width:(100*(1-firstTraining.remaining/firstTraining.seconds))+'%'}}/></div>{game.trainingQueue.slice(1).map(order=><small className="queue-next" key={order.id}>+ {order.kind.toUpperCase()} · {order.seconds}s</small>)}</>:<p>NO REINFORCEMENTS IN PRODUCTION</p>}</div>
        <div className="garrison-stats"><div className="garrison-stat"><b>{playerUnits.length}</b><small>FRIENDLY UNITS</small></div><div className="garrison-stat"><b>{playerUnits.filter(u=>u.kind==='tank').length}</b><small>ARMORED</small></div><div className="garrison-stat"><b>{playerUnits.filter(u=>u.kind==='infantry').length}</b><small>INFANTRY</small></div><div className="garrison-stat hostile-stat"><b>{enemyUnits.length}</b><small>HOSTILE</small></div><div className="garrison-stat"><b>{game.wave}/5</b><small>WAVES</small></div></div>
      </div>}
      <div className="footer-line"><span className="log-dot"/> {game.message}<span className="tick">T+ {String(Math.floor(game.tick/60)).padStart(2,'0')}:{String(game.tick%60).padStart(2,'0')}</span></div>
    </section>
  </main>;
}
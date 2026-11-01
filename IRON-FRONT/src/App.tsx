import { useEffect, useState } from 'react';
import { FortressScene } from './game/FortressScene';
import { BUILDINGS } from './game/catalog';
import { advanceConstruction, queueBuilding } from './game/buildingSystem';
import { advanceCombat, holdSelected, issueAttack, issueMove } from './game/combatSystem';
import { initialGameState } from './game/initialState';
import type { BuildingKind, GameState } from './game/types';

export default function App() {
  const [game,setGame]=useState<GameState>(initialGameState);
  const [tab,setTab]=useState<'command'|'build'|'army'>('command');
  const [running,setRunning]=useState(true);
  const [moveMode,setMoveMode]=useState(false);

  useEffect(()=>{
    if(!running)return;
    const timer=window.setInterval(()=>setGame(g=>advanceCombat({...advanceConstruction(g),tick:g.tick+1})),1000);
    return ()=>window.clearInterval(timer);
  },[running]);

  const build=(kind:BuildingKind)=>setGame(g=>queueBuilding(g,kind));
  const selectUnit=(id:number,isEnemy:boolean,multi:boolean)=>{
    if(isEnemy){setGame(g=>issueAttack(g,id));setMoveMode(false);return;}
    setGame(g=>({...g,units:g.units.map(u=>u.id===id?{...u,selected:multi?!u.selected:true}:multi?u:{...u,selected:false})}));
  };
  const moveUnits=(x:number,z:number)=>{
    if(!moveMode)return;
    setGame(g=>issueMove(g,x,z));setMoveMode(false);
  };
  const save=()=>{try{localStorage.setItem('iron-front-save-v3',JSON.stringify(game));setGame(g=>({...g,message:'FORTRESS, UNITS AND ORDERS SAVED'}));}catch{setGame(g=>({...g,message:'SAVE FAILED — STORAGE UNAVAILABLE'}));}};
  const load=()=>{try{const raw=localStorage.getItem('iron-front-save-v3');if(raw){setGame(JSON.parse(raw) as GameState);setMoveMode(false);}else setGame(g=>({...g,message:'NO COMBAT SAVE FOUND'}));}catch{setGame(g=>({...g,message:'SAVE DATA COULD NOT BE LOADED'}));}};
  const constructionCount=game.buildings.filter(b=>b.status==='constructing').length;
  const count=(kind:BuildingKind)=>game.buildings.filter(b=>b.kind===kind).length;
  const selectedCount=game.units.filter(u=>u.faction==='player'&&u.selected&&u.hp>0).length;
  const playerUnits=game.units.filter(u=>u.faction==='player'&&u.hp>0);
  const enemyUnits=game.units.filter(u=>u.faction==='enemy'&&u.hp>0);

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark">IF</div><div><strong>IRON FRONT</strong><span>TOTAL DOMINATION <i>•</i> FORTRESS COMMAND</span></div></div>
      <div className="resources">
        <div><small>STEEL</small><b>⬡ {game.resources.steel}</b></div><div><small>FUEL</small><b>◈ {game.resources.fuel}</b></div><div><small>POWER</small><b>ϟ {game.resources.power}</b></div><div><small>AMMO</small><b>▰ {game.resources.ammo}</b></div>
      </div><button className="save-btn" onClick={save}>SAVE</button>
    </header>
    <section className="battle-area">
      <div className="map-label"><span className="live-dot"/> OPERATION IRON VEIL <small>FORTIFIED SECTOR 07 / ANGLED COMMAND VIEW</small></div>
      <div className="map-stage"><FortressScene state={game} onSelect={(id,enemy,multi)=>selectUnit(id,enemy,multi)} onMoveOrder={moveUnits}/></div><div className="map-vignette"/>
      <div className="status-stack"><div><small>YOUR FORTRESS</small><b>{game.baseHp}% <span className="health"><i style={{width:game.baseHp+'%'}}/></span></b></div><div className="enemy"><small>HOSTILE HQ</small><b>{game.enemyHp}% <span className="health"><i style={{width:game.enemyHp+'%'}}/></span></b></div></div>
      <div className="map-coords">FRIENDLY {playerUnits.length} <span>•</span> HOSTILE {enemyUnits.length} <span>•</span> {constructionCount} BUILDING{constructionCount===1?'':'S'} IN PROGRESS</div>
      <div className="unit-hint">{moveMode?'MOVE ORDER ACTIVE • TAP DESTINATION':selectedCount?selectedCount+' FRIENDLY UNIT(S) SELECTED':'TAP FRIENDLY UNITS • SHIFT-TAP TO ADD • TAP ENEMY TO ATTACK'}</div>
    </section>
    <section className="command-panel">
      <div className="panel-head"><div><small>TACTICAL COMMAND</small><h1>FORTRESS OPERATIONS</h1></div><div className="online"><span/> {running?'SIMULATION ACTIVE':'SIMULATION PAUSED'}</div></div>
      <div className="tabs"><button className={tab==='command'?'active':''} onClick={()=>setTab('command')}>COMMAND</button><button className={tab==='build'?'active':''} onClick={()=>setTab('build')}>CONSTRUCTION</button><button className={tab==='army'?'active':''} onClick={()=>setTab('army')}>GARRISON</button></div>
      {tab==='command'&&<div className="command-content"><div className="briefing"><span className="brief-icon">⌖</span><div><b>TACTICAL ORDERS</b><p>{moveMode?'Select a destination on the battlefield. Selected units will move there.':'Select one or more friendly units. Tap an enemy unit to engage, or issue a movement order.'}</p></div></div><div className="action-row"><button className={moveMode?'primary-action':''} disabled={!selectedCount} onClick={()=>setMoveMode(v=>!v)}>{moveMode?'✕ CANCEL MOVE':'➤ MOVE ORDER'}</button><button disabled={!selectedCount} onClick={()=>setGame(g=>holdSelected(g))}>Ⅱ HOLD</button><button onClick={()=>{setRunning(!running);setGame(g=>({...g,message:running?'SIMULATION PAUSED':'SIMULATION RESUMED'}));}}>{running?'Ⅱ PAUSE':'▶ RESUME'}</button><button onClick={load}>↧ LOAD</button></div></div>}
      {tab==='build'&&<div className="construction-wrap"><div className="construction-grid">{BUILDINGS.map(spec=>{const active=game.buildings.some(b=>b.kind===spec.kind&&b.status==='active');const inProgress=game.buildings.find(b=>b.kind===spec.kind&&b.status==='constructing');const limitReached=count(spec.kind)>=(spec.kind==='watchtower'?4:1);return <article className="construction-card" key={spec.kind}><div className="building-symbol">{spec.short}</div><div className="building-copy"><b>{spec.name}</b><small>{spec.description}</small><em>{spec.cost.steel} STEEL · {spec.cost.fuel} FUEL · {spec.cost.power} POWER · {spec.seconds} SEC</em>{inProgress&&<div className="progress"><i style={{width:(100*(1-inProgress.remaining/inProgress.buildSeconds))+'%'}}/></div>}{active&&<span className="built-label">OPERATIONAL · LEVEL 1</span>}</div><button disabled={active||!!inProgress||limitReached} onClick={()=>build(spec.kind)}>{active?'BUILT':inProgress?'BUILDING':limitReached?'LIMIT':'BUILD'}</button></article>;})}</div></div>}
      {tab==='army'&&<div className="garrison-row"><div className="garrison-stat"><b>{playerUnits.length}</b><small>FRIENDLY UNITS</small></div><div className="garrison-stat"><b>{playerUnits.filter(u=>u.kind==='tank').length}</b><small>ARMORED</small></div><div className="garrison-stat"><b>{playerUnits.filter(u=>u.kind==='infantry').length}</b><small>INFANTRY</small></div><div className="garrison-stat hostile-stat"><b>{enemyUnits.length}</b><small>HOSTILE UNITS</small></div><div className="garrison-note">Select units, move them across the field, and engage hostiles by tapping an enemy.</div></div>}
      <div className="footer-line"><span className="log-dot"/> {game.message}<span className="tick">T+ {String(Math.floor(game.tick/60)).padStart(2,'0')}:{String(game.tick%60).padStart(2,'0')}</span></div>
    </section>
  </main>;
}
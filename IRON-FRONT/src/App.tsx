import { useEffect, useState } from 'react';
import { FortressScene } from './game/FortressScene';
import { BUILDINGS } from './game/catalog';
import { advanceConstruction, queueBuilding } from './game/buildingSystem';
import { initialGameState } from './game/initialState';
import type { BuildingKind, GameState } from './game/types';

export default function App() {
  const [game,setGame]=useState<GameState>(initialGameState);
  const [tab,setTab]=useState<'command'|'build'|'army'>('command');
  const [selected,setSelected]=useState<number|null>(null);
  const [running,setRunning]=useState(true);

  useEffect(()=>{
    if(!running)return;
    const timer=window.setInterval(()=>setGame(g=>({...advanceConstruction(g),tick:g.tick+1})),1000);
    return ()=>window.clearInterval(timer);
  },[running]);

  const build=(kind:BuildingKind)=>setGame(g=>queueBuilding(g,kind));
  const selectUnit=(id:number)=>{setSelected(id);setGame(g=>({...g,units:g.units.map(u=>({...u,selected:u.id===id}))}));};
  const save=()=>{try{localStorage.setItem('iron-front-save-v2',JSON.stringify(game));setGame(g=>({...g,message:'FORTRESS AND ECONOMY SAVED LOCALLY'}));}catch{setGame(g=>({...g,message:'SAVE FAILED — STORAGE UNAVAILABLE'}));}};
  const load=()=>{try{const raw=localStorage.getItem('iron-front-save-v2');if(raw){setGame(JSON.parse(raw) as GameState);setSelected(null);}else setGame(g=>({...g,message:'NO FORTRESS SAVE FOUND'}));}catch{setGame(g=>({...g,message:'SAVE DATA COULD NOT BE LOADED'}));}};

  const constructionCount=game.buildings.filter(b=>b.status==='constructing').length;
  const count=(kind:BuildingKind)=>game.buildings.filter(b=>b.kind===kind).length;

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark">IF</div><div><strong>IRON FRONT</strong><span>TOTAL DOMINATION <i>•</i> FORTRESS COMMAND</span></div></div>
      <div className="resources">
        <div><small>STEEL</small><b>⬡ {game.resources.steel}</b></div><div><small>FUEL</small><b>◈ {game.resources.fuel}</b></div><div><small>POWER</small><b>ϟ {game.resources.power}</b></div><div><small>AMMO</small><b>▰ {game.resources.ammo}</b></div>
      </div><button className="save-btn" onClick={save}>SAVE</button>
    </header>
    <section className="battle-area">
      <div className="map-label"><span className="live-dot"/> OPERATION IRON VEIL <small>FORTIFIED SECTOR 07 / ANGLED COMMAND VIEW</small></div>
      <div className="map-stage"><FortressScene state={game} onSelect={selectUnit}/></div><div className="map-vignette"/>
      <div className="status-stack"><div><small>YOUR FORTRESS</small><b>{game.baseHp}% <span className="health"><i style={{width:game.baseHp+'%'}}/></span></b></div><div className="enemy"><small>HOSTILE HQ</small><b>{game.enemyHp}% <span className="health"><i style={{width:game.enemyHp+'%'}}/></span></b></div></div>
      <div className="map-coords">FORTRESS GRID 14-B <span>•</span> PERIMETER WALLS ACTIVE <span>•</span> {constructionCount} BUILDING{constructionCount===1?'':'S'} IN PROGRESS</div>
      <div className="unit-hint">{selected?'UNIT '+selected+' SELECTED':'TAP A UNIT TO SELECT • DRAG TO ROTATE • PINCH TO ZOOM'}</div>
    </section>
    <section className="command-panel">
      <div className="panel-head"><div><small>TACTICAL COMMAND</small><h1>FORTRESS OPERATIONS</h1></div><div className="online"><span/> {running?'SIMULATION ACTIVE':'SIMULATION PAUSED'}</div></div>
      <div className="tabs"><button className={tab==='command'?'active':''} onClick={()=>setTab('command')}>COMMAND</button><button className={tab==='build'?'active':''} onClick={()=>setTab('build')}>CONSTRUCTION</button><button className={tab==='army'?'active':''} onClick={()=>setTab('army')}>GARRISON</button></div>
      {tab==='command'&&<div className="command-content"><div className="briefing"><span className="brief-icon">⌖</span><div><b>FORTRESS STATUS</b><p>Perimeter walls and four watch positions secure the command compound. Expand production and energy infrastructure.</p></div></div><div className="action-row"><button className="primary-action" onClick={()=>{setRunning(!running);setGame(g=>({...g,message:running?'SIMULATION PAUSED':'SIMULATION RESUMED'}));}}>{running?'Ⅱ PAUSE SIMULATION':'▶ RESUME SIMULATION'}</button><button onClick={load}>↧ LOAD SAVE</button></div></div>}
      {tab==='build'&&<div className="construction-wrap"><div className="construction-grid">{BUILDINGS.map(spec=>{const active=game.buildings.some(b=>b.kind===spec.kind&&b.status==='active');const inProgress=game.buildings.find(b=>b.kind===spec.kind&&b.status==='constructing');const limitReached=count(spec.kind)>=(spec.kind==='watchtower'?4:1);return <article className="construction-card" key={spec.kind}><div className="building-symbol">{spec.short}</div><div className="building-copy"><b>{spec.name}</b><small>{spec.description}</small><em>{spec.cost.steel} STEEL · {spec.cost.fuel} FUEL · {spec.cost.power} POWER · {spec.seconds} SEC</em>{inProgress&&<div className="progress"><i style={{width:(100*(1-inProgress.remaining/inProgress.buildSeconds))+'%'}}/></div>}{active&&<span className="built-label">OPERATIONAL · LEVEL 1</span>}</div><button disabled={active||!!inProgress||limitReached} onClick={()=>build(spec.kind)}>{active?'BUILT':inProgress?'BUILDING':limitReached?'LIMIT':'BUILD'}</button></article>;})}</div></div>}
      {tab==='army'&&<div className="garrison-row"><div className="garrison-stat"><b>{game.units.length}</b><small>DEPLOYED UNITS</small></div><div className="garrison-stat"><b>{game.units.filter(u=>u.kind==='tank').length}</b><small>ARMORED</small></div><div className="garrison-stat"><b>{game.units.filter(u=>u.kind==='infantry').length}</b><small>INFANTRY</small></div><div className="garrison-note">Unit command and production controls will be expanded in the combat systems stage.</div></div>}
      <div className="footer-line"><span className="log-dot"/> {game.message}<span className="tick">T+ {String(Math.floor(game.tick/60)).padStart(2,'0')}:{String(game.tick%60).padStart(2,'0')}</span></div>
    </section>
  </main>;
}
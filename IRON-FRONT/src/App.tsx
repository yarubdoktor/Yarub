import { useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

type Unit = { id: number; x: number; z: number; hp: number; kind: 'tank' | 'infantry'; selected: boolean };
type State = { steel: number; fuel: number; power: number; ammo: number; baseHp: number; enemyHp: number; tick: number; units: Unit[]; barracks: number; factory: number; message: string };

const initial: State = {
  steel: 620, fuel: 420, power: 180, ammo: 300, baseHp: 100, enemyHp: 100, tick: 0,
  barracks: 1, factory: 0, message: 'SECTOR SECURE — AWAITING COMMAND',
  units: [
    { id: 1, x: -2.4, z: 2.8, hp: 100, kind: 'tank', selected: false },
    { id: 2, x: -1.2, z: 3.5, hp: 80, kind: 'infantry', selected: false },
    { id: 3, x: -3.4, z: 3.7, hp: 80, kind: 'infantry', selected: false },
  ],
};

function Terrain() {
  const trees = useMemo(() => Array.from({ length: 46 }, (_, i) => ({
    x: Math.sin(i * 17.31) * 15, z: Math.cos(i * 9.17) * 12,
    s: 0.65 + (i % 4) * 0.16,
  })).filter(p => Math.abs(p.x) > 5 || Math.abs(p.z) > 4), []);
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[70, 48]} /><meshStandardMaterial color="#29352f" roughness={1} /></mesh>
    <gridHelper args={[70, 70, '#566253', '#39463d']} position={[0, 0.015, 0]} />
    {trees.map((t, i) => <group key={i} position={[t.x, 0, t.z]} scale={t.s}>
      <mesh position={[0, .7, 0]} castShadow><cylinderGeometry args={[.13, .2, 1.4, 6]} /><meshStandardMaterial color="#514538" /></mesh>
      <mesh position={[0, 1.75, 0]} castShadow><coneGeometry args={[.85, 2.2, 7]} /><meshStandardMaterial color="#263d32" roughness={.9} /></mesh>
    </group>)}
    {Array.from({length:8},(_,i)=><mesh key={i} position={[-18+i*5.2,.06,-8+(i%2)*2]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.5+(i%3)*.15,8]}/><meshStandardMaterial color="#9b875d" /></mesh>)}
  </group>;
}

function Base({ enemy = false, level = 1 }: { enemy?: boolean; level?: number }) {
  const color = enemy ? '#8e3b32' : '#a9b8bd';
  return <group position={[enemy ? 13 : -12, 0, enemy ? -5 : 4]}>
    <mesh position={[0,.55,0]} castShadow><boxGeometry args={[4,1.1,3.6]} /><meshStandardMaterial color={color} metalness={.55} roughness={.5} /></mesh>
    <mesh position={[0,1.45,0]} castShadow><boxGeometry args={[2.1,.9,2.1]} /><meshStandardMaterial color={enemy ? '#542a27' : '#53636b'} metalness={.65} /></mesh>
    <mesh position={[0,2.15,0]}><cylinderGeometry args={[.22,.22,.65,8]} /><meshStandardMaterial color="#d7a74e" metalness={.7} /></mesh>
    <mesh position={[0,2.55,0]}><sphereGeometry args={[.13,8,8]} /><meshBasicMaterial color={enemy ? '#ff503d' : '#4ed8ff'} /></mesh>
    <mesh position={[0,.08,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[3.1,3.2,48]} /><meshBasicMaterial color={enemy ? '#e05b45' : '#4cb7d3'} /></mesh>
    {level > 1 && <mesh position={[2.3,.65,1.8]} castShadow><boxGeometry args={[1.2,1.3,1.2]} /><meshStandardMaterial color="#596b70" metalness={.5} /></mesh>}
  </group>;
}

function Vehicle({ unit, onSelect }: { unit: Unit; onSelect: (id: number) => void }) {
  const tank = unit.kind === 'tank';
  return <group position={[unit.x, .15, unit.z]} rotation={[0, Math.PI, 0]} onClick={(e) => { e.stopPropagation(); onSelect(unit.id); }}>
    <mesh position={[0,.32,0]} castShadow><boxGeometry args={tank ? [1.35,.48,1.9] : [.48,.8,.48]} /><meshStandardMaterial color={tank ? '#718174' : '#c2b68a'} metalness={tank ? .45 : .1} roughness={.72} emissive={unit.selected ? '#1c6c8b' : '#000000'} emissiveIntensity={unit.selected ? .8 : 0} /></mesh>
    {tank && <><mesh position={[0,.68,-.12]} castShadow><cylinderGeometry args={[.38,.42,.35,10]} /><meshStandardMaterial color="#58675d" metalness={.5} /></mesh><mesh position={[0,.72,-.75]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.09,.09,1.1,8]} /><meshStandardMaterial color="#303b38" metalness={.8} /></mesh></>}
    <mesh position={[0,1.02,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.5,.57,24]} /><meshBasicMaterial color={unit.selected ? '#52d9ff' : '#7ea18b'} /></mesh>
    <mesh position={[0,1.18,0]}><boxGeometry args={[.7,.06,.07]} /><meshBasicMaterial color="#53d8ff" /></mesh>
  </group>;
}

function BattleScene({ state, onSelect }: { state: State; onSelect: (id: number) => void }) {
  useFrame((_, delta) => { void delta; });
  return <Canvas shadows camera={{ position: [0, 23, 28], fov: 42 }} dpr={[1,1.5]}>
    <color attach="background" args={['#111a1c']} />
    <fog attach="fog" args={['#111a1c', 28, 68]} />
    <ambientLight intensity={.65} />
    <directionalLight position={[-12,22,8]} intensity={2.1} castShadow shadow-mapSize={[2048,2048]} />
    <Terrain />
    <Base level={state.barracks} />
    <Base enemy />
    {state.units.map(u => <Vehicle key={u.id} unit={u} onSelect={onSelect} />)}
    <ContactShadows position={[0,.025,0]} opacity={.38} scale={48} blur={2.5} far={15} />
    <Environment preset="sunset" />
    <OrbitControls makeDefault maxPolarAngle={Math.PI / 2.08} minDistance={12} maxDistance={48} enableDamping dampingFactor={.08} />
  </Canvas>;
}

export default function App() {
  const [game, setGame] = useState<State>(initial);
  const [tab, setTab] = useState<'command'|'build'|'army'>('command');
  const [selected, setSelected] = useState<number | null>(null);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setGame(g => {
      const tick = g.tick + 1;
      const advancing = g.units.map(u => ({ ...u, x: Math.min(8.5, u.x + (u.kind === 'tank' ? .22 : .28)) }));
      const atFront = advancing.some(u => u.x > 5);
      const enemyHp = atFront && tick % 3 === 0 ? Math.max(0, g.enemyHp - 2) : g.enemyHp;
      const enemyStrike = tick % 8 === 0 && g.units.length > 0;
      const units = enemyStrike ? advancing.map((u,i) => i === 0 ? {...u,hp:Math.max(0,u.hp-8)} : u).filter(u=>u.hp>0) : advancing;
      return { ...g, tick, steel: Math.min(9999,g.steel+3), fuel: Math.min(9999,g.fuel+2), power: Math.min(9999,g.power+1), ammo: Math.max(0,g.ammo-(atFront?1:0)), units, enemyHp,
        message: enemyHp===0 ? 'ENEMY COMMAND DESTROYED — SECTOR CAPTURED' : enemyStrike ? 'CONTACT! ENEMY FIRE DETECTED' : atFront ? 'FRONTLINE ENGAGED — UNITS ADVANCING' : g.message };
    }), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const recruit = (kind: 'tank'|'infantry') => setGame(g => {
    const cost = kind === 'tank' ? 150 : 55;
    if (g.steel < cost || (kind === 'tank' && g.fuel < 80)) return {...g,message:'INSUFFICIENT RESOURCES'};
    const id = Math.max(0,...g.units.map(u=>u.id))+1;
    return {...g,steel:g.steel-cost,fuel:g.fuel-(kind==='tank'?80:0),units:[...g.units,{id,x:-9+(id%3)*1.1,z:2+(id%4)*.7,hp:kind==='tank'?100:80,kind,selected:false}],message:kind==='tank'?'ARMORED UNIT DEPLOYED':'INFANTRY SQUAD DEPLOYED'};
  });
  const build = () => setGame(g => {
    if (g.steel < 260 || g.power < 30) return {...g,message:'NOT ENOUGH STEEL OR POWER'};
    return {...g,steel:g.steel-260,power:g.power-30,barracks:g.barracks+1,message:'BARRACKS UPGRADED — PRODUCTION CAPACITY INCREASED'};
  });
  const selectUnit = (id:number) => {
    setSelected(id);
    setGame(g=>({...g,units:g.units.map(u=>({...u,selected:u.id===id}))}));
  };
  const save = () => {
    try { localStorage.setItem('iron-front-save-v1',JSON.stringify(game)); setGame(g=>({...g,message:'CAMPAIGN STATE SAVED LOCALLY'})); }
    catch { setGame(g=>({...g,message:'SAVE FAILED — STORAGE UNAVAILABLE'})); }
  };
  const load = () => {
    try { const raw=localStorage.getItem('iron-front-save-v1'); if(raw){setGame(JSON.parse(raw) as State);setSelected(null);} else setGame(g=>({...g,message:'NO LOCAL SAVE FOUND'})); }
    catch { setGame(g=>({...g,message:'SAVE DATA COULD NOT BE LOADED'})); }
  };

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark">IF</div><div><strong>IRON FRONT</strong><span>TOTAL DOMINATION <i>•</i> COMMAND NETWORK</span></div></div>
      <div className="resources">
        <div><small>STEEL</small><b>⬡ {game.steel}</b></div><div><small>FUEL</small><b>◈ {game.fuel}</b></div><div><small>POWER</small><b>ϟ {game.power}</b></div><div><small>AMMO</small><b>▰ {game.ammo}</b></div>
      </div>
      <button className="save-btn" onClick={save}>SAVE</button>
    </header>
    <section className="battle-area">
      <div className="map-label"><span className="live-dot"/> OPERATION IRON VEIL <small>SECTOR 07 / CONTINENTAL FRONT</small></div>
      <div className="map-stage"><BattleScene state={game} onSelect={selectUnit}/></div>
      <div className="map-vignette"/>
      <div className="status-stack"><div><small>YOUR HQ</small><b>{game.baseHp}% <span className="health"><i style={{width:game.baseHp+'%'}}/></span></b></div><div className="enemy"><small>HOSTILE HQ</small><b>{game.enemyHp}% <span className="health"><i style={{width:game.enemyHp+'%'}}/></span></b></div></div>
      <div className="map-coords">GRID 14-B <span>•</span> WIND 12 KM/H <span>•</span> VISIBILITY CLEAR</div>
      <div className="unit-hint">{selected ? 'UNIT '+selected+' SELECTED — TAP ANOTHER UNIT TO CHANGE' : 'TAP A UNIT TO SELECT  •  DRAG TO ROTATE  •  PINCH TO ZOOM'}</div>
    </section>
    <section className="command-panel">
      <div className="panel-head"><div><small>TACTICAL COMMAND</small><h1>FIELD OPERATIONS</h1></div><div className="online"><span/> SIMULATION ACTIVE</div></div>
      <div className="tabs"><button className={tab==='command'?'active':''} onClick={()=>setTab('command')}>COMMAND</button><button className={tab==='build'?'active':''} onClick={()=>setTab('build')}>CONSTRUCTION</button><button className={tab==='army'?'active':''} onClick={()=>setTab('army')}>ARMY</button></div>
      {tab==='command' && <div className="command-content">
        <div className="briefing"><span className="brief-icon">⌖</span><div><b>MISSION BRIEFING</b><p>Advance armor toward the hostile command post. Secure the sector by destroying enemy HQ.</p></div></div>
        <div className="action-row"><button className="primary-action" onClick={()=>{setRunning(!running);setGame(g=>({...g,message:running?'SIMULATION PAUSED':'SIMULATION RESUMED'}));}}>{running?'Ⅱ PAUSE SIMULATION':'▶ RESUME SIMULATION'}</button><button onClick={load}>↧ LOAD SAVE</button></div>
      </div>}
      {tab==='build' && <div className="build-grid"><div className="build-card"><div className="building-icon">▦</div><div><b>FIELD BARRACKS</b><small>LEVEL {game.barracks} · UNIT PRODUCTION</small><em>260 STEEL · 30 POWER</em></div><button onClick={build}>UPGRADE</button></div></div>}
      {tab==='army' && <div className="army-grid"><div className="army-card"><div className="unit-icon tank-icon">▰</div><div><b>MAIN BATTLE TANK</b><small>HEAVY ARMOR · 100 HP</small><em>150 STEEL · 80 FUEL</em></div><button onClick={()=>recruit('tank')}>DEPLOY</button></div><div className="army-card"><div className="unit-icon">♟</div><div><b>RIFLE SQUAD</b><small>INFANTRY · 80 HP</small><em>55 STEEL</em></div><button onClick={()=>recruit('infantry')}>DEPLOY</button></div></div>}
      <div className="footer-line"><span className="log-dot"/> {game.message}<span className="tick">T+ {String(Math.floor(game.tick/60)).padStart(2,'0')}:{String(game.tick%60).padStart(2,'0')}</span></div>
    </section>
  </main>;
}
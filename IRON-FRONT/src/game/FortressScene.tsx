import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, OrbitControls } from '@react-three/drei';
import type { Building, BuildingKind, GameState, Unit } from './types';

function Terrain({onMoveOrder}:{onMoveOrder:(x:number,z:number)=>void}) {
  const trees=useMemo(()=>Array.from({length:54},(_,i)=>({x:Math.sin(i*17.31)*21,z:Math.cos(i*9.17)*15,s:.65+(i%4)*.16})).filter(p=>Math.abs(p.x)>5||Math.abs(p.z)>5),[]);
  return <group>
    <mesh rotation={[-Math.PI/2,0,0]} receiveShadow onClick={e=>{e.stopPropagation();onMoveOrder(e.point.x,e.point.z);}}><planeGeometry args={[78,58]}/><meshStandardMaterial color="#29352f" roughness={1}/></mesh>
    <gridHelper args={[78,78,'#566253','#39463d']} position={[0,.018,0]}/>
    {trees.map((t,i)=><group key={i} position={[t.x,0,t.z]} scale={t.s}>
      <mesh position={[0,.7,0]} castShadow><cylinderGeometry args={[.13,.2,1.4,6]}/><meshStandardMaterial color="#514538"/></mesh>
      <mesh position={[0,1.75,0]} castShadow><coneGeometry args={[.85,2.2,7]}/><meshStandardMaterial color="#263d32"/></mesh>
    </group>)}
  </group>;
}

function FortressWalls() {
  const sections=[{x:-12,z:-3.2,sx:19,sz:.7,axis:'x' as const},{x:-12,z:11.2,sx:19,sz:.7,axis:'x' as const},{x:-21.2,z:4,sx:.7,sz:14.8,axis:'z' as const},{x:-2.8,z:-1,sx:.7,sz:4.4,axis:'z' as const},{x:-2.8,z:9.1,sx:.7,sz:4.2,axis:'z' as const}];
  return <group>
    {sections.map((w,i)=>{const length=w.axis==='x'?w.sx:w.sz;const count=Math.max(2,Math.floor(length/2.1));return <group key={i} position={[w.x,0,w.z]}>
      <mesh position={[0,1.05,0]} castShadow receiveShadow><boxGeometry args={[w.sx,.95,w.sz]}/><meshStandardMaterial color="#777f7b" metalness={.35} roughness={.8}/></mesh>
      {Array.from({length:count},(_,j)=>{const along=-length/2+1+j*(length-2)/(count-1);return <mesh key={j} position={w.axis==='x'?[along,1.72,0]:[0,1.72,along]}><boxGeometry args={w.axis==='x'?[.58,.42,.82]:[.82,.42,.58]}/><meshStandardMaterial color="#9ba39d"/></mesh>;})}
    </group>;})}
    {[-20.8,-3.2].map((x,i)=>[-2.8,10.8].map((z,j)=><group key={i+'-'+j} position={[x,0,z]}>
      <mesh position={[0,.9,0]} castShadow><boxGeometry args={[1.7,1.8,1.7]}/><meshStandardMaterial color="#596663"/></mesh>
      <mesh position={[0,1.95,0]} castShadow><cylinderGeometry args={[.95,.95,.35,8]}/><meshStandardMaterial color="#9d895e" metalness={.5}/></mesh>
      <mesh position={[0,2.35,0]}><cylinderGeometry args={[.08,.08,.7,8]}/><meshStandardMaterial color="#343d3b"/></mesh>
      <mesh position={[0,2.75,0]}><sphereGeometry args={[.12,8,8]}/><meshBasicMaterial color="#e2b85d"/></mesh>
    </group>))}
    <group position={[-2.8,0,4.1]}><mesh position={[0,1,-.78]} castShadow><boxGeometry args={[.65,1.9,1.05]}/><meshStandardMaterial color="#8c744c" metalness={.45}/></mesh><mesh position={[0,1,.78]} castShadow><boxGeometry args={[.65,1.9,1.05]}/><meshStandardMaterial color="#8c744c" metalness={.45}/></mesh><mesh position={[0,2.08,0]}><boxGeometry args={[.8,.18,2.9]}/><meshStandardMaterial color="#a28a5c" metalness={.4}/></mesh><mesh position={[0,1.12,0]}><boxGeometry args={[.08,1.8,.08]}/><meshBasicMaterial color="#d9b56b"/></mesh></group>
  </group>;
}

function Structure({building}:{building:Building}) {
  const {kind,x,z,status,remaining,buildSeconds}=building;
  const colors:Record<BuildingKind,string>={hq:'#aab8bd',barracks:'#778b79',power:'#b79b5f',refinery:'#8d9b94',factory:'#778b91',research:'#718d9b',watchtower:'#8b8e82',hospital:'#b5b9aa',ammo:'#8e795f'};
  const dims:Record<BuildingKind,[number,number,number]>={hq:[4,1.5,3.6],barracks:[2.8,1.25,2.5],power:[2.7,1.45,2.5],refinery:[3.1,1.5,2.5],factory:[3.7,1.65,3],research:[2.8,1.8,2.6],watchtower:[1.35,2.8,1.35],hospital:[2.8,1.35,2.5],ammo:[2.6,1.35,2.4]};
  const d=dims[kind],progress=status==='active'?1:1-remaining/buildSeconds;
  return <group position={[x,0,z]}>
    <mesh position={[0,.12,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[Math.max(d[0],d[2])*.62,Math.max(d[0],d[2])*.68,32]}/><meshBasicMaterial color={status==='active'?'#7bbf91':'#d8ad58'}/></mesh>
    <group scale={[1,Math.max(.08,progress),1]}><mesh position={[0,d[1]/2,0]} castShadow receiveShadow><boxGeometry args={d}/><meshStandardMaterial color={colors[kind]} metalness={.45} roughness={.62}/></mesh><mesh position={[0,d[1]+.25,0]} castShadow><boxGeometry args={[d[0]*.52,.5,d[2]*.55]}/><meshStandardMaterial color="#465653" metalness={.55}/></mesh></group>
  </group>;
}

function UnitMesh({unit,onSelect}:{unit:Unit;onSelect:(id:number,enemy:boolean,multi:boolean)=>void}) {
  const tank=unit.kind==='tank',enemy=unit.faction==='enemy';
  return <group position={[unit.x,.15,unit.z]} onClick={e=>{e.stopPropagation();onSelect(unit.id,enemy,!!(e.nativeEvent as PointerEvent).shiftKey);}}>
    <mesh position={[0,.32,0]} castShadow><boxGeometry args={tank?[1.35,.48,1.9]:[.48,.8,.48]}/><meshStandardMaterial color={enemy?(tank?'#9b5148':'#d08067'):(tank?'#718174':'#c2b68a')} metalness={tank?.45:.1} emissive={unit.selected?'#1c8cbb':'#000000'} emissiveIntensity={unit.selected?.8:0}/></mesh>
    {tank&&<><mesh position={[0,.68,-.12]} castShadow><cylinderGeometry args={[.38,.42,.35,10]}/><meshStandardMaterial color={enemy?'#713d38':'#58675d'}/></mesh><mesh position={[0,.72,-.75]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.09,.09,1.1,8]}/><meshStandardMaterial color="#303b38"/></mesh></>}
    <mesh position={[0,1.02,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.5,.57,24]}/><meshBasicMaterial color={enemy?'#e46c5d':unit.selected?'#52d9ff':'#7ea18b'}/></mesh>
    <group position={[0,1.35,0]}><mesh><planeGeometry args={[.9,.09]}/><meshBasicMaterial color="#222a27"/></mesh><mesh position={[-.45*(1-unit.hp/unit.maxHp),0,.002]}><planeGeometry args={[.9*unit.hp/unit.maxHp,.055]}/><meshBasicMaterial color={enemy?'#e36a5d':'#77ca8b'}/></mesh></group>
  </group>;
}

export function FortressScene({state,onSelect,onMoveOrder}:{state:GameState;onSelect:(id:number,enemy:boolean,multi:boolean)=>void;onMoveOrder:(x:number,z:number)=>void}) {
  return <Canvas shadows camera={{position:[-1,25,31],fov:42}} dpr={[1,1.5]}>
    <color attach="background" args={['#111a1c']}/><fog attach="fog" args={['#111a1c',30,75]}/>
    <ambientLight intensity={.68}/><directionalLight position={[-12,24,8]} intensity={2.15} castShadow shadow-mapSize={[2048,2048]}/>
    <Terrain onMoveOrder={onMoveOrder}/><FortressWalls/>
    {state.buildings.map(b=><Structure key={b.id} building={b}/>)}
    <group position={[20,0,-4]}><mesh position={[0,.6,0]} castShadow><boxGeometry args={[4,1.2,3.6]}/><meshStandardMaterial color="#8e3b32" metalness={.5}/></mesh><mesh position={[0,1.55,0]}><boxGeometry args={[2,.8,2]}/><meshStandardMaterial color="#542a27"/></mesh><mesh position={[0,2.3,0]}><sphereGeometry args={[.13,8,8]}/><meshBasicMaterial color="#ff503d"/></mesh></group>
    {state.units.map(u=><UnitMesh key={u.id} unit={u} onSelect={onSelect}/>)}
    <ContactShadows position={[0,.02,0]} opacity={.4} scale={55} blur={2.5} far={18}/>
    <Environment preset="sunset"/><OrbitControls makeDefault target={[-1,0,3]} maxPolarAngle={Math.PI/2.08} minDistance={13} maxDistance={52} enableDamping dampingFactor={.08}/>
  </Canvas>;
}
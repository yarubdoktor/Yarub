import { useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { Vector3 } from 'three';
import { ContactShadows, Environment, OrbitControls } from '@react-three/drei';
import type { Building, BuildingKind, GameState, Unit } from './types';

function Terrain({onMoveOrder,target}:{onMoveOrder:(x:number,z:number)=>void;target:Vector3}) {
  const trees=useMemo(()=>Array.from({length:110},(_,i)=>({x:Math.sin(i*17.31)*66,z:Math.cos(i*9.17)*38,s:.65+(i%4)*.16})).filter(p=>Math.abs(p.x)>5||Math.abs(p.z)>5),[]);
  const {camera}=useThree();
  const drag=useRef<{pointerId:number;x:number;y:number}|null>(null);
  const dragged=useRef(false);
  const pan=(e:ThreeEvent<PointerEvent>)=>{
    if(!drag.current||drag.current.pointerId!==e.pointerId)return;
    const dx=e.nativeEvent.clientX-drag.current.x,dy=e.nativeEvent.clientY-drag.current.y;
    if(Math.abs(dx)+Math.abs(dy)>2)dragged.current=true;
        const scale=camera.position.distanceTo(target)*.00062;
    const right=new Vector3().setFromMatrixColumn(camera.matrixWorld,0);right.y=0;right.normalize();
    const forward=new Vector3();camera.getWorldDirection(forward);forward.y=0;forward.normalize();
    const shift=right.multiplyScalar(-dx*scale).add(forward.multiplyScalar(dy*scale));
    const nx=Math.max(-62,Math.min(62,target.x+shift.x));
    const nz=Math.max(-38,Math.min(38,target.z+shift.z));
    const applied=new Vector3(nx-target.x,0,nz-target.z);
    camera.position.add(applied);target.add(applied);drag.current={pointerId:e.pointerId,x:e.nativeEvent.clientX,y:e.nativeEvent.clientY};
  };
  return <group>
    <mesh rotation={[-Math.PI/2,0,0]} receiveShadow
      onPointerDown={e=>{if(e.button!==0)return;e.stopPropagation();drag.current={pointerId:e.pointerId,x:e.nativeEvent.clientX,y:e.nativeEvent.clientY};dragged.current=false;(e.nativeEvent.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);}}
      onPointerMove={pan}
      onPointerUp={e=>{if(drag.current?.pointerId===e.pointerId){drag.current=null;(e.nativeEvent.currentTarget as HTMLCanvasElement).releasePointerCapture(e.pointerId);}}}
      onPointerCancel={()=>{drag.current=null;}}
      onClick={e=>{e.stopPropagation();if(dragged.current){dragged.current=false;return;}onMoveOrder(e.point.x,e.point.z);}}>
      <planeGeometry args={[140,90]}/><meshStandardMaterial color="#29352f" roughness={1}/></mesh>
    <gridHelper args={[140,140,'#566253','#39463d']} position={[0,.018,0]}/>
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


function MineLogistics({state}:{state:GameState}) {
  const logistics=state.logistics;
  if(!logistics)return null;
  const mine=logistics.mine,truck=logistics.truck;
  return <group>
    <mesh position={[8,.025,8.5]} rotation={[0,-Math.atan2(mine.z-4,mine.x+12),0]} receiveShadow>
      <boxGeometry args={[43,.055,2.6]}/><meshStandardMaterial color="#625c4c" roughness={1}/>
    </mesh>
    <mesh position={[8,.06,8.5]} rotation={[0,-Math.atan2(mine.z-4,mine.x+12),0]}>
      <boxGeometry args={[43,.025,.16]}/><meshBasicMaterial color="#b7a27a" transparent opacity={.42}/>
    </mesh>
    <group position={[mine.x,0,mine.z]}>
      <mesh position={[0,.08,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[3.1,4.2,40]}/><meshStandardMaterial color="#88785c"/></mesh>
      <mesh position={[0,.12,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[2.9,40]}/><meshStandardMaterial color="#3c3830"/></mesh>
      {Array.from({length:5},(_,i)=><mesh key={i} position={[-2.5+i*1.2,.55+(i%2)*.22,-2.1+(i%3)*.65]} rotation={[.12,i*.6,.18]} castShadow><dodecahedronGeometry args={[.72+(i%2)*.16,0]}/><meshStandardMaterial color={i%2?"#9a8b70":"#706b5d"} roughness={1}/></mesh>)}
      <mesh position={[0,1.55,-2.4]} castShadow><boxGeometry args={[.18,3.1,.18]}/><meshStandardMaterial color="#74674e"/></mesh>
      <mesh position={[0,3.05,-2.4]}><boxGeometry args={[3.8,.16,.16]}/><meshStandardMaterial color="#9d865b" metalness={.45}/></mesh>
      <mesh position={[1.65,2.45,-2.4]}><cylinderGeometry args={[.42,.42,.18,12]}/><meshStandardMaterial color="#343a36" metalness={.65}/></mesh>
      <mesh position={[0,4.1,0]}><planeGeometry args={[5.8,1.1]}/><meshBasicMaterial color="#c6a66b" side={2}/></mesh>
    </group>
    {logistics.workers.map((w,i)=><group key={w.id} position={[w.x,.08,w.z]}>
      <mesh position={[0,.48,0]} castShadow><capsuleGeometry args={[.19,.48,4,7]}/><meshStandardMaterial color={i%2?"#c6a66b":"#a9b5a0"}/></mesh>
      <mesh position={[0,.88,0]} castShadow><sphereGeometry args={[.17,10,8]}/><meshStandardMaterial color="#c49a72"/></mesh>
      <mesh position={[.24,.44,.02]} rotation={[0,0,-.35]}><cylinderGeometry args={[.045,.055,.48,6]}/><meshStandardMaterial color="#6c5942"/></mesh>
    </group>)}
    <group position={[truck.x,.08,truck.z]}>
      <mesh position={[0,.55,0]} castShadow><boxGeometry args={[2.05,.82,1.25]}/><meshStandardMaterial color="#657b68" metalness={.35} roughness={.7}/></mesh>
      <mesh position={[-.62,1.02,0]} castShadow><boxGeometry args={[.72,.72,1.2]}/><meshStandardMaterial color="#82958a" metalness={.25}/></mesh>
      <mesh position={[-.62,1.06,.62]}><boxGeometry args={[.38,.3,.025]}/><meshBasicMaterial color="#263b40"/></mesh>
      {[[-.62,-.48],[-.62,.48],[.62,-.48],[.62,.48]].map(([x,z],i)=><mesh key={i} position={[x,.2,z]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.23,.23,.16,12]}/><meshStandardMaterial color="#202522"/></mesh>)}
      <mesh position={[.58,1.03,0]}><boxGeometry args={[.05,.1,1.25]}/><meshBasicMaterial color="#d4b46f"/></mesh>
    </group>
  </group>;
}

export function FortressScene({state,onSelect,onMoveOrder}:{state:GameState;onSelect:(id:number,enemy:boolean,multi:boolean)=>void;onMoveOrder:(x:number,z:number)=>void}) {
  const cameraTarget=useMemo(()=>new Vector3(-1,0,3),[]);
  return <Canvas shadows camera={{position:[-1,25,31],fov:42}} dpr={[1,1.5]}> 
    <color attach="background" args={['#111a1c']}/><fog attach="fog" args={['#111a1c',45,145]}/>
    <ambientLight intensity={.68}/><directionalLight position={[-12,24,8]} intensity={2.15} castShadow shadow-mapSize={[2048,2048]}/>
    <Terrain onMoveOrder={onMoveOrder} target={cameraTarget}/><FortressWalls/><MineLogistics state={state}/>
    {state.rallyPoint&&<group position={[state.rallyPoint.x,.035,state.rallyPoint.z]}>
      <mesh rotation={[-Math.PI/2,0,0]}><ringGeometry args={[1.15,1.42,48]}/><meshBasicMaterial color="#55d8ff" transparent opacity={.95}/></mesh>
      <mesh rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.18,.28,24]}/><meshBasicMaterial color="#d9f8ff"/></mesh>
      <mesh position={[0,1.15,0]}><cylinderGeometry args={[.035,.035,2.3,8]}/><meshBasicMaterial color="#55d8ff" transparent opacity={.55}/></mesh>
    </group>}
    {state.buildings.map(b=><Structure key={b.id} building={b}/>)}
    <group position={[54,0,-8]}><mesh position={[0,.6,0]} castShadow><boxGeometry args={[4,1.2,3.6]}/><meshStandardMaterial color="#8e3b32" metalness={.5}/></mesh><mesh position={[0,1.55,0]}><boxGeometry args={[2,.8,2]}/><meshStandardMaterial color="#542a27"/></mesh><mesh position={[0,2.3,0]}><sphereGeometry args={[.13,8,8]}/><meshBasicMaterial color="#ff503d"/></mesh></group>
    {state.units.map(u=><UnitMesh key={u.id} unit={u} onSelect={onSelect}/>)}
    <ContactShadows position={[0,.02,0]} opacity={.4} scale={55} blur={2.5} far={18}/>
    <Environment preset="sunset"/><OrbitControls makeDefault target={cameraTarget} maxPolarAngle={Math.PI/2.08} minDistance={13} maxDistance={88} enableRotate={false} enablePan={false} enableZoom enableDamping dampingFactor={.08}/>
  </Canvas>;
}
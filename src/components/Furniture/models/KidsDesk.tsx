import * as THREE from 'three'
import type { ReactElement } from 'react'

const top   = new THREE.MeshLambertMaterial({ color: 0xf4e4b0 })
const trim  = new THREE.MeshLambertMaterial({ color: 0xe07050 })
const leg   = new THREE.MeshLambertMaterial({ color: 0x4a90d0 })
const draw  = new THREE.MeshLambertMaterial({ color: 0x60b070 })
const knob  = new THREE.MeshLambertMaterial({ color: 0xffffff })
const paper = new THREE.MeshLambertMaterial({ color: 0xffffff })
const crayn = new THREE.MeshLambertMaterial({ color: 0xd04080 })

/** Çocuk masası — alçak, renkli, tek çekmeceli */
export default function KidsDesk({ dims }: { dims: Record<string, number> }) {
  const len = (dims.length ?? 80) / 100
  const dep = (dims.depth ?? 50) / 100

  const deskH = 0.55
  const topH = 0.035
  const legH = deskH - topH

  // Renkli kenar şeridi
  const tabletop = (
    <>
      <mesh position={[0, deskH - topH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[len, topH, dep]} />
        <primitive object={top} attach="material" />
      </mesh>
      {/* Ön kenar renk şeridi */}
      <mesh position={[0, deskH - topH - 0.01, dep / 2 - 0.006]}>
        <boxGeometry args={[len - 0.01, 0.02, 0.012]} />
        <primitive object={trim} attach="material" />
      </mesh>
    </>
  )

  // 4 ayak — mavi
  const legs: ReactElement[] = []
  const lx = len / 2 - 0.05
  const lz = dep / 2 - 0.05
  ;[[-lx,-lz],[lx,-lz],[-lx,lz],[lx,lz]].forEach(([px, pz], i) => {
    legs.push(
      <mesh key={`leg-${i}`} position={[px as number, legH / 2, pz as number]} castShadow>
        <boxGeometry args={[0.05, legH, 0.05]} />
        <primitive object={leg} attach="material" />
      </mesh>
    )
  })

  // Alt çekmece — yeşil
  const drawerW = len * 0.5
  const drawerH = 0.10
  const drawerY = legH - drawerH / 2 - 0.02
  const drawer = (
    <>
      <mesh position={[0, drawerY, 0]} castShadow>
        <boxGeometry args={[drawerW, drawerH, dep - 0.08]} />
        <primitive object={draw} attach="material" />
      </mesh>
      <mesh position={[0, drawerY, (dep - 0.08) / 2 + 0.018]} castShadow>
        <sphereGeometry args={[0.022, 10, 10]} />
        <primitive object={knob} attach="material" />
      </mesh>
    </>
  )

  // Üstte kağıt + boya kalemi
  const paperM = (
    <mesh position={[-len * 0.15, deskH + 0.002, 0]}>
      <boxGeometry args={[0.20, 0.002, 0.28]} />
      <primitive object={paper} attach="material" />
    </mesh>
  )
  const crayonM = (
    <mesh
      position={[len * 0.25, deskH + 0.01, 0]}
      rotation={[0, 0, Math.PI / 2]}
      castShadow
    >
      <cylinderGeometry args={[0.008, 0.008, 0.12, 8]} />
      <primitive object={crayn} attach="material" />
    </mesh>
  )

  return (
    <group>
      {legs}
      {drawer}
      {tabletop}
      {paperM}
      {crayonM}
    </group>
  )
}

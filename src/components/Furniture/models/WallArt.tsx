import * as THREE from 'three'

const frame   = new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
const mat     = new THREE.MeshLambertMaterial({ color: 0xf0ece0 })
const paintA  = new THREE.MeshLambertMaterial({ color: 0x5a7aa0 })
const paintB  = new THREE.MeshLambertMaterial({ color: 0xc08050 })
const paintC  = new THREE.MeshLambertMaterial({ color: 0xd0c080 })

/** Duvar tablosu — modern soyut çerçeveli resim */
export default function WallArt({ dims }: { dims: Record<string, number> }) {
  const w = (dims.width ?? 60) / 100
  const h = (dims.height ?? 80) / 100

  const frameTh = 0.03
  const depth = 0.04

  return (
    <group>
      {/* Çerçeve (siyah) */}
      <mesh position={[0, 0, -depth / 2]} castShadow>
        <boxGeometry args={[w, h, depth]} />
        <primitive object={frame} attach="material" />
      </mesh>
      {/* Mat paspartu */}
      <mesh position={[0, 0, 0.001]}>
        <boxGeometry args={[w - frameTh * 2, h - frameTh * 2, 0.006]} />
        <primitive object={mat} attach="material" />
      </mesh>
      {/* Soyut kompozisyon — 3 blok */}
      <mesh position={[-w * 0.18, h * 0.10, 0.005]}>
        <boxGeometry args={[w * 0.40, h * 0.45, 0.004]} />
        <primitive object={paintA} attach="material" />
      </mesh>
      <mesh position={[w * 0.15, -h * 0.12, 0.005]}>
        <boxGeometry args={[w * 0.45, h * 0.30, 0.004]} />
        <primitive object={paintB} attach="material" />
      </mesh>
      <mesh position={[w * 0.25, h * 0.22, 0.006]}>
        <boxGeometry args={[w * 0.20, h * 0.18, 0.004]} />
        <primitive object={paintC} attach="material" />
      </mesh>
    </group>
  )
}

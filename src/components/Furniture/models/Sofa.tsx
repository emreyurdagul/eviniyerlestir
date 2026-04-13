import * as THREE from 'three'

const cream = new THREE.MeshLambertMaterial({ color: 0xd8cebc })
const lCream = new THREE.MeshLambertMaterial({ color: 0xe6dcca })
const wood = new THREE.MeshLambertMaterial({ color: 0x1e1008 })

export default function Sofa({ dims }: { dims: Record<string, number> }) {
  const len = (dims.length ?? 240) / 100
  const SD = 1.02
  const bH = 0.086
  const rail = 0.026
  const platH = 0.058
  const stH = 0.215
  const bkH = 0.43
  const armR = 0.128
  const pt = bH + rail + platH

  return (
    <group>
      {/* Base */}
      <mesh position={[0, bH / 2, 0]} castShadow><boxGeometry args={[len - 0.04, bH, SD - 0.04]} /><primitive object={wood} attach="material" /></mesh>
      <mesh position={[0, bH + rail / 2, 0]} castShadow><boxGeometry args={[len + 0.01, rail, SD + 0.01]} /><primitive object={wood} attach="material" /></mesh>
      {/* Seat platform */}
      <mesh position={[0, pt - platH / 2, 0.02]} castShadow><boxGeometry args={[len - 0.14, platH, SD - 0.14]} /><primitive object={cream} attach="material" /></mesh>
      {/* Seat cushions */}
      {[0, 1, 2].map(i => {
        const cW = (len - 0.32) / 3
        const cx = -(len / 2 - 0.16) + cW * i + cW / 2
        const cbH = stH * 0.46
        return (
          <group key={i}>
            <mesh position={[cx, pt + cbH / 2, 0.02]} castShadow><boxGeometry args={[cW - 0.022, cbH, SD - 0.25]} /><primitive object={lCream} attach="material" /></mesh>
            <mesh position={[cx, pt + cbH + stH * 0.15, 0.02]} castShadow>
              <sphereGeometry args={[1, 16, 10]} />
              <primitive object={lCream} attach="material" />
              <group scale={[(cW - 0.06) / 2, stH * 0.63, (SD - 0.13) / 2]} />
            </mesh>
          </group>
        )
      })}
      {/* Backrest */}
      <mesh position={[0, pt + stH * 0.84 + bkH * 0.44, -(SD / 2 - 0.178)]} castShadow>
        <boxGeometry args={[len - 0.14, bkH * 0.88, 0.26]} /><primitive object={cream} attach="material" />
      </mesh>
      {/* Arms */}
      {[-1, 1].map(s => (
        <group key={s}>
          <mesh position={[s * (len / 2 - armR - 0.004), pt + armR - 0.012, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[armR, armR, SD - 0.22, 16]} /><primitive object={cream} attach="material" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

import * as THREE from 'three'

const wood     = new THREE.MeshLambertMaterial({ color: 0xaa8a60 })
const woodTop  = new THREE.MeshLambertMaterial({ color: 0xbf9a70 })
const woodDark = new THREE.MeshLambertMaterial({ color: 0x6a4a2a })

/** Yemek masası — kenar detaylı tabla, klasik 4 ayak + çapraz bağ */
export default function DiningTable({ dims }: { dims: Record<string, number> }) {
  const len = (dims.length ?? 180) / 100
  const wid = (dims.width ?? 90) / 100
  const tableH = 0.76
  const legT = 0.06
  const lx = len / 2 - 0.10
  const lz = wid / 2 - 0.09

  return (
    <group>
      {/* Tabla alt kenar şeridi */}
      <mesh position={[0, tableH - 0.05, 0]} castShadow>
        <boxGeometry args={[len - 0.04, 0.05, wid - 0.04]} />
        <primitive object={woodDark} attach="material" />
      </mesh>
      {/* Ana tabla */}
      <mesh position={[0, tableH, 0]} castShadow receiveShadow>
        <boxGeometry args={[len, 0.04, wid]} />
        <primitive object={woodTop} attach="material" />
      </mesh>
      {/* Tabla üst ince şerit */}
      <mesh position={[0, tableH + 0.022, 0]}>
        <boxGeometry args={[len - 0.02, 0.005, wid - 0.02]} />
        <primitive object={woodDark} attach="material" />
      </mesh>

      {/* 4 Ayak — kare kesit, biraz oyma */}
      {[[-lx, -lz], [-lx, lz], [lx, -lz], [lx, lz]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, tableH / 2 - 0.05, 0]} castShadow>
            <boxGeometry args={[legT, tableH - 0.1, legT]} />
            <primitive object={wood} attach="material" />
          </mesh>
          {/* Ayak tepesi dekoratif halka */}
          <mesh position={[0, tableH - 0.12, 0]}>
            <boxGeometry args={[legT + 0.012, 0.02, legT + 0.012]} />
            <primitive object={woodDark} attach="material" />
          </mesh>
          {/* Ayak alt topuk */}
          <mesh position={[0, 0.025, 0]} castShadow>
            <boxGeometry args={[legT + 0.01, 0.05, legT + 0.01]} />
            <primitive object={woodDark} attach="material" />
          </mesh>
        </group>
      ))}

      {/* Uzun bağ çubukları (sağa/sola) */}
      <mesh position={[0, tableH * 0.35, -lz]} castShadow>
        <boxGeometry args={[len - legT * 2.5, 0.03, 0.025]} />
        <primitive object={wood} attach="material" />
      </mesh>
      <mesh position={[0, tableH * 0.35, lz]} castShadow>
        <boxGeometry args={[len - legT * 2.5, 0.03, 0.025]} />
        <primitive object={wood} attach="material" />
      </mesh>
      {/* Kısa bağlar (ön-arka) */}
      {[-lx, lx].map((x, i) => (
        <mesh key={`cb-${i}`} position={[x, tableH * 0.35, 0]} castShadow>
          <boxGeometry args={[0.025, 0.03, wid - legT * 2.5]} />
          <primitive object={wood} attach="material" />
        </mesh>
      ))}
    </group>
  )
}

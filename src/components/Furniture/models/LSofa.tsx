import * as THREE from 'three'

const matCream = new THREE.MeshLambertMaterial({ color: 0xe6dcca })
const matBase  = new THREE.MeshLambertMaterial({ color: 0x2a1a08 })

export default function LSofa({ dims }: { dims: Record<string, number> }) {
  const len = (dims.length ?? 280) / 100   // uzun kenar (x ekseni)
  const sht = (dims.width  ?? 180) / 100   // kısa kenar (z ekseni)
  const armD = 1.0                          // kol derinliği (her iki kanat)

  // Uzun kanat body
  const longBodyW = len
  const longBodyD = armD
  // Kısa kenat body
  const shortBodyW = armD
  const shortBodyD = sht - armD            // köşe bloğu hariç

  return (
    <group>
      {/* Uzun kanat body */}
      <mesh position={[0, 0.44, -(sht - armD) / 2]} castShadow>
        <boxGeometry args={[longBodyW, 0.88, longBodyD]} />
        <primitive object={matCream} attach="material" />
      </mesh>
      {/* Uzun kanat sırtlık */}
      <mesh position={[0, 0.74, -(sht - armD) / 2 - armD / 2 + 0.11]} castShadow>
        <boxGeometry args={[longBodyW, 0.50, 0.22]} />
        <primitive object={matCream} attach="material" />
      </mesh>

      {/* Kısa kanat body */}
      <mesh position={[-(len / 2 - armD / 2), 0.44, (sht / 2 - (shortBodyD / 2 + armD))]} castShadow>
        <boxGeometry args={[shortBodyW, 0.88, shortBodyD]} />
        <primitive object={matCream} attach="material" />
      </mesh>
      {/* Kısa kanat sırtlık */}
      <mesh position={[-(len / 2 - armD) - 0.11, 0.74, (sht / 2 - (shortBodyD / 2 + armD))]} castShadow>
        <boxGeometry args={[0.22, 0.50, shortBodyD]} />
        <primitive object={matCream} attach="material" />
      </mesh>

      {/* Köşe bloğu */}
      <mesh position={[-(len / 2 - armD / 2), 0.44, -(sht - armD) / 2]} castShadow>
        <boxGeometry args={[armD, 0.88, armD]} />
        <primitive object={matCream} attach="material" />
      </mesh>

      {/* Taban */}
      <mesh position={[0, 0.04, -(sht - armD) / 2]} receiveShadow>
        <boxGeometry args={[longBodyW, 0.08, longBodyD]} />
        <primitive object={matBase} attach="material" />
      </mesh>
      <mesh position={[-(len / 2 - armD / 2), 0.04, (sht / 2 - (shortBodyD / 2 + armD))]} receiveShadow>
        <boxGeometry args={[shortBodyW, 0.08, shortBodyD + armD]} />
        <primitive object={matBase} attach="material" />
      </mesh>
    </group>
  )
}

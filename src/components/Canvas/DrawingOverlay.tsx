/**
 * DrawingOverlay — polygon çizim modunda zemin tıklamalarını yakalar ve
 * görsel geri bildirim sağlar (noktalar, kenar çizgileri, kapanma göstergesi).
 *
 * Teknik Borç Giderme:
 *   - Kapatma çizgisi geometrisi artık useMemo ile memoized (her render'da
 *     yeni BufferGeometry oluşturulmuyor — bellek sızıntısı önlendi).
 *   - drawPoints değişince geometriler yeniden hesaplanır, sabit kalınca değil.
 */

import { useMemo } from 'react'
import * as THREE from 'three'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import { useDesignStore } from '../../store/designStore'

const SNAP_DISTANCE = 0.3 // metre — ilk noktaya bu kadar yaklaşınca kapanır

export default function DrawingOverlay() {
  const isDrawing = useDesignStore(s => s.isDrawing)
  const drawPoints = useDesignStore(s => s.drawPoints)
  const addDrawPoint = useDesignStore(s => s.addDrawPoint)
  const finalizeDrawing = useDesignStore(s => s.finalizeDrawing)
  const { raycaster } = useThree()

  const groundPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), [])

  // Nokta-nokta çizgi geometrisi (memoized — drawPoints değişince yeniden hesaplanır)
  const linePoints = useMemo(() => {
    if (drawPoints.length < 2) return null
    const pts = drawPoints.map(([x, z]) => new THREE.Vector3(x, 0.02, z))
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [drawPoints])

  // Kapatma çizgisi (son nokta → ilk nokta) — daha önce render içinde yaratılıyordu
  // ve her render'da yeni BufferGeometry üretiliyordu (bellek sızıntısı).
  // Artık memoized: sadece drawPoints değişince yeniden oluşturulur.
  const closingLineGeo = useMemo(() => {
    if (drawPoints.length < 3) return null
    const last = drawPoints[drawPoints.length - 1]
    const first = drawPoints[0]
    return new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(last[0], 0.02, last[1]),
      new THREE.Vector3(first[0], 0.02, first[1]),
    ])
  }, [drawPoints])

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!isDrawing) return
    e.stopPropagation()

    const intersect = new THREE.Vector3()
    raycaster.ray.intersectPlane(groundPlane, intersect)
    if (!intersect) return

    const x = intersect.x
    const z = intersect.z

    // İlk noktaya yakınsa poligonu kapat
    if (drawPoints.length >= 3) {
      const [fx, fz] = drawPoints[0]
      const dist = Math.sqrt((x - fx) ** 2 + (z - fz) ** 2)
      if (dist < SNAP_DISTANCE) {
        finalizeDrawing()
        return
      }
    }

    addDrawPoint(x, z)
  }

  if (!isDrawing) return null

  return (
    <group>
      {/* Tıklanabilir zemin düzlemi (çizim için) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
        onPointerDown={handleClick}
      >
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial visible={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Çizim noktaları (ilk nokta yeşil ve büyük, diğerleri turuncu) */}
      {drawPoints.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.03, z]}>
          <sphereGeometry args={[i === 0 ? 0.12 : 0.08, 12, 8]} />
          <meshBasicMaterial color={i === 0 ? 0x44cc44 : 0xff8844} />
        </mesh>
      ))}

      {/* Noktalar arası çizgi */}
      {linePoints && (
        <line>
          <primitive object={linePoints} attach="geometry" />
          <lineBasicMaterial color={0xff6644} linewidth={2} />
        </line>
      )}

      {/* Kapatma çizgisi (son → ilk, kesik yeşil) */}
      {closingLineGeo && (
        <line>
          <primitive object={closingLineGeo} attach="geometry" />
          <lineDashedMaterial color={0x44cc44} dashSize={0.1} gapSize={0.05} />
        </line>
      )}

      {/* Kapanma snap göstergesi (ilk nokta etrafında çember) */}
      {drawPoints.length >= 3 && (
        <mesh position={[drawPoints[0][0], 0.03, drawPoints[0][1]]}>
          <ringGeometry args={[SNAP_DISTANCE - 0.02, SNAP_DISTANCE, 24]} />
          <meshBasicMaterial color={0x44cc44} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}

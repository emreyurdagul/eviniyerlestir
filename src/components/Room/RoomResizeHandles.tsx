import { useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import type { Room } from '../../types'
import { useDesignStore } from '../../store/designStore'
import { MIN_DIM_CM, MAX_DIM_CM } from '../../types'

interface RoomResizeHandlesProps {
  room: Room
}

const WALL_H = 2.65
const HANDLE_OFFSET = 0.14  // duvar yüzeyinden dışa taşma (m)
const HANDLE_SIZE = 0.11    // handle yarıçapı

// Hangi handle hangi ekseni etkiler ve pozisyon shifti nasıl hesaplanır
type HandleKey = 'right' | 'left' | 'front' | 'back'
  | 'corner-rf' | 'corner-rb' | 'corner-lf' | 'corner-lb'

interface HandleDef {
  key: HandleKey
  color: number
  // Pozisyon [x, y, z] — hw/hl ile runtime'da hesaplanır
  getPos: (hw: number, hl: number) => [number, number, number]
  isCorner: boolean
}

const HANDLE_DEFS: HandleDef[] = [
  // Duvar ortası handle'ları (turuncu)
  { key: 'right',  color: 0xff8844, isCorner: false, getPos: (hw, hl) => [ hw + HANDLE_OFFSET, WALL_H * 0.4,  0] },
  { key: 'left',   color: 0xff8844, isCorner: false, getPos: (hw, hl) => [-hw - HANDLE_OFFSET, WALL_H * 0.4,  0] },
  { key: 'front',  color: 0x44aaff, isCorner: false, getPos: (hw, hl) => [ 0, WALL_H * 0.4,  hl + HANDLE_OFFSET] },
  { key: 'back',   color: 0x44aaff, isCorner: false, getPos: (hw, hl) => [ 0, WALL_H * 0.4, -hl - HANDLE_OFFSET] },
  // Köşe handle'ları (yeşil kare)
  { key: 'corner-rf', color: 0x44dd88, isCorner: true, getPos: (hw, hl) => [ hw + HANDLE_OFFSET, WALL_H * 0.4,  hl + HANDLE_OFFSET] },
  { key: 'corner-rb', color: 0x44dd88, isCorner: true, getPos: (hw, hl) => [ hw + HANDLE_OFFSET, WALL_H * 0.4, -hl - HANDLE_OFFSET] },
  { key: 'corner-lf', color: 0x44dd88, isCorner: true, getPos: (hw, hl) => [-hw - HANDLE_OFFSET, WALL_H * 0.4,  hl + HANDLE_OFFSET] },
  { key: 'corner-lb', color: 0x44dd88, isCorner: true, getPos: (hw, hl) => [-hw - HANDLE_OFFSET, WALL_H * 0.4, -hl - HANDLE_OFFSET] },
]

export default function RoomResizeHandles({ room }: RoomResizeHandlesProps) {
  const updateRoom = useDesignStore(s => s.updateRoom)
  const setStoreDragging = useDesignStore(s => s.setDragging)
  const { raycaster } = useThree()

  const activeKey = useRef<HandleKey | null>(null)
  const startDims = useRef({ w: 0, l: 0 })
  const startPos  = useRef<[number, number]>([0, 0])
  const startPoint = useRef(new THREE.Vector3())
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

  const hw = room.widthCm / 200
  const hl = room.lengthCm / 200

  const handleDown = (key: HandleKey) => (e: any) => {
    e.stopPropagation()
    ;(window as any).__evPointerCaptured = true
    activeKey.current = key
    startDims.current = { w: room.widthCm, l: room.lengthCm }
    startPos.current  = [...room.position] as [number, number]
    setStoreDragging(true)
    const intersect = new THREE.Vector3()
    raycaster.ray.intersectPlane(groundPlane, intersect)
    if (intersect) startPoint.current.copy(intersect)
    ;(e.target as HTMLElement)?.setPointerCapture?.(e.pointerId)
  }

  const handleMove = (e: any) => {
    if (!activeKey.current) return
    e.stopPropagation()

    const intersect = new THREE.Vector3()
    raycaster.ray.intersectPlane(groundPlane, intersect)
    if (!intersect) return

    // Dünya uzayındaki hareketi oda yerel uzayına çevir
    const delta = intersect.clone().sub(startPoint.current)
    const cosR = Math.cos(room.rotation)
    const sinR = Math.sin(room.rotation)
    const localDx = delta.x * cosR + delta.z * sinR
    const localDz = -delta.x * sinR + delta.z * cosR

    const key = activeKey.current
    let newW  = startDims.current.w
    let newL  = startDims.current.l
    let newPx = startPos.current[0]
    let newPz = startPos.current[1]

    // ── Tek duvar (asimetrik) ──
    // Sağ duvar: sol duvar sabit, sağ taraf genişler
    if (key === 'right') {
      const dw = localDx * 100  // m → cm
      newW = clamp(startDims.current.w + dw)
      // Sağ duvar pozisyonu = startPos.x + startHw + dw*0.01
      // Sol duvar sabit = startPos.x - startHw
      // Yeni merkez = (sol + sağ) / 2
      newPx = startPos.current[0] + (dw / 200) * Math.cos(room.rotation)
      newPz = startPos.current[1] + (dw / 200) * Math.sin(room.rotation)
    }
    // Sol duvar: sağ duvar sabit
    else if (key === 'left') {
      const dw = -localDx * 100
      newW = clamp(startDims.current.w + dw)
      newPx = startPos.current[0] - (dw / 200) * Math.cos(room.rotation)
      newPz = startPos.current[1] - (dw / 200) * Math.sin(room.rotation)
    }
    // Ön duvar: arka duvar sabit
    else if (key === 'front') {
      const dl = localDz * 100
      newL = clamp(startDims.current.l + dl)
      newPx = startPos.current[0] - (dl / 200) * Math.sin(room.rotation)
      newPz = startPos.current[1] + (dl / 200) * Math.cos(room.rotation)
    }
    // Arka duvar: ön duvar sabit
    else if (key === 'back') {
      const dl = -localDz * 100
      newL = clamp(startDims.current.l + dl)
      newPx = startPos.current[0] + (dl / 200) * Math.sin(room.rotation)
      newPz = startPos.current[1] - (dl / 200) * Math.cos(room.rotation)
    }
    // ── Köşe (ikili eksen) ──
    else if (key === 'corner-rf') {
      const dw = localDx * 100; const dl = localDz * 100
      newW = clamp(startDims.current.w + dw)
      newL = clamp(startDims.current.l + dl)
      newPx = startPos.current[0]
        + (dw / 200) * Math.cos(room.rotation)
        - (dl / 200) * Math.sin(room.rotation)
      newPz = startPos.current[1]
        + (dw / 200) * Math.sin(room.rotation)
        + (dl / 200) * Math.cos(room.rotation)
    }
    else if (key === 'corner-rb') {
      const dw = localDx * 100; const dl = -localDz * 100
      newW = clamp(startDims.current.w + dw)
      newL = clamp(startDims.current.l + dl)
      newPx = startPos.current[0]
        + (dw / 200) * Math.cos(room.rotation)
        + (dl / 200) * Math.sin(room.rotation)
      newPz = startPos.current[1]
        + (dw / 200) * Math.sin(room.rotation)
        - (dl / 200) * Math.cos(room.rotation)
    }
    else if (key === 'corner-lf') {
      const dw = -localDx * 100; const dl = localDz * 100
      newW = clamp(startDims.current.w + dw)
      newL = clamp(startDims.current.l + dl)
      newPx = startPos.current[0]
        - (dw / 200) * Math.cos(room.rotation)
        - (dl / 200) * Math.sin(room.rotation)
      newPz = startPos.current[1]
        - (dw / 200) * Math.sin(room.rotation)
        + (dl / 200) * Math.cos(room.rotation)
    }
    else if (key === 'corner-lb') {
      const dw = -localDx * 100; const dl = -localDz * 100
      newW = clamp(startDims.current.w + dw)
      newL = clamp(startDims.current.l + dl)
      newPx = startPos.current[0]
        - (dw / 200) * Math.cos(room.rotation)
        + (dl / 200) * Math.sin(room.rotation)
      newPz = startPos.current[1]
        - (dw / 200) * Math.sin(room.rotation)
        - (dl / 200) * Math.cos(room.rotation)
    }

    updateRoom(room.id, {
      widthCm: newW,
      lengthCm: newL,
      position: [newPx, newPz],
    })
  }

  const handleUp = () => {
    activeKey.current = null
    setStoreDragging(false)
    ;(window as any).__evPointerCaptured = false
  }

  return (
    <group onPointerMove={handleMove} onPointerUp={handleUp}>
      {HANDLE_DEFS.map(h => {
        const pos = h.getPos(hw, hl)
        return (
          <mesh
            key={h.key}
            position={pos}
            onPointerDown={handleDown(h.key)}
          >
            {h.isCorner
              ? <boxGeometry args={[HANDLE_SIZE, HANDLE_SIZE, HANDLE_SIZE]} />
              : <sphereGeometry args={[HANDLE_SIZE, 10, 10]} />
            }
            <meshBasicMaterial color={h.color} />
          </mesh>
        )
      })}
    </group>
  )
}

function clamp(v: number): number {
  return Math.round(Math.max(MIN_DIM_CM, Math.min(MAX_DIM_CM, v)))
}

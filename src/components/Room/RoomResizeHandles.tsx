import { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import type { Room } from '../../types'
import { useDesignStore } from '../../store/designStore'
import { MIN_DIM_CM, MAX_DIM_CM } from '../../types'

interface RoomResizeHandlesProps {
  room: Room
}

const WALL_H = 2.65
const HANDLE_OFFSET = 0.14
const HANDLE_SIZE = 0.11
const HOVER_SCALE = 1.5     // hover sırasında büyüme oranı
const HOVER_COLOR = 0xfff4a0 // altın-sarı vurgulama tonu

type HandleKey = 'right' | 'left' | 'front' | 'back'
  | 'corner-rf' | 'corner-rb' | 'corner-lf' | 'corner-lb'

interface HandleDef {
  key: HandleKey
  color: number
  getPos: (hw: number, hl: number) => [number, number, number]
  isCorner: boolean
  cursor: string
  // Halka (guide ring) yönü — hover'da beliren boyutlandırma ekseni ipucu
  guide?: 'x' | 'z' | 'xz'
}

const HANDLE_DEFS: HandleDef[] = [
  { key: 'right',  color: 0xff8844, isCorner: false, cursor: 'ew-resize', guide: 'x', getPos: (hw, _hl) => [ hw + HANDLE_OFFSET, WALL_H * 0.4,  0] },
  { key: 'left',   color: 0xff8844, isCorner: false, cursor: 'ew-resize', guide: 'x', getPos: (hw, _hl) => [-hw - HANDLE_OFFSET, WALL_H * 0.4,  0] },
  { key: 'front',  color: 0x44aaff, isCorner: false, cursor: 'ns-resize', guide: 'z', getPos: (_hw, hl) => [ 0, WALL_H * 0.4,  hl + HANDLE_OFFSET] },
  { key: 'back',   color: 0x44aaff, isCorner: false, cursor: 'ns-resize', guide: 'z', getPos: (_hw, hl) => [ 0, WALL_H * 0.4, -hl - HANDLE_OFFSET] },
  { key: 'corner-rf', color: 0x44dd88, isCorner: true, cursor: 'nwse-resize', guide: 'xz', getPos: (hw, hl) => [ hw + HANDLE_OFFSET, WALL_H * 0.4,  hl + HANDLE_OFFSET] },
  { key: 'corner-rb', color: 0x44dd88, isCorner: true, cursor: 'nesw-resize', guide: 'xz', getPos: (hw, hl) => [ hw + HANDLE_OFFSET, WALL_H * 0.4, -hl - HANDLE_OFFSET] },
  { key: 'corner-lf', color: 0x44dd88, isCorner: true, cursor: 'nesw-resize', guide: 'xz', getPos: (hw, hl) => [-hw - HANDLE_OFFSET, WALL_H * 0.4,  hl + HANDLE_OFFSET] },
  { key: 'corner-lb', color: 0x44dd88, isCorner: true, cursor: 'nwse-resize', guide: 'xz', getPos: (hw, hl) => [-hw - HANDLE_OFFSET, WALL_H * 0.4, -hl - HANDLE_OFFSET] },
]

// Her handle için hangi duvar hareketli — clamp sonrası pozisyon senkronu için
const HANDLE_META: Record<HandleKey, { wSign: 0 | 1 | -1; lSign: 0 | 1 | -1 }> = {
  right:       { wSign:  1, lSign:  0 },
  left:        { wSign: -1, lSign:  0 },
  front:       { wSign:  0, lSign:  1 },
  back:        { wSign:  0, lSign: -1 },
  'corner-rf': { wSign:  1, lSign:  1 },
  'corner-rb': { wSign:  1, lSign: -1 },
  'corner-lf': { wSign: -1, lSign:  1 },
  'corner-lb': { wSign: -1, lSign: -1 },
}

export default function RoomResizeHandles({ room }: RoomResizeHandlesProps) {
  const updateRoom = useDesignStore(s => s.updateRoom)
  const setStoreDragging = useDesignStore(s => s.setDragging)
  const { raycaster, gl } = useThree()

  const activeKey = useRef<HandleKey | null>(null)
  const startDims = useRef({ w: 0, l: 0 })
  const startPos  = useRef<[number, number]>([0, 0])
  const startPoint = useRef(new THREE.Vector3())
  const groundPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))

  const [hoverKey, setHoverKey] = useState<HandleKey | null>(null)

  const hw = room.widthCm / 200
  const hl = room.lengthCm / 200

  const applyResize = (rawDw: number, rawDl: number) => {
    const key = activeKey.current
    if (!key) return
    const meta = HANDLE_META[key]

    const newW = clamp(startDims.current.w + rawDw * Math.abs(meta.wSign))
    const newL = clamp(startDims.current.l + rawDl * Math.abs(meta.lSign))

    // Clamp sonrası gerçek uygulanan delta
    const actualDw = newW - startDims.current.w
    const actualDl = newL - startDims.current.l

    // Yerel ofset (metre): sabit duvar yerinde kalsın diye merkez kayar
    const localOffX = (meta.wSign * actualDw) / 200
    const localOffZ = (meta.lSign * actualDl) / 200

    // Dünya uzayına çevir
    const cosR = Math.cos(room.rotation)
    const sinR = Math.sin(room.rotation)
    const worldOffX = localOffX * cosR - localOffZ * sinR
    const worldOffZ = localOffX * sinR + localOffZ * cosR

    const newPx = startPos.current[0] + worldOffX
    const newPz = startPos.current[1] + worldOffZ

    if (
      newW === room.widthCm &&
      newL === room.lengthCm &&
      Math.abs(newPx - room.position[0]) < 1e-6 &&
      Math.abs(newPz - room.position[1]) < 1e-6
    ) return

    updateRoom(room.id, {
      widthCm: newW,
      lengthCm: newL,
      position: [newPx, newPz],
    })
  }

  const handleDown = (key: HandleKey) => (e: any) => {
    e.stopPropagation()
    ;(window as any).__evPointerCaptured = true
    activeKey.current = key
    startDims.current = { w: room.widthCm, l: room.lengthCm }
    startPos.current  = [...room.position] as [number, number]
    setStoreDragging(true)
    const intersect = new THREE.Vector3()
    raycaster.ray.intersectPlane(groundPlane.current, intersect)
    if (intersect) startPoint.current.copy(intersect)
    ;(e.target as HTMLElement)?.setPointerCapture?.(e.pointerId)
  }

  const handleMove = (e: any) => {
    if (!activeKey.current) return
    e.stopPropagation()

    const intersect = new THREE.Vector3()
    raycaster.ray.intersectPlane(groundPlane.current, intersect)
    if (!intersect) return

    const delta = intersect.clone().sub(startPoint.current)
    const cosR = Math.cos(room.rotation)
    const sinR = Math.sin(room.rotation)
    const localDx = delta.x * cosR + delta.z * sinR
    const localDz = -delta.x * sinR + delta.z * cosR

    const meta = HANDLE_META[activeKey.current]
    const rawDw = meta.wSign * localDx * 100
    const rawDl = meta.lSign * localDz * 100
    applyResize(rawDw, rawDl)
  }

  const handleUp = () => {
    if (!activeKey.current) return
    activeKey.current = null
    setStoreDragging(false)
    ;(window as any).__evPointerCaptured = false
  }

  // Hover: cursor + state
  const handleOver = (key: HandleKey, cursor: string) => (e: any) => {
    e.stopPropagation()
    setHoverKey(key)
    gl.domElement.style.cursor = cursor
  }
  const handleOut = () => {
    setHoverKey(null)
    gl.domElement.style.cursor = ''
  }

  // Güvenlik ağı: fare dışarı çıkıp bırakılırsa drag temizle
  useEffect(() => {
    const canvas = gl.domElement
    const onWindowUp = () => {
      if (activeKey.current) {
        activeKey.current = null
        setStoreDragging(false)
        ;(window as any).__evPointerCaptured = false
      }
      // hover kalmış olabilir
      setHoverKey(null)
      gl.domElement.style.cursor = ''
    }
    window.addEventListener('pointerup', onWindowUp)
    window.addEventListener('pointercancel', onWindowUp)
    canvas.addEventListener('pointerleave', onWindowUp)
    return () => {
      window.removeEventListener('pointerup', onWindowUp)
      window.removeEventListener('pointercancel', onWindowUp)
      canvas.removeEventListener('pointerleave', onWindowUp)
      gl.domElement.style.cursor = ''
    }
  }, [gl, setStoreDragging])

  return (
    <group onPointerMove={handleMove} onPointerUp={handleUp}>
      {HANDLE_DEFS.map(h => {
        const pos = h.getPos(hw, hl)
        const isHover = hoverKey === h.key || activeKey.current === h.key
        const scale = isHover ? HOVER_SCALE : 1
        const displayColor = isHover ? HOVER_COLOR : h.color

        return (
          <group key={h.key} position={pos}>
            {/* Ana handle — hover'da büyür ve altın sarısına döner */}
            <mesh
              scale={scale}
              onPointerDown={handleDown(h.key)}
              onPointerOver={handleOver(h.key, h.cursor)}
              onPointerOut={handleOut}
            >
              {h.isCorner
                ? <boxGeometry args={[HANDLE_SIZE, HANDLE_SIZE, HANDLE_SIZE]} />
                : <sphereGeometry args={[HANDLE_SIZE, 12, 12]} />
              }
              <meshBasicMaterial color={displayColor} />
            </mesh>

            {/* Hover halo — handle'ın etrafında yarı-saydam parıltı */}
            {isHover && (
              <mesh scale={scale * 1.8}>
                <sphereGeometry args={[HANDLE_SIZE, 12, 12]} />
                <meshBasicMaterial color={HOVER_COLOR} transparent opacity={0.28} depthWrite={false} />
              </mesh>
            )}

            {/* Guide ring — hangi eksende boyutlandıracağını belirtir */}
            {isHover && h.guide === 'x' && (
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <torusGeometry args={[HANDLE_SIZE * 2.4, 0.012, 8, 24]} />
                <meshBasicMaterial color={0xff9944} transparent opacity={0.8} depthWrite={false} />
              </mesh>
            )}
            {isHover && h.guide === 'z' && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[HANDLE_SIZE * 2.4, 0.012, 8, 24]} />
                <meshBasicMaterial color={0x44aaff} transparent opacity={0.8} depthWrite={false} />
              </mesh>
            )}
            {isHover && h.guide === 'xz' && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[HANDLE_SIZE * 2.4, 0.012, 8, 24]} />
                <meshBasicMaterial color={0x44dd88} transparent opacity={0.85} depthWrite={false} />
              </mesh>
            )}
          </group>
        )
      })}
    </group>
  )
}

function clamp(v: number): number {
  return Math.round(Math.max(MIN_DIM_CM, Math.min(MAX_DIM_CM, v)))
}

import { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import type { Room } from '../../types'
import { useDesignStore } from '../../store/designStore'
import { MIN_DIM_CM, MAX_DIM_CM } from '../../types'

interface RoomResizeHandlesProps {
  room: Room
}

const HANDLE_OFFSET = 0.14
const HANDLE_SIZE = 0.11
const HOVER_SCALE = 1.5
const HOVER_COLOR = 0xfff4a0

type HandleKey = 'right' | 'left' | 'front' | 'back'
  | 'corner-rf' | 'corner-rb' | 'corner-lf' | 'corner-lb'

interface HandleDef {
  key: HandleKey
  color: number
  getPos: (hw: number, hl: number, hY: number) => [number, number, number]
  isCorner: boolean
  cursor: string
  guide?: 'x' | 'z' | 'xz'
}

const HANDLE_DEFS: HandleDef[] = [
  { key: 'right',  color: 0xff8844, isCorner: false, cursor: 'ew-resize', guide: 'x', getPos: (hw, _hl, hY) => [ hw + HANDLE_OFFSET, hY,  0] },
  { key: 'left',   color: 0xff8844, isCorner: false, cursor: 'ew-resize', guide: 'x', getPos: (hw, _hl, hY) => [-hw - HANDLE_OFFSET, hY,  0] },
  { key: 'front',  color: 0x44aaff, isCorner: false, cursor: 'ns-resize', guide: 'z', getPos: (_hw, hl, hY) => [ 0, hY,  hl + HANDLE_OFFSET] },
  { key: 'back',   color: 0x44aaff, isCorner: false, cursor: 'ns-resize', guide: 'z', getPos: (_hw, hl, hY) => [ 0, hY, -hl - HANDLE_OFFSET] },
  { key: 'corner-rf', color: 0x44dd88, isCorner: true, cursor: 'nwse-resize', guide: 'xz', getPos: (hw, hl, hY) => [ hw + HANDLE_OFFSET, hY,  hl + HANDLE_OFFSET] },
  { key: 'corner-rb', color: 0x44dd88, isCorner: true, cursor: 'nesw-resize', guide: 'xz', getPos: (hw, hl, hY) => [ hw + HANDLE_OFFSET, hY, -hl - HANDLE_OFFSET] },
  { key: 'corner-lf', color: 0x44dd88, isCorner: true, cursor: 'nesw-resize', guide: 'xz', getPos: (hw, hl, hY) => [-hw - HANDLE_OFFSET, hY,  hl + HANDLE_OFFSET] },
  { key: 'corner-lb', color: 0x44dd88, isCorner: true, cursor: 'nwse-resize', guide: 'xz', getPos: (hw, hl, hY) => [-hw - HANDLE_OFFSET, hY, -hl - HANDLE_OFFSET] },
]

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
  const { raycaster, gl, camera } = useThree()

  const activeKey = useRef<HandleKey | null>(null)
  const startDims = useRef({ w: 0, l: 0 })
  const startPos  = useRef<[number, number]>([0, 0])
  const startPoint = useRef(new THREE.Vector3())
  const groundPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))
  const roomRef = useRef(room)
  roomRef.current = room  // handler'lar her zaman güncel oda referansına erişsin

  const [hoverKey, setHoverKey] = useState<HandleKey | null>(null)
  const ceilingHeight = useDesignStore(s => s.ceilingHeight)
  const handleY = ceilingHeight * 0.4

  const hw = room.widthCm / 200
  const hl = room.lengthCm / 200

  // NDC koordinat + ray çöz → yer düzlemi kesişimi
  const rayFromClient = (clientX: number, clientY: number, out: THREE.Vector3): boolean => {
    const rect = gl.domElement.getBoundingClientRect()
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    )
    raycaster.setFromCamera(ndc, camera)
    const hit = raycaster.ray.intersectPlane(groundPlane.current, out)
    return !!hit
  }

  const applyResize = (rawDw: number, rawDl: number) => {
    const key = activeKey.current
    if (!key) return
    const meta = HANDLE_META[key]
    const r = roomRef.current

    const newW = clamp(startDims.current.w + rawDw * Math.abs(meta.wSign))
    const newL = clamp(startDims.current.l + rawDl * Math.abs(meta.lSign))

    const actualDw = newW - startDims.current.w
    const actualDl = newL - startDims.current.l

    const localOffX = (meta.wSign * actualDw) / 200
    const localOffZ = (meta.lSign * actualDl) / 200

    const cosR = Math.cos(r.rotation)
    const sinR = Math.sin(r.rotation)
    const worldOffX = localOffX * cosR - localOffZ * sinR
    const worldOffZ = localOffX * sinR + localOffZ * cosR

    const newPx = startPos.current[0] + worldOffX
    const newPz = startPos.current[1] + worldOffZ

    if (
      newW === r.widthCm &&
      newL === r.lengthCm &&
      Math.abs(newPx - r.position[0]) < 1e-6 &&
      Math.abs(newPz - r.position[1]) < 1e-6
    ) return

    updateRoom(r.id, {
      widthCm: newW,
      lengthCm: newL,
      position: [newPx, newPz],
    })
  }

  // Window-level pointermove: fare handle dışına çıksa bile çalışır
  const onWindowMove = (e: PointerEvent) => {
    if (!activeKey.current) return
    const intersect = new THREE.Vector3()
    if (!rayFromClient(e.clientX, e.clientY, intersect)) return

    const r = roomRef.current
    const delta = intersect.clone().sub(startPoint.current)
    const cosR = Math.cos(r.rotation)
    const sinR = Math.sin(r.rotation)
    const localDx = delta.x * cosR + delta.z * sinR
    const localDz = -delta.x * sinR + delta.z * cosR

    const meta = HANDLE_META[activeKey.current]
    const rawDw = meta.wSign * localDx * 100
    const rawDl = meta.lSign * localDz * 100
    applyResize(rawDw, rawDl)
  }

  const stopDrag = () => {
    if (!activeKey.current) return
    activeKey.current = null
    setStoreDragging(false)
    ;(window as any).__evPointerCaptured = false
    gl.domElement.style.cursor = ''
    window.removeEventListener('pointermove', onWindowMove)
    window.removeEventListener('pointerup', onWindowUp)
    window.removeEventListener('pointercancel', onWindowUp)
  }

  const onWindowUp = () => {
    stopDrag()
  }

  const handleDown = (key: HandleKey) => (e: any) => {
    // R3F bubbling'i durdur
    e.stopPropagation()
    // Native event'i de durdur → OrbitControls pointerdown handler'ı tetiklenmesin
    const native: PointerEvent | undefined = e.nativeEvent
    native?.stopPropagation?.()
    native?.stopImmediatePropagation?.()
    native?.preventDefault?.()

    ;(window as any).__evPointerCaptured = true
    activeKey.current = key
    startDims.current = { w: room.widthCm, l: room.lengthCm }
    startPos.current  = [...room.position] as [number, number]
    setStoreDragging(true)

    // Başlangıç noktası — native event'in konumunu kullan (R3F ray'i yerine)
    const intersect = new THREE.Vector3()
    if (native && rayFromClient(native.clientX, native.clientY, intersect)) {
      startPoint.current.copy(intersect)
    } else {
      const r2 = raycaster.ray.intersectPlane(groundPlane.current, intersect)
      if (r2) startPoint.current.copy(intersect)
    }

    // Drag süresince window-level listener'lar — handle'dan çıksak da çalışır
    window.addEventListener('pointermove', onWindowMove)
    window.addEventListener('pointerup', onWindowUp)
    window.addEventListener('pointercancel', onWindowUp)
  }

  // Hover: cursor + state
  const handleOver = (key: HandleKey, cursor: string) => (e: any) => {
    e.stopPropagation()
    setHoverKey(key)
    gl.domElement.style.cursor = cursor
  }
  const handleOut = () => {
    if (activeKey.current) return  // drag sırasında cursor'u değiştirme
    setHoverKey(null)
    gl.domElement.style.cursor = ''
  }

  // Unmount güvenlik ağı
  useEffect(() => {
    return () => {
      stopDrag()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <group>
      {HANDLE_DEFS.map(h => {
        const pos = h.getPos(hw, hl, handleY)
        const isHover = hoverKey === h.key || activeKey.current === h.key
        const scale = isHover ? HOVER_SCALE : 1
        const displayColor = isHover ? HOVER_COLOR : h.color

        return (
          <group key={h.key} position={pos}>
            {/* Ana handle */}
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

            {/* Hover halo */}
            {isHover && (
              <mesh scale={scale * 1.8}>
                <sphereGeometry args={[HANDLE_SIZE, 12, 12]} />
                <meshBasicMaterial color={HOVER_COLOR} transparent opacity={0.28} depthWrite={false} />
              </mesh>
            )}

            {/* Guide ring */}
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

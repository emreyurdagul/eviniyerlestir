import { useRef, useState, useMemo, useEffect, lazy, Suspense } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import type { FurnitureItem as FurnitureItemType } from '../../types'
import { useDesignStore } from '../../store/designStore'
import { getBoundingBox } from './registry'
import { snapFurniturePosition } from '../../utils/snap'
import { useAutoPin } from '../../hooks/useAutoPin'
import PinIndicator from './PinIndicator'

import CustomModel from './models/CustomModel'

/**
 * Model bileşeni prop arayüzü — lambalar lightIntensity + lightOn alırlar,
 * diğer tüm modeller bu props'ları görmezden gelir (destructuring opsiyonel).
 */
export interface ModelProps {
  dims: Record<string, number>
  lightIntensity?: number
  lightOn?: boolean
}

/**
 * Lazy-load mobilya modelleri.
 * Anahtar formatı:
 *   - 'type'           → varsayılan (varyant yok)
 *   - 'type:variantId' → varyant
 * Arama sırası: önce 'type:variant', bulunamazsa 'type:classic' / katalogdaki
 * ilk variant, sonra 'type' (geri uyum).
 */
const modelComponents: Record<string, React.LazyExoticComponent<React.ComponentType<ModelProps>>> = {
  // ── Koltuk varyantları ──
  'sofa':              lazy(() => import('./models/Sofa')),                // klasik (varsayılan)
  'sofa:classic':      lazy(() => import('./models/Sofa')),
  'sofa:modern':       lazy(() => import('./models/SofaModern')),
  'sofa:chesterfield': lazy(() => import('./models/SofaChesterfield')),
  'sofa:minimal':      lazy(() => import('./models/SofaMinimal')),

  // ── L koltuk varyantları ──
  'lsofa':          lazy(() => import('./models/LSofa')),
  'lsofa:classic':  lazy(() => import('./models/LSofa')),
  'lsofa:chaise':   lazy(() => import('./models/LSofaChaise')),
  'lsofa:modern':   lazy(() => import('./models/LSofaModern')),

  // ── Tekli koltuk varyantları ──
  'chair':          lazy(() => import('./models/Chair')),
  'chair:berjer':   lazy(() => import('./models/Chair')),
  'chair:accent':   lazy(() => import('./models/ChairAccent')),
  'chair:wingback': lazy(() => import('./models/ChairWingback')),

  // ── Yatak varyantları ──
  'bed':         lazy(() => import('./models/Bed')),
  'bed:classic': lazy(() => import('./models/Bed')),
  'bed:modern':  lazy(() => import('./models/BedModern')),
  'bed:tufted':  lazy(() => import('./models/BedTufted')),

  // ── Orta sehpa varyantları ──
  'ctable':        lazy(() => import('./models/CoffeeTable')),
  'ctable:round':  lazy(() => import('./models/CoffeeTable')),
  'ctable:square': lazy(() => import('./models/CoffeeTableSquare')),
  'ctable:marble': lazy(() => import('./models/CoffeeTableMarble')),

  // ── Dolap varyantları ──
  'wardrobe':         lazy(() => import('./models/Wardrobe')),
  'wardrobe:classic': lazy(() => import('./models/Wardrobe')),
  'wardrobe:sliding': lazy(() => import('./models/WardrobeSliding')),

  // ── Lambader varyantları ──
  'floorlamp':         lazy(() => import('./models/FloorLamp')),
  'floorlamp:classic': lazy(() => import('./models/FloorLamp')),
  'floorlamp:arc':     lazy(() => import('./models/FloorLampArc')),
  'floorlamp:tripod':  lazy(() => import('./models/FloorLampTripod')),

  // ── Tavan lambası ──
  'ceilinglamp':            lazy(() => import('./models/CeilingLampPendant')),
  'ceilinglamp:pendant':    lazy(() => import('./models/CeilingLampPendant')),
  'ceilinglamp:chandelier': lazy(() => import('./models/CeilingLampChandelier')),
  'ceilinglamp:panel':      lazy(() => import('./models/CeilingLampPanel')),

  // ── Duvar lambası ──
  'wallsconce':         lazy(() => import('./models/WallSconceModern')),
  'wallsconce:modern':  lazy(() => import('./models/WallSconceModern')),
  'wallsconce:classic': lazy(() => import('./models/WallSconceClassic')),

  // ── Diğer tipler (varyantsız) ──
  'dchair':     lazy(() => import('./models/DiningChair')),
  'tvunit':     lazy(() => import('./models/TVUnit')),
  'dtable':     lazy(() => import('./models/DiningTable')),
  'shelf':      lazy(() => import('./models/Shelf')),
  'rug':        lazy(() => import('./models/Rug')),
  'plant':      lazy(() => import('./models/Plant')),
  'counter':    lazy(() => import('./models/Counter')),
  'ankastre':   lazy(() => import('./models/Ankastre')),
  'kitchencab': lazy(() => import('./models/KitchenCab')),
  'fridge':     lazy(() => import('./models/Fridge')),
  'washer':     lazy(() => import('./models/Washer')),
  'dishwasher': lazy(() => import('./models/Dishwasher')),
  'dryer':      lazy(() => import('./models/Dryer')),
}

function pickModelKey(type: string, variant?: string): string {
  if (variant) {
    const key = `${type}:${variant}`
    if (modelComponents[key]) return key
  }
  return type  // default fallback
}

interface FurnitureItemProps {
  item: FurnitureItemType
}

export default function FurnitureItem({ item }: FurnitureItemProps) {
  const groupRef = useRef<THREE.Group>(null)
  const selection = useDesignStore(s => s.selection)
  const select = useDesignStore(s => s.select)
  const updateFurniture = useDesignStore(s => s.updateFurniture)
  const setStoreDragging = useDesignStore(s => s.setDragging)
  const { raycaster, gl, camera } = useThree()
  const { checkAndSuggestPin } = useAutoPin(item.id)
  const editMode = useDesignStore(s => s.editMode)

  const isSelected = selection.kind === 'furniture' && selection.id === item.id
  const [, forceRender] = useState(0)
  // Ref-based drag state — React state'i olay sırasında güncellemeye gerek yok
  const dragMode = useRef<'none' | 'move' | 'resize'>('none')
  const resizeKeyRef = useRef<string | null>(null)
  const dragOffset = useRef(new THREE.Vector3())
  const startDims = useRef<Record<string, number>>({})
  const startPoint = useRef(new THREE.Vector3())
  const itemRef = useRef(item)
  itemRef.current = item

  const bb = useMemo(() => getBoundingBox(item.type, item.dims), [item.type, item.dims])
  const groundPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))

  const ModelComponent = modelComponents[pickModelKey(item.type, item.variant)]

  // NDC → yer düzlemi kesişim
  const rayFromClient = (clientX: number, clientY: number, out: THREE.Vector3): boolean => {
    const rect = gl.domElement.getBoundingClientRect()
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    )
    raycaster.setFromCamera(ndc, camera)
    return !!raycaster.ray.intersectPlane(groundPlane.current, out)
  }

  const handleContextMenu = (e: any) => {
    e.stopPropagation()
    select('furniture', item.id)
    useDesignStore.getState().setContextMenuPos({
      x: (window as any).__lastPointerX ?? e.clientX ?? 0,
      y: (window as any).__lastPointerY ?? e.clientY ?? 0,
    })
  }

  // ── Window-level pointer handlers (drag boyunca aktif) ──
  const onWindowMove = (ev: PointerEvent) => {
    const mode = dragMode.current
    if (mode === 'none') return
    const it = itemRef.current
    const intersect = new THREE.Vector3()
    if (!rayFromClient(ev.clientX, ev.clientY, intersect)) return

    if (mode === 'resize') {
      const rKey = resizeKeyRef.current
      if (!rKey) return
      const delta = intersect.clone().sub(startPoint.current)
      const cosR = Math.cos(it.rotation)
      const sinR = Math.sin(it.rotation)
      const localDx = delta.x * cosR + delta.z * sinR
      const localDz = -delta.x * sinR + delta.z * cosR

      const newDims = { ...startDims.current }
      if (rKey.startsWith('corner-')) {
        const corners = rKey.slice(7)
        const xSign = corners[0] === 'p' ? 1 : -1
        const zSign = corners[1] === 'p' ? 1 : -1
        const xDimKey = getDimKeyForAxis(it.type, 'x')
        const zDimKey = getDimKeyForAxis(it.type, 'z')
        if (xDimKey && zDimKey && xDimKey === zDimKey) {
          const change = (localDx * xSign + localDz * zSign) / 2
          newDims[xDimKey] = Math.round(Math.max(20, startDims.current[xDimKey] + change * 200))
        } else {
          if (xDimKey) newDims[xDimKey] = Math.round(Math.max(20, startDims.current[xDimKey] + localDx * xSign * 200))
          if (zDimKey) newDims[zDimKey] = Math.round(Math.max(20, startDims.current[zDimKey] + localDz * zSign * 200))
        }
      } else if (rKey === 'x') {
        const dimKey = getDimKeyForAxis(it.type, 'x')
        if (dimKey) newDims[dimKey] = Math.round(Math.max(10, startDims.current[dimKey] + localDx * 200))
      } else if (rKey === 'z') {
        const dimKey = getDimKeyForAxis(it.type, 'z')
        if (dimKey) newDims[dimKey] = Math.round(Math.max(10, startDims.current[dimKey] + localDz * 200))
      }
      updateFurniture(it.id, { dims: newDims })
    } else if (mode === 'move') {
      const rawX = intersect.x + dragOffset.current.x
      const rawZ = intersect.z + dragOffset.current.z
      const state = useDesignStore.getState()
      const cosR = Math.abs(Math.cos(it.rotation))
      const sinR = Math.abs(Math.sin(it.rotation))
      const curBb = getBoundingBox(it.type, it.dims)
      const halfW = (curBb.w * cosR + curBb.d * sinR) / 2
      const halfD = (curBb.w * sinR + curBb.d * cosR) / 2
      const snapped = snapFurniturePosition(rawX, rawZ, state.rooms, state.furniture, it.id, halfW, halfD)
      updateFurniture(it.id, { position: [snapped.x, snapped.z] })
    }
  }

  const stopDrag = () => {
    const wasMove = dragMode.current === 'move'
    dragMode.current = 'none'
    resizeKeyRef.current = null
    setStoreDragging(false)
    ;(window as any).__evPointerCaptured = false
    window.removeEventListener('pointermove', onWindowMove)
    window.removeEventListener('pointerup', onWindowUp)
    window.removeEventListener('pointercancel', onWindowUp)
    if (wasMove) checkAndSuggestPin()
    forceRender(n => n + 1)  // selection overlay'i güncelle
  }

  const onWindowUp = () => { stopDrag() }

  // Ana gövde — Taşıma modunda sürükleme
  const handlePointerDown = (e: any) => {
    e.stopPropagation()
    const native: PointerEvent | undefined = e.nativeEvent
    native?.stopPropagation?.()
    native?.stopImmediatePropagation?.()

    ;(window as any).__evPointerCaptured = true
    select('furniture', item.id)

    // Boyutlandır modunda gövde sürükleme devre dışı
    if (editMode === 'resize') return

    native?.preventDefault?.()

    const intersect = new THREE.Vector3()
    const nOK = native && rayFromClient(native.clientX, native.clientY, intersect)
    if (nOK) {
      dragOffset.current.set(item.position[0] - intersect.x, 0, item.position[1] - intersect.z)
    } else if (raycaster.ray.intersectPlane(groundPlane.current, intersect)) {
      dragOffset.current.set(item.position[0] - intersect.x, 0, item.position[1] - intersect.z)
    }
    dragMode.current = 'move'
    setStoreDragging(true)
    window.addEventListener('pointermove', onWindowMove)
    window.addEventListener('pointerup', onWindowUp)
    window.addEventListener('pointercancel', onWindowUp)
  }

  // Resize handle tıklaması
  const handleHandleDown = (key: string) => (e: any) => {
    e.stopPropagation()
    const native: PointerEvent | undefined = e.nativeEvent
    native?.stopPropagation?.()
    native?.stopImmediatePropagation?.()
    native?.preventDefault?.()

    ;(window as any).__evPointerCaptured = true
    select('furniture', item.id)
    dragMode.current = 'resize'
    resizeKeyRef.current = key
    setStoreDragging(true)
    startDims.current = { ...item.dims }

    const intersect = new THREE.Vector3()
    if (native && rayFromClient(native.clientX, native.clientY, intersect)) {
      startPoint.current.copy(intersect)
    } else if (raycaster.ray.intersectPlane(groundPlane.current, intersect)) {
      startPoint.current.copy(intersect)
    }
    window.addEventListener('pointermove', onWindowMove)
    window.addEventListener('pointerup', onWindowUp)
    window.addEventListener('pointercancel', onWindowUp)
  }

  // Unmount güvenliği
  useEffect(() => {
    return () => {
      if (dragMode.current !== 'none') stopDrag()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <group
      ref={groupRef}
      position={[item.position[0], 0, item.position[1]]}
      rotation={[0, item.rotation, 0]}
      onPointerDown={handlePointerDown}
      onContextMenu={handleContextMenu}
    >
      <Suspense fallback={
        <mesh position={[0, (bb.yOffset ?? 0) + bb.h / 2, 0]}>
          <boxGeometry args={[bb.w * 0.8, bb.h * 0.8, bb.d * 0.8]} />
          <meshLambertMaterial color={0xcccccc} transparent opacity={0.5} />
        </mesh>
      }>
        {item.type === 'custom' && item.customModelUrl
          ? <CustomModel dims={item.dims} modelUrl={item.customModelUrl} />
          : ModelComponent && (
              <ModelComponent
                dims={item.dims}
                lightIntensity={item.lightIntensity ?? 0.6}
                lightOn={item.lightOn ?? true}
              />
            )
        }
      </Suspense>

      {/* Sabitlenmiş mobilya pin göstergesi */}
      {item.parentRoomId && <PinIndicator height={(bb.yOffset ?? 0) + bb.h} />}

      {/* Seçim vurgusu */}
      {isSelected && (
        <lineSegments position={[0, (bb.yOffset ?? 0) + bb.h / 2, 0]}>
          <edgesGeometry args={[new THREE.BoxGeometry(bb.w, bb.h, bb.d)]} />
          <lineBasicMaterial color={item.color} transparent opacity={0.7} />
        </lineSegments>
      )}

      {/* Resize handle'ları — yalnızca Boyutlandır modunda görünür */}
      {isSelected && editMode === 'resize' && (
        <>
          <mesh position={[bb.w / 2 + 0.08, bb.h * 0.3, 0]} onPointerDown={handleHandleDown('x')} data-testid={`furn-handle-x-${item.id}`}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshBasicMaterial color={0xff8844} />
          </mesh>
          <mesh position={[-bb.w / 2 - 0.08, bb.h * 0.3, 0]} onPointerDown={handleHandleDown('x')}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshBasicMaterial color={0xff8844} />
          </mesh>
          <mesh position={[0, bb.h * 0.3, bb.d / 2 + 0.08]} onPointerDown={handleHandleDown('z')} data-testid={`furn-handle-z-${item.id}`}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshBasicMaterial color={0x44aaff} />
          </mesh>
          <mesh position={[0, bb.h * 0.3, -bb.d / 2 - 0.08]} onPointerDown={handleHandleDown('z')}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshBasicMaterial color={0x44aaff} />
          </mesh>

          {/* Köşe resize handle'ları (yeşil küp) - her iki boyutu aynı anda değiştirir */}
          <mesh position={[ bb.w / 2 + 0.08, bb.h * 0.3,  bb.d / 2 + 0.08]} onPointerDown={handleHandleDown('corner-pp')}>
            <boxGeometry args={[0.09, 0.09, 0.09]} />
            <meshBasicMaterial color={0x44dd88} />
          </mesh>
          <mesh position={[ bb.w / 2 + 0.08, bb.h * 0.3, -bb.d / 2 - 0.08]} onPointerDown={handleHandleDown('corner-pn')}>
            <boxGeometry args={[0.09, 0.09, 0.09]} />
            <meshBasicMaterial color={0x44dd88} />
          </mesh>
          <mesh position={[-bb.w / 2 - 0.08, bb.h * 0.3,  bb.d / 2 + 0.08]} onPointerDown={handleHandleDown('corner-np')}>
            <boxGeometry args={[0.09, 0.09, 0.09]} />
            <meshBasicMaterial color={0x44dd88} />
          </mesh>
          <mesh position={[-bb.w / 2 - 0.08, bb.h * 0.3, -bb.d / 2 - 0.08]} onPointerDown={handleHandleDown('corner-nn')}>
            <boxGeometry args={[0.09, 0.09, 0.09]} />
            <meshBasicMaterial color={0x44dd88} />
          </mesh>
        </>
      )}
    </group>
  )
}

function getDimKeyForAxis(type: string, axis: 'x' | 'z'): string | null {
  const xMap: Record<string, string> = {
    sofa: 'length', dtable: 'length', bed: 'width', wardrobe: 'width',
    shelf: 'width', rug: 'length',
    lsofa: 'length', counter: 'length', kitchencab: 'width', fridge: 'width', ankastre: 'width',
  }
  const zMap: Record<string, string> = {
    dtable: 'width', bed: 'length', wardrobe: 'depth', rug: 'width',
    lsofa: 'width', counter: 'depth', kitchencab: 'depth', fridge: 'depth',
  }
  const diamTypes = ['chair', 'ctable', 'plant']
  if (diamTypes.includes(type)) return 'diameter'
  if (type === 'tvunit' && axis === 'z') return 'length'
  return axis === 'x' ? (xMap[type] ?? null) : (zMap[type] ?? null)
}

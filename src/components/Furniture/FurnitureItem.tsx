import { useRef, useState, useMemo, useEffect, memo, lazy, Suspense } from 'react'
import * as THREE from 'three'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import type { FurnitureItem as FurnitureItemType } from '../../types'
import { useDesignStore } from '../../store/designStore'
import { getBoundingBox } from './registry'
import { snapFurniturePosition } from '../../utils/snap'
import { useAutoPin } from '../../hooks/useAutoPin'
import PinIndicator from './PinIndicator'

import CustomModel from './models/CustomModel'

/**
 * Model bileşeni prop arayüzü — lambalar lumens + colorTempK + lightOn alırlar,
 * diğer tüm modeller bu props'ları görmezden gelir (destructuring opsiyonel).
 *
 * lightIntensity: DEPRECATED legacy 0-1 (geri uyum için korunuyor).
 * lumens:         modern lümen değeri (detaylı aydınlatma analizi için).
 * colorTempK:     renk sıcaklığı (Kelvin); kelvinToHex() ile hex renge çevrilir.
 */
interface ModelProps {
  dims: Record<string, number>
  lightIntensity?: number    // DEPRECATED
  lumens?: number
  colorTempK?: number
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

  // ── Yemek sandalyesi varyantları ──
  'dchair':              lazy(() => import('./models/DiningChair')),
  'dchair:classic':      lazy(() => import('./models/DiningChair')),
  'dchair:upholstered':  lazy(() => import('./models/DiningChairUpholstered')),
  'dchair:scandi':       lazy(() => import('./models/DiningChairScandi')),

  // ── Yemek masası varyantları ──
  'dtable':          lazy(() => import('./models/DiningTable')),
  'dtable:classic':  lazy(() => import('./models/DiningTable')),
  'dtable:modern':   lazy(() => import('./models/DiningTableGlass')),
  'dtable:pedestal': lazy(() => import('./models/DiningTablePedestal')),

  // ── TV ünitesi varyantları ──
  'tvunit':          lazy(() => import('./models/TVUnit')),
  'tvunit:classic':  lazy(() => import('./models/TVUnit')),
  'tvunit:floating': lazy(() => import('./models/TVUnitFloating')),

  // ── Raf/Kitaplık varyantları ──
  'shelf':         lazy(() => import('./models/Shelf')),
  'shelf:classic': lazy(() => import('./models/Shelf')),
  'shelf:ladder':  lazy(() => import('./models/ShelfLadder')),
  'shelf:cube':    lazy(() => import('./models/ShelfCube')),

  // ── Bitki varyantları ──
  'plant':         lazy(() => import('./models/Plant')),
  'plant:classic': lazy(() => import('./models/Plant')),
  'plant:tall':    lazy(() => import('./models/PlantTall')),
  'plant:cactus':  lazy(() => import('./models/PlantCactus')),

  // ── Buzdolabı varyantları ──
  'fridge':            lazy(() => import('./models/Fridge')),
  'fridge:classic':    lazy(() => import('./models/Fridge')),
  'fridge:sidebyside': lazy(() => import('./models/FridgeSideBySide')),
  'fridge:french':     lazy(() => import('./models/FridgeFrench')),

  // ── Diğer tipler (varyantsız) ──
  'rug':        lazy(() => import('./models/Rug')),
  'counter':    lazy(() => import('./models/Counter')),
  'ankastre':   lazy(() => import('./models/Ankastre')),
  'kitchencab': lazy(() => import('./models/KitchenCab')),
  'washer':     lazy(() => import('./models/Washer')),
  'dishwasher': lazy(() => import('./models/Dishwasher')),
  'dryer':      lazy(() => import('./models/Dryer')),

  // ── Banyo (Agent A) ──
  'toilet':                  lazy(() => import('./models/Toilet')),
  'toilet:classic':          lazy(() => import('./models/Toilet')),
  'toilet:wall':             lazy(() => import('./models/ToiletWall')),
  'sink':                    lazy(() => import('./models/Sink')),
  'sink:round':              lazy(() => import('./models/Sink')),
  'sink:square':             lazy(() => import('./models/SinkSquare')),
  'sink:double':             lazy(() => import('./models/SinkDouble')),
  'shower':                  lazy(() => import('./models/Shower')),
  'shower:straight':         lazy(() => import('./models/Shower')),
  'shower:corner':           lazy(() => import('./models/ShowerCorner')),
  'bathtub':                 lazy(() => import('./models/Bathtub')),
  'bathtub:classic':         lazy(() => import('./models/Bathtub')),
  'bathtub:freestanding':    lazy(() => import('./models/BathtubFreestanding')),
  'bathroom-cabinet':        lazy(() => import('./models/BathroomCabinet')),
  'bathroom-cabinet:single': lazy(() => import('./models/BathroomCabinet')),
  'bathroom-cabinet:double': lazy(() => import('./models/BathroomCabinetDouble')),

  // ── Oturma aksesuar (Agent A) ──
  'barstool':              lazy(() => import('./models/Barstool')),
  'barstool:modern':       lazy(() => import('./models/Barstool')),
  'barstool:classic':      lazy(() => import('./models/BarstoolClassic')),
  'ottoman':               lazy(() => import('./models/Ottoman')),
  'recliner':              lazy(() => import('./models/Recliner')),
  'recliner:fabric':       lazy(() => import('./models/Recliner')),
  'recliner:leather':      lazy(() => import('./models/ReclinerLeather')),
  'beanbag':               lazy(() => import('./models/Beanbag')),
  'bench':                 lazy(() => import('./models/Bench')),
  'bench:wood':            lazy(() => import('./models/Bench')),
  'bench:upholstered':     lazy(() => import('./models/BenchUpholstered')),

  // ── Çalışma Odası (Agent B) ──
  'desk':             lazy(() => import('./models/Desk')),
  'office-chair':     lazy(() => import('./models/OfficeChair')),
  'filing-cabinet':   lazy(() => import('./models/FilingCabinet')),
  'bookcase':         lazy(() => import('./models/Bookcase')),
  'monitor':          lazy(() => import('./models/Monitor')),

  // ── Çocuk Odası (Agent B) ──
  'crib':             lazy(() => import('./models/Crib')),
  'bunk-bed':         lazy(() => import('./models/BunkBed')),
  'toy-storage':      lazy(() => import('./models/ToyStorage')),
  'kids-desk':        lazy(() => import('./models/KidsDesk')),
  'changing-table':   lazy(() => import('./models/ChangingTable')),

  // ── Bahçe / Dış Mekan (Agent C) ──
  'garden-chair':     lazy(() => import('./models/GardenChair')),
  'garden-table':     lazy(() => import('./models/GardenTable')),
  'umbrella':         lazy(() => import('./models/Umbrella')),
  'hammock':          lazy(() => import('./models/Hammock')),
  'bbq-grill':        lazy(() => import('./models/BbqGrill')),

  // ── Dekor genişleme (Agent C) ──
  'mirror':           lazy(() => import('./models/Mirror')),
  'wall-art':         lazy(() => import('./models/WallArt')),
  'vase':             lazy(() => import('./models/Vase')),
  'wall-clock':       lazy(() => import('./models/WallClock')),
  'curtain':          lazy(() => import('./models/Curtain')),
  'candle':           lazy(() => import('./models/Candle')),

  // ── Yapısal (Merdiven) ──
  'stair':            lazy(() => import('./models/StairStraight')),
  'stair:straight':   lazy(() => import('./models/StairStraight')),
  'stair:lshape':     lazy(() => import('./models/StairL')),

  // ── Yapısal Bahçe (Agent E) ──
  'pool':        lazy(() => import('./models/Pool')),
  'fence':       lazy(() => import('./models/Fence')),
  'gate':        lazy(() => import('./models/Gate')),
  'greenhouse':  lazy(() => import('./models/Greenhouse')),
  'grass-patch': lazy(() => import('./models/GrassPatch')),
  'tree':        lazy(() => import('./models/Tree')),
  'tree:round':  lazy(() => import('./models/Tree')),
  'tree:pine':   lazy(() => import('./models/Tree')),

  // ── Yatak variant (Agent F) ──
  'bed:single':      lazy(() => import('./models/BedSingle')),
  'bed:queen':       lazy(() => import('./models/BedQueen')),
  'bed:king':        lazy(() => import('./models/BedKing')),
  'bed:canopy':      lazy(() => import('./models/BedCanopy')),

  // ── Yatak odası aksesuar (Agent F) ──
  'nightstand':      lazy(() => import('./models/Nightstand')),
  'dresser':         lazy(() => import('./models/Dresser')),
  'dresser:3drawer': lazy(() => import('./models/Dresser3')),
  'dresser:4drawer': lazy(() => import('./models/Dresser')),
  'dresser:6drawer': lazy(() => import('./models/Dresser6')),
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

function FurnitureItem({ item }: FurnitureItemProps) {
  const groupRef = useRef<THREE.Group>(null)
  // #5: derived selector — sadece BU item seçildiğinde re-render tetikler.
  // Önceden `s.selection` ref'e subscribe oluyordu → her select() çağrısı TÜM
  // mobilyaları re-render ediyordu (N item × N select = N² render). Şimdi boolean
  // subscription ile sadece ilgili item etkilenir.
  const isSelected = useDesignStore(s =>
    s.selection.kind === 'furniture' && s.selection.id === item.id
  )
  const isMultiSelected = useDesignStore(s => s.multiSelectedIds.includes(item.id))
  const select = useDesignStore(s => s.select)
  const toggleMultiSelect   = useDesignStore(s => s.toggleMultiSelect)
  const clearMultiSelection  = useDesignStore(s => s.clearMultiSelection)
  const moveMultiSelection   = useDesignStore(s => s.moveMultiSelection)
  const updateFurniture = useDesignStore(s => s.updateFurniture)
  const setStoreDragging = useDesignStore(s => s.setDragging)
  const { raycaster, gl, camera } = useThree()
  const { checkAndSuggestPin } = useAutoPin(item.id)
  const [, forceRender] = useState(0)
  // Ref-based drag state — React state'i olay sırasında güncellemeye gerek yok
  const dragMode = useRef<'none' | 'move' | 'resize'>('none')
  const resizeKeyRef = useRef<string | null>(null)
  const dragOffset = useRef(new THREE.Vector3())
  const startDims = useRef<Record<string, number>>({})
  const startPoint = useRef(new THREE.Vector3())
  const itemRef = useRef(item)
  itemRef.current = item

  const ceilingHeight = useDesignStore(s => s.ceilingHeight)
  const rawBb = useMemo(() => getBoundingBox(item.type, item.dims, item.variant), [item.type, item.dims, item.variant])
  // Tavan lambası: yOffset kat yüksekliğine göre dinamik hesaplanmalı
  // (lamba tavana takılı kalacak şekilde)
  const bb = useMemo(() => {
    if (item.type === 'ceilinglamp') {
      return { ...rawBb, yOffset: ceilingHeight - rawBb.h }
    }
    return rawBb
  }, [rawBb, item.type, ceilingHeight])
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

  const handleContextMenu = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    select('furniture', item.id)
    const ne = e.nativeEvent ?? e
    useDesignStore.getState().setContextMenuPos({
      x: ne.clientX ?? window.__lastPointerX ?? 0,
      y: ne.clientY ?? window.__lastPointerY ?? 0,
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

      // Çoklu seçim sürükleme — tüm seçili öğeleri aynı anda taşı
      const multiIds = state.multiSelectedIds
      if (multiIds.includes(it.id) && multiIds.length > 1) {
        const dx = rawX - it.position[0]
        const dz = rawZ - it.position[1]
        moveMultiSelection(dx, dz)
        return
      }

      // Tekli sürükleme: snap + overlap kontrolü
      const cosR = Math.abs(Math.cos(it.rotation))
      const sinR = Math.abs(Math.sin(it.rotation))
      const curBb = getBoundingBox(it.type, it.dims, it.variant)
      const halfW = (curBb.w * cosR + curBb.d * sinR) / 2
      const halfD = (curBb.w * sinR + curBb.d * cosR) / 2
      // #6: snap/overlap sadece mobilyanın kendi katındaki oda/mobilyayla
      const itemFloorId = it.floorId ?? state.activeFloorId
      const sameFloorRooms = state.rooms.filter(r => (r.floorId ?? state.activeFloorId) === itemFloorId)
      const sameFloorFurniture = state.furniture.filter(f => {
        if (f.parentRoomId) {
          const room = state.rooms.find(r => r.id === f.parentRoomId)
          return room && (room.floorId ?? state.activeFloorId) === itemFloorId
        }
        return (f.floorId ?? state.activeFloorId) === itemFloorId
      })
      const snapped = snapFurniturePosition(rawX, rawZ, sameFloorRooms, sameFloorFurniture, it.id, halfW, halfD)
      updateFurniture(it.id, { position: [snapped.x, snapped.z] })
    }
  }

  const stopDrag = () => {
    const wasMove = dragMode.current === 'move'
    dragMode.current = 'none'
    resizeKeyRef.current = null
    setStoreDragging(false)
    window.__evPointerCaptured = false
    window.removeEventListener('pointermove', onWindowMove)
    window.removeEventListener('pointerup', onWindowUp)
    window.removeEventListener('pointercancel', onWindowUp)
    if (wasMove) checkAndSuggestPin()
    forceRender(n => n + 1)  // selection overlay'i güncelle
  }

  const onWindowUp = () => { stopDrag() }

  // Ana gövde — Taşıma modunda sürükleme
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    const native: PointerEvent | undefined = e.nativeEvent
    // Sağ tık: preventDefault çağırırsak contextmenu olayı iptal olur → menü açılmaz
    if (native?.button === 2) return
    e.stopPropagation()
    native?.stopPropagation?.()
    native?.stopImmediatePropagation?.()
    window.__evPointerCaptured = true

    // Ctrl+click (Mac: Cmd+click): çoklu seçime ekle/çıkar — sürükleme başlatılmaz
    if (native?.ctrlKey || native?.metaKey) {
      toggleMultiSelect(item.id)
      return
    }

    // Normal click: tek seçim, çoklu seçimi temizle
    clearMultiSelection()
    select('furniture', item.id)

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
  const handleHandleDown = (key: string) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    const native: PointerEvent | undefined = e.nativeEvent
    native?.stopPropagation?.()
    native?.stopImmediatePropagation?.()
    native?.preventDefault?.()

    window.__evPointerCaptured = true
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

  // Unmount güvenliği: sürükleme aktifken bileşen kaldırılırsa window
  // listener'larını bırak. stopDrag'ı deps'e eklemek her render cleanup
  // tetiklerdi ve aktif listener'lar sızardı. Ref tabanlı alternatif
  // stopDrag içindeki window/gl mutasyonları nedeniyle
  // react-hooks/immutability'yi tetikliyor — bilinçli suppression.
  useEffect(() => () => { if (dragMode.current !== 'none') stopDrag() },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [])

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
        <group position={[0, bb.yOffset ?? 0, 0]}>
          {item.type === 'custom' && item.customModelUrl
            ? <CustomModel dims={item.dims} modelUrl={item.customModelUrl} />
            : ModelComponent && (
                <ModelComponent
                  dims={item.dims}
                  lightIntensity={item.lightIntensity}
                  lumens={item.lumens}
                  colorTempK={item.colorTempK}
                  lightOn={item.lightOn ?? true}
                />
              )
          }
        </group>
      </Suspense>

      {/* Sabitlenmiş mobilya pin göstergesi */}
      {item.parentRoomId && <PinIndicator height={(bb.yOffset ?? 0) + bb.h} />}

      {/* Çoklu seçim amber highlight */}
      {isMultiSelected && (
        <lineSegments position={[0, (bb.yOffset ?? 0) + bb.h / 2, 0]}>
          <edgesGeometry args={[new THREE.BoxGeometry(bb.w + 0.08, bb.h + 0.08, bb.d + 0.08)]} />
          <lineBasicMaterial color={0xf59e0b} transparent opacity={0.85} />
        </lineSegments>
      )}

      {/* Tekli seçim vurgusu */}
      {isSelected && (
        <lineSegments position={[0, (bb.yOffset ?? 0) + bb.h / 2, 0]}>
          <edgesGeometry args={[new THREE.BoxGeometry(bb.w, bb.h, bb.d)]} />
          <lineBasicMaterial color={item.color} transparent opacity={0.7} />
        </lineSegments>
      )}

      {/* Resize handle'ları — mobilya seçili olduğunda her zaman görünür */}
      {isSelected && (
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

/**
 * #5: React.memo ile sarmalayıp aynı `item` referansı için gereksiz re-render
 * engellenir. Store'daki mobilya listesi Zustand `set(..)` ile immutable
 * güncellenir — sadece gerçekten değişen item yeni referans alır.
 */
export default memo(FurnitureItem, (prev, next) => prev.item === next.item)

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

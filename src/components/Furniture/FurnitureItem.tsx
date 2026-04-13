import { useRef, useState, useMemo, lazy, Suspense } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import type { FurnitureItem as FurnitureItemType } from '../../types'
import { useDesignStore } from '../../store/designStore'
import { getBoundingBox } from './registry'

import CustomModel from './models/CustomModel'

// Lazy-load mobilya modelleri
const modelComponents: Record<string, React.LazyExoticComponent<React.ComponentType<{ dims: Record<string, number> }>>> = {
  sofa:      lazy(() => import('./models/Sofa')),
  chair:     lazy(() => import('./models/Chair')),
  dchair:    lazy(() => import('./models/DiningChair')),
  ctable:    lazy(() => import('./models/CoffeeTable')),
  tvunit:    lazy(() => import('./models/TVUnit')),
  dtable:    lazy(() => import('./models/DiningTable')),
  bed:       lazy(() => import('./models/Bed')),
  wardrobe:  lazy(() => import('./models/Wardrobe')),
  shelf:     lazy(() => import('./models/Shelf')),
  floorlamp: lazy(() => import('./models/FloorLamp')),
  rug:       lazy(() => import('./models/Rug')),
  plant:     lazy(() => import('./models/Plant')),
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
  const { raycaster } = useThree()

  const isSelected = selection.kind === 'furniture' && selection.id === item.id
  const [dragging, setDragging] = useState(false)
  const [resizeKey, setResizeKey] = useState<string | null>(null)
  const dragOffset = useRef(new THREE.Vector3())
  const startDims = useRef<Record<string, number>>({})
  const startPoint = useRef(new THREE.Vector3())

  const bb = useMemo(() => getBoundingBox(item.type, item.dims), [item.type, item.dims])
  const groundPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), [])

  const ModelComponent = modelComponents[item.type]

  const handlePointerDown = (e: any) => {
    e.stopPropagation()
    // Sync flag to prevent room from also handling this event
    ;(window as any).__evPointerCaptured = true
    select('furniture', item.id)
    const intersect = new THREE.Vector3()
    raycaster.ray.intersectPlane(groundPlane, intersect)
    if (intersect) {
      dragOffset.current.set(item.position[0] - intersect.x, 0, item.position[1] - intersect.z)
    }
    setDragging(true)
    setStoreDragging(true)
    ;(e.target as HTMLElement)?.setPointerCapture?.(e.pointerId)
  }

  const handlePointerMove = (e: any) => {
    if (!dragging && !resizeKey) return
    e.stopPropagation()
    const intersect = new THREE.Vector3()
    raycaster.ray.intersectPlane(groundPlane, intersect)
    if (!intersect) return

    if (resizeKey) {
      const delta = intersect.clone().sub(startPoint.current)
      const cosR = Math.cos(item.rotation)
      const sinR = Math.sin(item.rotation)
      const localDx = delta.x * cosR + delta.z * sinR
      const localDz = -delta.x * sinR + delta.z * cosR

      const newDims = { ...startDims.current }
      // Map resize key to dimension axis
      if (resizeKey === 'x') {
        const dimKey = getDimKeyForAxis(item.type, 'x')
        if (dimKey) newDims[dimKey] = Math.round(Math.max(10, startDims.current[dimKey] + localDx * 200))
      } else if (resizeKey === 'z') {
        const dimKey = getDimKeyForAxis(item.type, 'z')
        if (dimKey) newDims[dimKey] = Math.round(Math.max(10, startDims.current[dimKey] + localDz * 200))
      }
      updateFurniture(item.id, { dims: newDims })
    } else if (dragging) {
      updateFurniture(item.id, {
        position: [intersect.x + dragOffset.current.x, intersect.z + dragOffset.current.z],
      })
    }
  }

  const handlePointerUp = () => {
    setDragging(false)
    setResizeKey(null)
    setStoreDragging(false)
    ;(window as any).__evPointerCaptured = false
  }

  const handleHandleDown = (axis: 'x' | 'z') => (e: any) => {
    e.stopPropagation()
    ;(window as any).__evPointerCaptured = true
    select('furniture', item.id)
    setResizeKey(axis)
    setStoreDragging(true)
    startDims.current = { ...item.dims }
    const intersect = new THREE.Vector3()
    raycaster.ray.intersectPlane(groundPlane, intersect)
    if (intersect) startPoint.current.copy(intersect)
    ;(e.target as HTMLElement)?.setPointerCapture?.(e.pointerId)
  }

  return (
    <group
      ref={groupRef}
      position={[item.position[0], 0, item.position[1]]}
      rotation={[0, item.rotation, 0]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <Suspense fallback={
        <mesh position={[0, bb.h / 2, 0]}>
          <boxGeometry args={[bb.w * 0.8, bb.h * 0.8, bb.d * 0.8]} />
          <meshLambertMaterial color={0xcccccc} transparent opacity={0.5} />
        </mesh>
      }>
        {item.type === 'custom' && item.customModelUrl
          ? <CustomModel dims={item.dims} modelUrl={item.customModelUrl} />
          : ModelComponent && <ModelComponent dims={item.dims} />
        }
      </Suspense>

      {/* Selection highlight */}
      {isSelected && (
        <lineSegments position={[0, bb.h / 2, 0]}>
          <edgesGeometry args={[new THREE.BoxGeometry(bb.w, bb.h, bb.d)]} />
          <lineBasicMaterial color={item.color} transparent opacity={0.7} />
        </lineSegments>
      )}

      {/* Resize handles */}
      {isSelected && (
        <>
          <mesh position={[bb.w / 2 + 0.08, bb.h * 0.3, 0]} onPointerDown={handleHandleDown('x')} data-testid={`furn-handle-x-${item.id}`}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshBasicMaterial color={0xff8844} />
          </mesh>
          <mesh position={[-bb.w / 2 - 0.08, bb.h * 0.3, 0]} onPointerDown={handleHandleDown('x')} >
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
        </>
      )}
    </group>
  )
}

function getDimKeyForAxis(type: string, axis: 'x' | 'z'): string | null {
  const xMap: Record<string, string> = {
    sofa: 'length', dtable: 'length', bed: 'width', wardrobe: 'width',
    shelf: 'width', rug: 'length',
  }
  const zMap: Record<string, string> = {
    dtable: 'width', bed: 'length', wardrobe: 'depth', rug: 'width',
  }
  const diamTypes = ['chair', 'ctable', 'plant']
  if (diamTypes.includes(type)) return 'diameter'
  if (type === 'tvunit' && axis === 'z') return 'length'
  return axis === 'x' ? (xMap[type] ?? null) : (zMap[type] ?? null)
}

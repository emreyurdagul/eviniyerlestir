import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

interface CustomModelProps {
  dims: Record<string, number>
  modelUrl: string
}

export default function CustomModel({ dims, modelUrl }: CustomModelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const gltf = useLoader(GLTFLoader, modelUrl)

  const scale = (dims.scale ?? 100) / 100

  useEffect(() => {
    if (!groupRef.current || !gltf.scene) return

    // Center model and normalize size
    const clone = gltf.scene.clone(true)
    const box = new THREE.Box3().setFromObject(clone)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())

    // Normalize to ~1m height
    const maxDim = Math.max(size.x, size.y, size.z)
    const normalizeScale = maxDim > 0 ? 1 / maxDim : 1
    clone.scale.setScalar(normalizeScale)
    clone.position.set(-center.x * normalizeScale, -box.min.y * normalizeScale, -center.z * normalizeScale)

    // Enable shadows
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    // Clear and add
    while (groupRef.current.children.length) {
      groupRef.current.remove(groupRef.current.children[0])
    }
    groupRef.current.add(clone)
  }, [gltf])

  return <group ref={groupRef} scale={[scale, scale, scale]} />
}

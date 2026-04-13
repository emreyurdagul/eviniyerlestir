import { useMemo } from 'react'
import * as THREE from 'three'
import { useLoader } from '@react-three/fiber'
import { useDesignStore } from '../../store/designStore'

export default function BlueprintOverlay() {
  const blueprintUrl = useDesignStore(s => s.blueprintUrl)
  const blueprintScale = useDesignStore(s => s.blueprintScale)
  const blueprintOpacity = useDesignStore(s => s.blueprintOpacity)

  if (!blueprintUrl) return null

  return (
    <BlueprintMesh
      url={blueprintUrl}
      scale={blueprintScale}
      opacity={blueprintOpacity}
    />
  )
}

function BlueprintMesh({ url, scale, opacity }: { url: string; scale: number; opacity: number }) {
  const texture = useLoader(THREE.TextureLoader, url)

  const aspect = useMemo(() => {
    if (!texture.image) return 1
    return texture.image.width / texture.image.height
  }, [texture])

  const width = scale
  const height = scale / aspect

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

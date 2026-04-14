import { Html } from '@react-three/drei'
import type { Room } from '../../types'

interface DimensionLabelsProps {
  room: Room
}

export default function DimensionLabels({ room }: DimensionLabelsProps) {
  const wM = room.widthCm / 100
  const lM = room.lengthCm / 100
  const hw = wM / 2
  const hl = lM / 2
  const y = 0.05

  const labelStyle: React.CSSProperties = {
    background: 'rgba(0,0,0,0.7)',
    color: '#fff',
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    userSelect: 'none',
  }

  return (
    <group>
      {/* Width label (along X axis, front wall) */}
      <Html position={[0, y, hl + 0.25]} center style={{ pointerEvents: 'none' }}>
        <div style={labelStyle}>{room.widthCm} cm</div>
      </Html>

      {/* Length label (along Z axis, right wall) */}
      <Html position={[hw + 0.25, y, 0]} center style={{ pointerEvents: 'none' }}>
        <div style={labelStyle}>{room.lengthCm} cm</div>
      </Html>

      {/* Dimension lines */}
      {/* Width line (front) */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([-hw, y, hl + 0.15, hw, y, hl + 0.15]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={0xff4444} />
      </line>

      {/* Length line (right) */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([hw + 0.15, y, -hl, hw + 0.15, y, hl]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={0x4444ff} />
      </line>

      {/* End caps - width */}
      {[-hw, hw].map((x, i) => (
        <line key={`w-${i}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([x, y, hl + 0.08, x, y, hl + 0.22]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color={0xff4444} />
        </line>
      ))}

      {/* End caps - length */}
      {[-hl, hl].map((z, i) => (
        <line key={`l-${i}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([hw + 0.08, y, z, hw + 0.22, y, z]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color={0x4444ff} />
        </line>
      ))}
    </group>
  )
}

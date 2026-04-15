import { Html } from '@react-three/drei'
import type { Room } from '../../types'
import { ROOM_TYPES } from '../../types'

interface DimensionLabelsProps {
  room: Room
}

const ROOM_META_MAP = Object.fromEntries(ROOM_TYPES.map(r => [r.type, r]))

export default function DimensionLabels({ room }: DimensionLabelsProps) {
  const wM = room.widthCm / 100
  const lM = room.lengthCm / 100
  const hw = wM / 2
  const hl = lM / 2
  const y = 0.05

  const dimStyle: React.CSSProperties = {
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

  const roomMeta = ROOM_META_MAP[room.type]
  const areaM2 = (room.widthCm * room.lengthCm / 10000).toFixed(1)

  return (
    <group>
      {/* Oda tipi etiketi — oda içinde ortada */}
      <Html position={[0, y + 0.01, 0]} center style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(255,255,255,0.88)',
          color: '#3a2e20',
          padding: '3px 8px',
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 800,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
          border: '1px solid rgba(0,0,0,0.12)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
          letterSpacing: '0.02em',
        }}>
          {roomMeta?.icon} {roomMeta?.label ?? room.type}
          <span style={{ fontWeight: 400, color: '#888', fontSize: 9, marginLeft: 4 }}>
            {areaM2} m²
          </span>
        </div>
      </Html>

      {/* Width label (along X axis, front wall) */}
      <Html position={[0, y, hl + 0.25]} center style={{ pointerEvents: 'none' }}>
        <div style={dimStyle}>{room.widthCm} cm</div>
      </Html>

      {/* Length label (along Z axis, right wall) */}
      <Html position={[hw + 0.25, y, 0]} center style={{ pointerEvents: 'none' }}>
        <div style={dimStyle}>{room.lengthCm} cm</div>
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

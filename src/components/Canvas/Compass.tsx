import { Html } from '@react-three/drei'
import { useDesignStore } from '../../store/designStore'

export default function Compass() {
  const compassAngle = useDesignStore(s => s.compassAngle)
  const showCompass = useDesignStore(s => s.showCompass)

  if (!showCompass) return null

  // Compass yer seviyesinden hafif yukarida, sahnenin merkezinin disinda
  // Kuzey: -Z (compass rotation 0 referansi)
  // compassAngle uygulandiginda kuzey isareti dondurulur
  const r = 1.0  // pusula yaricapi (metre)
  const labelOffset = r + 0.3

  return (
    <group position={[0, 0.05, 0]} rotation={[0, compassAngle, 0]}>
      {/* Compass disk */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[r, 32]} />
        <meshBasicMaterial color={0xffffff} transparent opacity={0.4} />
      </mesh>
      {/* Border ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <ringGeometry args={[r - 0.05, r, 32]} />
        <meshBasicMaterial color={0x222222} transparent opacity={0.6} />
      </mesh>
      {/* North arrow (red) */}
      <mesh position={[0, 0.002, -r * 0.7]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.12, 0.4, 3]} />
        <meshBasicMaterial color={0xee3333} />
      </mesh>
      {/* South arrow (white/grey) */}
      <mesh position={[0, 0.002, r * 0.7]} rotation={[Math.PI / 2, Math.PI, 0]}>
        <coneGeometry args={[0.12, 0.4, 3]} />
        <meshBasicMaterial color={0x888888} />
      </mesh>
      {/* Cardinal labels */}
      <Html position={[0, 0.05, -labelOffset]} center style={{ pointerEvents: 'none', userSelect: 'none' }}>
        <div style={{ background: 'rgba(238,51,51,0.9)', color: '#fff', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>K</div>
      </Html>
      <Html position={[0, 0.05, labelOffset]} center style={{ pointerEvents: 'none', userSelect: 'none' }}>
        <div style={{ background: 'rgba(50,50,50,0.85)', color: '#fff', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>G</div>
      </Html>
      <Html position={[labelOffset, 0.05, 0]} center style={{ pointerEvents: 'none', userSelect: 'none' }}>
        <div style={{ background: 'rgba(50,50,50,0.85)', color: '#fff', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>D</div>
      </Html>
      <Html position={[-labelOffset, 0.05, 0]} center style={{ pointerEvents: 'none', userSelect: 'none' }}>
        <div style={{ background: 'rgba(50,50,50,0.85)', color: '#fff', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>B</div>
      </Html>
    </group>
  )
}

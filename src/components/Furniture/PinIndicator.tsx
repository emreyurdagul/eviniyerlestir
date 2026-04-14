/** Sabitlenmiş mobilyanın üstünde gösterilen küçük 3D pin ikonu */
interface PinIndicatorProps {
  height: number
}

export default function PinIndicator({ height }: PinIndicatorProps) {
  return (
    <group position={[0, height + 0.18, 0]}>
      {/* İğne gövdesi */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.14, 6]} />
        <meshBasicMaterial color={0x3388ff} />
      </mesh>
      {/* İğne başı */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color={0x3388ff} />
      </mesh>
    </group>
  )
}

import { useMemo } from 'react'
import { useDesignStore } from '../../store/designStore'
import { computeSunPosition, ambientForHour } from '../../utils/sun'

export default function SunLight() {
  const sunHour = useDesignStore(s => s.sunHour)
  const sunMonth = useDesignStore(s => s.sunMonth)
  const compassAngle = useDesignStore(s => s.compassAngle)

  const sun = useMemo(
    () => computeSunPosition(sunHour, sunMonth, compassAngle),
    [sunHour, sunMonth, compassAngle]
  )

  const ambient = useMemo(() => ambientForHour(sunHour), [sunHour])

  return (
    <>
      <ambientLight intensity={ambient.intensity} color={ambient.color} />
      <directionalLight
        position={sun.position}
        intensity={sun.intensity}
        color={sun.color}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-camera-near={0.1}
        shadow-camera-far={50}
        shadow-bias={-0.0008}
      />
    </>
  )
}

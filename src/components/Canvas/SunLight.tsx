import { useMemo } from 'react'
import { useDesignStore } from '../../store/designStore'
import { computeSunPosition, ambientForHour } from '../../utils/sun'

export default function SunLight() {
  const sunHour = useDesignStore(s => s.sunHour)
  const sunMonth = useDesignStore(s => s.sunMonth)
  const compassAngle = useDesignStore(s => s.compassAngle)
  const detailed = useDesignStore(s => s.detailedLighting)
  const hdri = useDesignStore(s => s.hdriEnvironment)

  const sun = useMemo(
    () => computeSunPosition(sunHour, sunMonth, compassAngle),
    [sunHour, sunMonth, compassAngle]
  )

  const ambient = useMemo(() => ambientForHour(sunHour), [sunHour])

  // HDRI açıkken sahne zaten her yönden aydınlanıyor; güneşi ve ambient'ı
  // düşür ki iki kaynak birbirini aşırı doyurmasın.
  const sunIntensity = hdri ? sun.intensity * 0.5 : sun.intensity
  const ambientIntensity = hdri ? ambient.intensity * 0.4 : ambient.intensity

  return (
    <>
      <ambientLight intensity={ambientIntensity} color={ambient.color} />
      <directionalLight
        position={sun.position}
        intensity={sunIntensity}
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
        // Detaylı modda gölge kenarını yumuşat (kontak noktalar doğal görünür)
        shadow-radius={detailed ? 4 : 1}
        shadow-blurSamples={detailed ? 16 : 8}
      />
    </>
  )
}

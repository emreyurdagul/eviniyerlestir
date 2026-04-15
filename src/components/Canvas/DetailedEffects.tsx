/**
 * DetailedEffects — SSAO postprocessing sarmalayıcı.
 *
 * Ayrı dosyada çünkü SceneCanvas'tan lazy-load ediliyor (bundle optimizasyonu
 * — #4). Ana `postprocessing` ve `@react-three/postprocessing` paketleri ~70 KB
 * gzipped; kullanıcı "Detaylı Işık Analizi" toggle'ını açana dek hiç indirilmez.
 *
 * enableNormalPass şart — SSAO surface normal buffer ister.
 */

import { EffectComposer, SSAO } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'

export default function DetailedEffects() {
  return (
    <EffectComposer enableNormalPass>
      <SSAO
        blendFunction={BlendFunction.MULTIPLY}
        samples={16}                // 30+ daha iyi ama maliyetli; 16 iyi denge
        radius={0.1}                // metrelerde; 10 cm contact-shadow yarıçapı
        intensity={25}              // SSAO katkı gücü
        luminanceInfluence={0.6}    // parlak alanları koruma oranı
        worldDistanceThreshold={0.5}
        worldDistanceFalloff={0.1}
        worldProximityThreshold={0.5}
        worldProximityFalloff={0.1}
      />
    </EffectComposer>
  )
}

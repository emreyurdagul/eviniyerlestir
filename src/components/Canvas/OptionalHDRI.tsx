/**
 * OptionalHDRI — @react-three/drei Environment sarmalayıcı.
 *
 * Ayrı dosya çünkü SceneCanvas'tan lazy-load ediliyor (bundle optimizasyonu
 * — #4). "apartment" preset HDRI texture ~200 KB; kullanıcı HDRI toggle'ını
 * açana dek indirilmez.
 *
 * `background={false}`: sadece yansıma/ambient katkısı yapar, görünür
 * arka planı değiştirmez (Ground bileşeni hakim kalır).
 */

import { Environment } from '@react-three/drei'

export default function OptionalHDRI() {
  return <Environment preset="apartment" background={false} />
}

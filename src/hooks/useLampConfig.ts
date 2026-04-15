/**
 * useLampConfig — lamba modellerinin tekrar eden ışık hesaplarını tek yerden sağlar.
 *
 * Öncesinde 8 lamba dosyasında (Ceiling*, Floor*, WallSconce*) şu 4-5 satırlık
 * blok kopyalanıyordu:
 *
 *   const effectiveLumens = lumens ?? (lightIntensity !== undefined ? lightIntensity * X : Y)
 *   const intensity = lumensToIntensity(effectiveLumens, modelScale)
 *   const colorHex = kelvinToHex(colorTempK)
 *   const shadeOn = useMemo(() => new THREE.MeshBasicMaterial({ color: colorHex }), [colorHex])
 *
 * Bu hook dörtlüyü tek `useLampConfig({ lumens, lightIntensity, colorTempK, ... })`
 * çağrısına indirir. Legacy `lightIntensity` alanı halen desteklenir (sıfırlanamayan
 * migration tipi). Dönen emissiveMaterial Three.js `MeshBasicMaterial` — lamba açıkken
 * abajur / küre / panel yüzeyinde kullanılır.
 */

import { useMemo } from 'react'
import * as THREE from 'three'
import { kelvinToHex, lumensToIntensity } from '../utils/light'

export interface LampConfigInput {
  /** Kullanıcının ayarladığı lümen. Yoksa legacy hesaba veya varsayılana düşer. */
  lumens?: number
  /** DEPRECATED — eski 0-1 aralığındaki skaler ışık şiddeti. */
  lightIntensity?: number
  /** Renk sıcaklığı (Kelvin). Varsayılan parametreden gelir. */
  colorTempK: number
  /**
   * Lümenin görsel intensity'e dönüşüm çarpanı.
   * Büyük / geniş aydınlatan lambalarda yüksek (2.0-2.5), küçük aplikte düşük (0.8-1.0).
   */
  modelScale: number
  /** Legacy lightIntensity'yi lümene çevirirken kullanılan çarpan (tip başına farklı kalibrasyon). */
  legacyScale: number
  /** lumens ve lightIntensity yoksa kullanılacak varsayılan lümen. */
  defaultLumens: number
  /**
   * Birden fazla ışık kaynağı olan lambalar için bölme (ör. WallSconceModern'da 2 yön).
   * Default 1 (bölme yok). Toplam lümen bu değere bölünür, böylece slider "toplam lümen" ifade eder.
   */
  divide?: number
}

export interface LampConfig {
  /** Three.js pointLight.intensity değeri (tek ışık kaynağı için — zaten divide uygulanmıştır). */
  intensity: number
  /** Renk hex (sayısal). pointLight.color ve emissive yüzey için aynı değer. */
  colorHex: number
  /** Lamba açıkken abajur/küre/panelde kullanılacak parlatılmış materyal. */
  emissiveMaterial: THREE.MeshBasicMaterial
}

export function useLampConfig(input: LampConfigInput): LampConfig {
  const {
    lumens,
    lightIntensity,
    colorTempK,
    modelScale,
    legacyScale,
    defaultLumens,
    divide = 1,
  } = input

  // Lümen öncelikli; yoksa legacy lightIntensity'den türet (tip başına kalibrasyon); yoksa default.
  const effectiveLumens =
    lumens ??
    (lightIntensity !== undefined ? lightIntensity * legacyScale : defaultLumens)

  const perLightLumens = effectiveLumens / divide
  const intensity = lumensToIntensity(perLightLumens, modelScale)
  const colorHex = kelvinToHex(colorTempK)

  // Materyal yeniden yaratmayı aza indir — renk değişmediği sürece paylaş.
  const emissiveMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: colorHex }),
    [colorHex],
  )

  return { intensity, colorHex, emissiveMaterial }
}

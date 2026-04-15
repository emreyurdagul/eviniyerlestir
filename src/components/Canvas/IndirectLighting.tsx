/**
 * IndirectLighting — "Detaylı Işık Analizi" toggle'ı açıkken devreye giren
 * dolaylı aydınlatma simülasyonu.
 *
 * Gerçekçilik stratejisi (gerçek GI yerine kanıtlanmış hileler):
 *   1. hemisphereLight — gökyüzü (mavimsi, üst) + zemin (sıcak, alt) tek ışık
 *      ile ortam renk gradyanı. Açık alanlardaki çevresel ışığı verir.
 *   2. 4 yatay "duvar-yansıma" directional light — kuzey/güney/doğu/batıdan
 *      çok düşük yoğunlukta ışık; nesnelerin duvar-tarafı yüzlerine hafif
 *      dolgu yapar. Gerçekte duvardan yansıyan ışığı simüle eder.
 *   3. Aşağıdan yukarıya 1 directional — döşeme yansımasını temsil eder;
 *      masa altı / koltuk altı gibi alanlarda düşük aydınlatma sağlar.
 *
 * Bu ışıkların HİÇBİRİ `castShadow` değildir — performans için yalnızca
 * SunLight gölge hesaplar. Bu sayede toggle açıldığında FPS kaybı minimal
 * (ek geometri hesabı yok, sadece shader fragment'te extra lerp).
 *
 * Store'dan `detailedLighting` okunur; false ise `null` döner (unmount).
 */

import { useDesignStore } from '../../store/designStore'

// Sun zaten dinamik (saat/mevsim); bu ışıklar statik dolgu, renkler sıcak-nötr
const SKY_COLOR    = 0xd7e6f5   // hafif mavi (gökyüzü yansıması)
const GROUND_COLOR = 0xd4c0a8   // sıcak bej (zemin yansıması)

// Bounce ışıkları: duvardan yansıma simülasyonu — çok düşük yoğunlukta
// çünkü gerçekte yansıyan ışık orijinalin %5–15'i kadardır
const BOUNCE_INTENSITY = 0.10
const FLOOR_BOUNCE_INTENSITY = 0.07
const BOUNCE_COLOR = 0xffe8cc  // iç mekan duvar beyazından yansıma tonu

export default function IndirectLighting() {
  const enabled = useDesignStore(s => s.detailedLighting)
  if (!enabled) return null

  return (
    <>
      {/* Gökyüzü–zemin gradyanı: tüm üst/alt yüzlere yumuşak ambient */}
      <hemisphereLight args={[SKY_COLOR, GROUND_COLOR, 0.35]} />

      {/* 4 duvar-yansıma (gölgesiz, gölge matrix maliyeti yok) */}
      <directionalLight position={[ 10, 3,  0]} intensity={BOUNCE_INTENSITY} color={BOUNCE_COLOR} />
      <directionalLight position={[-10, 3,  0]} intensity={BOUNCE_INTENSITY} color={BOUNCE_COLOR} />
      <directionalLight position={[  0, 3, 10]} intensity={BOUNCE_INTENSITY} color={BOUNCE_COLOR} />
      <directionalLight position={[  0, 3,-10]} intensity={BOUNCE_INTENSITY} color={BOUNCE_COLOR} />

      {/* Zemin-yansıma: aşağıdan yukarıya, masa/koltuk altlarını doldurur */}
      <directionalLight position={[0, -5, 0]} intensity={FLOOR_BOUNCE_INTENSITY} color={GROUND_COLOR} />
    </>
  )
}

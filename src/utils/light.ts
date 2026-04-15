/**
 * Aydınlatma yardımcıları — lümen / Kelvin / Watt dönüşümleri ve UI etiketleri.
 *
 * Amaç: Gerçek dünya birimlerinden (lm, K, W) Three.js ışık parametrelerine köprü.
 * Fiziksel doğruluk amacı güdülmez — görsel tutarlılık ve kullanıcıya anlamlı kontrol yeter.
 */

/**
 * Kelvin renk sıcaklığını hex RGB renge çevirir (Tanner Helland yaklaşımı).
 * 2000–6500 K aralığı için güvenilir, LED lamba renkleriyle uyumlu çıktı üretir.
 *
 * 2700 K → sıcak sarı (akkor ampul)
 * 3000 K → sıcak beyaz (halojen)
 * 4000 K → nötr beyaz
 * 5000 K → soğuk beyaz (gün ışığı)
 * 6500 K → soğuk mavi-beyaz (bulutlu gün ışığı)
 */
export function kelvinToHex(K: number): number {
  const T = Math.max(1000, Math.min(40000, K)) / 100
  let r: number, g: number, b: number

  if (T <= 66) {
    r = 255
    g = 99.4708025861 * Math.log(T) - 161.1195681661
    b = T <= 19 ? 0 : 138.5177312231 * Math.log(T - 10) - 305.0447927307
  } else {
    r = 329.698727446 * Math.pow(T - 60, -0.1332047592)
    g = 288.1221695283 * Math.pow(T - 60, -0.0755148492)
    b = 255
  }
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  return (clamp(r) << 16) | (clamp(g) << 8) | clamp(b)
}

/** Kelvin → '#rrggbb' CSS rengi (UI badge için) */
export function kelvinToCss(K: number): string {
  return '#' + kelvinToHex(K).toString(16).padStart(6, '0')
}

/** Kelvin → insan okunur renk adı (UI etiketi için) */
export function kelvinLabel(K: number): string {
  if (K < 2800) return 'Çok Sıcak'
  if (K < 3300) return 'Sıcak Beyaz'
  if (K < 4200) return 'Nötr Beyaz'
  if (K < 5200) return 'Soğuk Beyaz'
  return 'Gün Işığı'
}

/**
 * Lümen → LED Watt (modern LED etkinliği ~80 lm/W).
 * İzleyici referansı: 60W akkor ≈ 800 lm ≈ 10W LED.
 */
export function lumensToLedWatts(lumens: number): number {
  return Math.round(lumens / 80 * 10) / 10   // 1 ondalık
}

/** Lümen → Three.js pointLight.intensity (ampirik, görsel tutarlılık için) */
export function lumensToIntensity(lumens: number, modelScale = 1): number {
  // 800 lm (tipik oda ampulü) → intensity = 2.0 * modelScale
  return (lumens / 400) * modelScale
}

/**
 * Tavsiye edilen lux değerleri (oda tipi → lux aralığı).
 * Kaynak: IESNA / EN 12464-1 ev aydınlatma kılavuzları.
 */
export const RECOMMENDED_LUX: Record<string, { min: number; ideal: number; max: number }> = {
  salon:    { min: 100, ideal: 200, max: 300 },
  yatak:    { min: 100, ideal: 150, max: 200 },
  cocuk:    { min: 200, ideal: 300, max: 500 },
  mutfak:   { min: 300, ideal: 500, max: 750 },
  banyo:    { min: 200, ideal: 300, max: 500 },
  koridor:  { min: 100, ideal: 150, max: 200 },
  calisma:  { min: 300, ideal: 500, max: 750 },
  yemek:    { min: 150, ideal: 250, max: 350 },
}

/**
 * Kaba lux tahmini: totalLumens / alanM².
 * Gerçek lux duvar/zemin yansıtıcılığına bağlı; bu kaba bir üst sınır.
 */
export function estimateLux(totalLumens: number, areaM2: number): number {
  if (areaM2 <= 0) return 0
  return Math.round(totalLumens / areaM2)
}

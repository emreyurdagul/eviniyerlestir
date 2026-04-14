/**
 * Basitlestirilmis gunes pozisyonu hesabi.
 * Latitude ~ 39° (Turkiye ortalamasi), longitude konum bagimsiz.
 *
 * Donus: gunes vektor pozisyonu (compass=0 referansli, +Z = guney)
 * compassAngle parametresi sahnenin kuzey yonu ile +Z arasi rotation.
 */
export function computeSunPosition(
  hour: number,        // 0-24
  month: number,       // 1-12
  compassAngle: number, // radyan, kuzey aciligi
  distance = 15,
): { position: [number, number, number]; intensity: number; color: number } {
  // Gunes aci hesabi (basit)
  // Day length / declination ay'a gore degisir
  // Mart-Eyl: gunes daha yuksekte; Aralik-Subat: alcakta
  const declRad = ((month - 6) / 12) * Math.PI * 0.4 // -0.4 to +0.4 rad approx

  // Saat -> aci: 6:00 = -90°(dogu), 12:00 = 0°(zenit), 18:00 = 90°(bati)
  const hourAngleRad = ((hour - 12) / 6) * (Math.PI / 2)

  // Yukseklik (elevation): zenit'te en yuksek, sabah/aksam alcalir
  const elevationRad = Math.cos(hourAngleRad) * (Math.PI / 2 - declRad * 0.5)
  const elevation = Math.max(-0.2, elevationRad)

  // Azimuth: sabah dogudan (compass +90°), aksam batidan (compass -90°)
  // Kuzey yarim kurede gunes guneyden geciyor → azimuth merkezde 180° (compass)
  // World coords: kuzey = -Z (compass=0). Gunes guneyden geliyor → +Z yonunden
  // Saat aciliginda dogu/bati salinim
  const azimuth = Math.PI + hourAngleRad // PI = +Z (guney)

  // Compass rotation uygula: tum azimuth bir aci kadar dondur
  const finalAzimuth = azimuth + compassAngle

  // Spherical → Cartesian (Y = up)
  const horizontalRadius = Math.cos(elevation) * distance
  const x = Math.sin(finalAzimuth) * horizontalRadius
  const z = Math.cos(finalAzimuth) * horizontalRadius
  const y = Math.sin(elevation) * distance

  // Intensity: gunes batinca azalir, gece koyu
  let intensity = Math.max(0, Math.sin(elevation) * 1.2)
  if (hour < 5 || hour > 21) intensity = 0.05 // gece

  // Renk: gun dogumu/batiminda turuncu, ogle beyaz
  let color = 0xfffdf5
  if (hour < 7 || hour > 18) color = 0xffaa66      // amber
  else if (hour < 8 || hour > 17) color = 0xffd0a0  // soft amber

  return { position: [x, y, z], intensity, color }
}

export function ambientForHour(hour: number): { intensity: number; color: number } {
  if (hour < 6 || hour > 20) return { intensity: 0.15, color: 0x4a5070 } // gece - mavi
  if (hour < 8 || hour > 18) return { intensity: 0.4, color: 0xffd0a0 }  // alacakaranlik
  return { intensity: 0.7, color: 0xfff8ee }                              // gunduz
}

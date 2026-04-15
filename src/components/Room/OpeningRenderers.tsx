/**
 * OpeningRenderers — duvar açıklıkları (kapı / pencere / balkon) için
 * 3D render bileşenleri.
 *
 * WallWithOpenings içinde inline yaşıyorlardı; dosya 496 satıra şişmişti ve
 * segment hesabı + render mantığı karışıktı. Bu modüle taşıyarak:
 *   - WallWithOpenings yalnızca segment hesabı + orkestrasyon yapsın
 *   - Yeni açıklık tipleri eklemek tek dosyayı etkilesin
 *   - Paylaşılan materyaller (glassMat, railMat) ortak kapsamda kalsın
 *
 * Her tipin kendi küçük fonksiyonu var (OpeningDoor, OpeningWindow, ...)
 * ve `renderOpeningByType()` bunları tek switch'le seçiyor.
 */

import * as THREE from 'three'
import type { OpeningType } from '../../types'

// ── Shared materials (module-level singleton) ─────────────────────────────────
// Bu materyaller asla özellik değiştirmez — tek örnek paylaşmak doğru, materyal
// churn'ünü önler. HMR bile module referansını korur.
const glassMat = new THREE.MeshLambertMaterial({
  color: 0xb0cfdd,
  transparent: true,
  opacity: 0.28,
  side: THREE.DoubleSide,
})
const railMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa })

// ── Shared props ──────────────────────────────────────────────────────────────

export interface OpeningProps {
  /** Açıklık genişliği (metre) */
  wM: number
  /** Açıklık yüksekliği (metre) */
  hM: number
  /** Pervaz kalınlığı (metre, ~0.04) */
  frameW: number
  /** Duvar + pervaz derinliği (metre, duvar kalınlığı + 0.02) */
  wt: number
  /** Pervaz materyali (paylaşımlı) */
  frameMat: THREE.Material
}

// ── Primitives ────────────────────────────────────────────────────────────────

/** Yan + üst (opsiyonel alt) pervaz çerçevesi. Çoğu açıklıkta paylaşılır. */
function OuterFrame({ wM, hM, frameW, wt, frameMat, withBottom = false }: OpeningProps & { withBottom?: boolean }) {
  return (
    <>
      <mesh position={[-wM / 2, 0, 0]} castShadow>
        <boxGeometry args={[frameW, hM, wt]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <mesh position={[wM / 2, 0, 0]} castShadow>
        <boxGeometry args={[frameW, hM, wt]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <mesh position={[0, hM / 2, 0]} castShadow>
        <boxGeometry args={[wM + frameW * 2, frameW, wt]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      {withBottom && (
        <mesh position={[0, -hM / 2, 0]} castShadow>
          <boxGeometry args={[wM + frameW * 2, frameW, wt]} />
          <primitive object={frameMat} attach="material" />
        </mesh>
      )}
    </>
  )
}

/** Tek cam paneli */
function GlassPane({ w, h, z = 0 }: { w: number; h: number; z?: number }) {
  return (
    <mesh position={[0, 0, z]}>
      <planeGeometry args={[w, h]} />
      <primitive object={glassMat} attach="material" />
    </mesh>
  )
}

// ── Opening type renderers ────────────────────────────────────────────────────

/** Tek kanatlı kapı */
function OpeningDoor({ wM, hM, frameW, wt, frameMat }: OpeningProps) {
  return (
    <>
      <OuterFrame wM={wM} hM={hM} frameW={frameW} wt={wt} frameMat={frameMat} />
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[wM - frameW, hM - frameW, 0.04]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <mesh position={[wM * 0.3, 0, 0.03]}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshBasicMaterial color={0xc0a060} />
      </mesh>
    </>
  )
}

/** Çift (Fransız) kapı — iki panel, merkez ayırıcı */
function OpeningDoubleDoor({ wM, hM, frameW, wt, frameMat }: OpeningProps) {
  const panelW = (wM - frameW * 3) / 2
  return (
    <>
      <OuterFrame wM={wM} hM={hM} frameW={frameW} wt={wt} frameMat={frameMat} />
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[frameW, hM, wt]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <mesh position={[-(panelW / 2 + frameW / 2), 0, 0]}>
        <boxGeometry args={[panelW, hM - frameW, 0.04]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <mesh position={[panelW / 2 + frameW / 2, 0, 0]}>
        <boxGeometry args={[panelW, hM - frameW, 0.04]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <mesh position={[-frameW * 0.5, 0, 0.03]}>
        <sphereGeometry args={[0.022, 6, 6]} />
        <meshBasicMaterial color={0xc0a060} />
      </mesh>
      <mesh position={[frameW * 0.5, 0, 0.03]}>
        <sphereGeometry args={[0.022, 6, 6]} />
        <meshBasicMaterial color={0xc0a060} />
      </mesh>
    </>
  )
}

/** Sürgülü kapı — tam genişlik cam + ray */
function OpeningSlidingDoor({ wM, hM, frameW, wt, frameMat }: OpeningProps) {
  return (
    <>
      <OuterFrame wM={wM} hM={hM} frameW={frameW} wt={wt} frameMat={frameMat} />
      <mesh position={[0, hM / 2 - frameW * 0.5, 0]}>
        <boxGeometry args={[wM, frameW * 0.5, wt * 1.2]} />
        <primitive object={railMat} attach="material" />
      </mesh>
      <GlassPane w={wM * 0.52} h={hM - frameW * 2} z={-0.01} />
      <GlassPane w={wM * 0.52} h={hM - frameW * 2} z={0.01} />
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[frameW * 0.5, hM, wt * 0.5]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
    </>
  )
}

/** Standart pencere — alt pervaz + orta yatay kayıt */
function OpeningWindow({ wM, hM, frameW, wt, frameMat }: OpeningProps) {
  return (
    <>
      <OuterFrame wM={wM} hM={hM} frameW={frameW} wt={wt} frameMat={frameMat} withBottom />
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[wM, frameW * 0.7, wt]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <GlassPane w={wM - frameW} h={hM - frameW} />
    </>
  )
}

/** Panoramik / yerden-tavana pencere */
function OpeningPanoramic({ wM, hM, frameW, wt, frameMat }: OpeningProps) {
  const fw = frameW * 0.6
  return (
    <>
      <mesh position={[-wM / 2, 0, 0]} castShadow>
        <boxGeometry args={[fw, hM, wt]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <mesh position={[wM / 2, 0, 0]} castShadow>
        <boxGeometry args={[fw, hM, wt]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <mesh position={[0, hM / 2, 0]} castShadow>
        <boxGeometry args={[wM, fw, wt]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <GlassPane w={wM - fw} h={hM - fw} />
      {Array.from({ length: Math.floor(wM / 0.8) - 1 }, (_, i) => {
        const x = -wM / 2 + (i + 1) * (wM / Math.floor(wM / 0.8))
        return (
          <mesh key={i} position={[x, 0, 0]}>
            <boxGeometry args={[fw * 0.5, hM, wt * 0.5]} />
            <primitive object={frameMat} attach="material" />
          </mesh>
        )
      })}
    </>
  )
}

/** Üçlü pencere — 3 eşit cam + iki dikey ayırıcı */
function OpeningTripleWindow({ wM, hM, frameW, wt, frameMat }: OpeningProps) {
  const paneW = (wM - frameW * 4) / 3
  return (
    <>
      <OuterFrame wM={wM} hM={hM} frameW={frameW} wt={wt} frameMat={frameMat} withBottom />
      <mesh position={[-(paneW / 2 + frameW * 1.5), 0, 0]}>
        <boxGeometry args={[frameW, hM, wt]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <mesh position={[paneW / 2 + frameW * 1.5, 0, 0]}>
        <boxGeometry args={[frameW, hM, wt]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      {[-1, 0, 1].map(i => (
        <mesh key={i} position={[i * (paneW + frameW), 0, 0]}>
          <boxGeometry args={[paneW, frameW * 0.6, wt]} />
          <primitive object={frameMat} attach="material" />
        </mesh>
      ))}
      {[-1, 0, 1].map(i => (
        <mesh key={`g${i}`} position={[i * (paneW + frameW), 0, 0]}>
          <planeGeometry args={[paneW, hM - frameW]} />
          <primitive object={glassMat} attach="material" />
        </mesh>
      ))}
    </>
  )
}

/** Fransız balkon — zemin seviyesi cam + süslü korkuluk */
function OpeningFrenchBalcony({ wM, hM, frameW, wt, frameMat }: OpeningProps) {
  const railH = 0.10
  const railY = -hM / 2 + railH / 2
  return (
    <>
      <OuterFrame wM={wM} hM={hM} frameW={frameW} wt={wt} frameMat={frameMat} />
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[frameW * 0.8, hM, wt]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <mesh position={[-(wM / 4), 0, 0]}>
        <planeGeometry args={[(wM / 2) - frameW * 1.2, hM - frameW]} />
        <primitive object={glassMat} attach="material" />
      </mesh>
      <mesh position={[wM / 4, 0, 0]}>
        <planeGeometry args={[(wM / 2) - frameW * 1.2, hM - frameW]} />
        <primitive object={glassMat} attach="material" />
      </mesh>
      <mesh position={[0, railY, wt * 0.8]}>
        <boxGeometry args={[wM, railH, 0.04]} />
        <primitive object={railMat} attach="material" />
      </mesh>
      {Array.from({ length: Math.round(wM * 4) }, (_, i) => {
        const x = -wM / 2 + (i + 0.5) * (wM / Math.round(wM * 4))
        return (
          <mesh key={i} position={[x, railY, wt * 0.8]}>
            <boxGeometry args={[0.02, railH * 2.5, 0.02]} />
            <primitive object={railMat} attach="material" />
          </mesh>
        )
      })}
    </>
  )
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

/**
 * Tip → bileşen eşleme. Yeni açıklık tipi ekleyince bu switch'e ekle; tüm
 * render mantığı tek yerde. Tanımsız tip için null (sessizce düşür).
 */
export function renderOpeningByType(type: OpeningType, props: OpeningProps) {
  switch (type) {
    case 'door':           return <OpeningDoor           {...props} />
    case 'double-door':    return <OpeningDoubleDoor    {...props} />
    case 'sliding-door':   return <OpeningSlidingDoor   {...props} />
    case 'window':         return <OpeningWindow         {...props} />
    case 'panoramic':      return <OpeningPanoramic     {...props} />
    case 'triple-window':  return <OpeningTripleWindow  {...props} />
    case 'french-balcony': return <OpeningFrenchBalcony {...props} />
    default:               return null
  }
}

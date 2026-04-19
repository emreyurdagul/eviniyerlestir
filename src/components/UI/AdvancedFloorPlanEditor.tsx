/**
 * AdvancedFloorPlanEditor — profesyonel 2D kat planı editörü
 *
 * İki çizim modu:
 *  • Dikdörtgen oda (hızlı, ızgara hizalı) — eski Room modeliyle uyumlu
 *  • Duvar grafiği (vertex + wall) — uçtan uca sürükleyip serbest şekilli
 *    odalar oluşturulur. Duvara sağ-tıkla → bölerek yeni bağlantı noktası
 *    ekle. Kapalı döngü algılanınca "odaya çevir" butonu çıkar; polygon
 *    oda olarak store'a aktarılır.
 *
 * Genel özellikler:
 *  • SVG canvas, tekerlek zoom + orta tuş/Space pan
 *  • 10 cm küçük, 100 cm büyük (m etiketli) ızgara
 *  • Çift çizgili duvarlar (CAD standardı, 12 cm)
 *  • Kapı: açılma yayı + menteşe/iç-dış çevirme
 *  • Pencere: 3 paralel çizgi
 *  • Ölçü çizgileri (seçili odada)
 *  • Kroki yükle (image/PDF) + opaklık ayarı — editör içinde
 *  • 3D'ye aktar: aktif katın odalarını günceller
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import type { Room, RoomType, WallSide, OpeningType, WallOpening } from '../../types'
import { ROOM_TYPES } from '../../types'
import { useDesignStore } from '../../store/designStore'
import { pdfToImageUrl } from '../../services/pdfImport'
import { useEditorHistory } from '../../hooks/useEditorHistory'
import {
  collectSnapTargets, findSmartSnap, findPointSnap,
  type SnapTarget, type SnapResult,
} from '../../utils/editor-snap'
import { polygonSignedArea } from '../../utils/polygon'
import GuideOverlay from './floor-plan-editor/GuideOverlay'
import DimensionHUD from './floor-plan-editor/DimensionHUD'
import RotationHandle from './floor-plan-editor/RotationHandle'
import LayersPanel from './floor-plan-editor/LayersPanel'
import EditorContextMenu, { type MenuAction } from './floor-plan-editor/EditorContextMenu'
import FitZoomControls from './floor-plan-editor/FitZoomControls'

// ─── Sabitler ────────────────────────────────────────────────────────────────
const WALL_T    = 12    // duvar kalınlığı cm
const INIT_SC   = 1.5   // başlangıç ölçeği px/cm
const MIN_SC    = 0.15
const MAX_SC    = 12
const GRID      = 10    // küçük ızgara aralığı cm
const MAJOR     = 100   // büyük ızgara aralığı cm
const MIN_ROOM  = 80    // minimum oda boyutu cm
const WALL_HIT  = 22    // kapı/pencere için duvar click çekme mesafesi cm
const HANDLE_R  = 5     // resize tutamaç boyutu (px / ölçek)
const V_SNAP    = 25    // vertex snap eşiği (cm) — 0'dan büyükse mevcut vertex'e yapışır
const WALL_SPLIT_HIT = 18  // sağ-tık bölme için duvara tık çekme mesafesi (cm)
const MIN_WALL  = 40    // minimum duvar uzunluğu cm

// ─── Tipler ───────────────────────────────────────────────────────────────────
/** Dikdörtgen oda (eski model — hızlı oluşturma için) */
interface ERoom {
  id: string; type: RoomType
  cx: number; cy: number     // merkez cm
  wCm: number; hCm: number   // genişlik, yükseklik cm
  rot: number                // radyan
  customLabel?: string       // Faz 4: inline rename ile özelleştirilmiş etiket
  locked?: boolean           // Faz 4: kilitli oda — sürüklenemez/resize olmaz
}

/** Dikdörtgen oda açıklığı */
interface EOpening {
  id: string; roomId: string
  kind: 'door' | 'window'
  wall: 'top' | 'right' | 'bottom' | 'left'
  t: number; wCm: number
  swingRight: boolean; swingIn: boolean
}

/** Duvar grafiği — vertex */
interface Vertex { id: string; x: number; y: number }

/** Duvar grafiği — kenar */
interface Wall { id: string; v1: string; v2: string }

/** Duvar üstü açıklık (kapı/pencere) */
interface WallOp {
  id: string; wallId: string
  kind: 'door' | 'window'
  t: number              // 0-1 duvar boyunca
  wCm: number
  swingRight: boolean    // menteşe hangi uçta
  swingIn: boolean       // iç/dış açılım (normale göre)
  flipNormal: boolean    // normal yönünü çevir (hangi tarafı "iç" saysın)
}

/** Duvar döngüsünden elde edilmiş polygon oda */
interface GraphRoom {
  id: string; type: RoomType
  vertexIds: string[]   // CCW sıralı döngü (köşeler)
  wallIds: string[]     // karşılıklı duvar kenarları (uzunluk = vertexIds.length)
}

type Tool = 'select' | 'addRect' | 'addDoor' | 'addWindow' | 'drawWall'

interface DragState {
  kind: 'pan' | 'move' | 'new' | 'resize' | 'drawWall' | 'vertex' | 'rotate' | 'marquee'
  sx0: number; sy0: number
  wx0: number; wy0: number
  roomId?: string
  initCx?: number; initCy?: number
  initW?: number; initH?: number
  initRot?: number    // rotate: başlangıç rotation (radyan)
  a0?: number         // rotate: başlangıç açısı (pointer → merkez)
  handle?: string
  /** drawWall: başlangıç vertex id'si */
  vStartId?: string
  /** vertex drag: taşınan vertex id */
  vertexId?: string
  /** drawWall: fare konumunda bir preview end noktası var mı */
  moved?: boolean
  /** multi-move: her oda için başlangıç pozisyonları */
  initPositions?: Map<string, { cx: number; cy: number }>
  /** Alt+drag: sürüklenen kopya (duplicate-and-drag) mi */
  cloneDrag?: boolean
}

// ─── Renk & etiket haritaları ─────────────────────────────────────────────────
const RFILL: Record<string, string> = {
  salon:'#e8f4fd', yatak:'#e8f8ee', mutfak:'#fdfce6',
  banyo:'#e4f9fb', koridor:'#f2f0ed', cocuk:'#fdedf7', balkon:'#e6f8f2',
}
const RLABEL: Record<string, string> = {
  salon:'Salon', yatak:'Yatak Odası', mutfak:'Mutfak',
  banyo:'Banyo', koridor:'Koridor', cocuk:'Çocuk Odası', balkon:'Balkon',
}
const RWALL: Record<string, string> = {
  salon:'#e3ddd4', yatak:'#eae2d8', mutfak:'#dde2d8',
  banyo:'#d8e2e8', koridor:'#e2dcd4', cocuk:'#eae8d8', balkon:'#e8e4dc',
}
const W2D_3D: Record<string, WallSide> = {
  top:'back', bottom:'front', left:'left', right:'right',
}
const W3D_2D: Record<string, EOpening['wall']> = {
  back:'top', front:'bottom', left:'left', right:'right',
}

// ─── Yardımcı fonksiyonlar ────────────────────────────────────────────────────
let _uid = 0
const uid = (p='fp') => `${p}${++_uid}_${Math.random().toString(36).slice(2,5)}`
// Bug-fix: negatif asimetri önlemi — floor(v + g/2) simetrik round
const snap = (v: number, g: number) => Math.floor((v + g / 2) / g) * g
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
/** Açıyı [-π, π] aralığına normalize et (birikmeyi önler) */
const normalizeAngle = (a: number): number => {
  const TWO_PI = 2 * Math.PI
  let x = a % TWO_PI
  if (x > Math.PI) x -= TWO_PI
  else if (x < -Math.PI) x += TWO_PI
  return x
}

const rot = (x: number, y: number, r: number): [number, number] => [
  x * Math.cos(r) - y * Math.sin(r),
  x * Math.sin(r) + y * Math.cos(r),
]

function roomPoly(room: ERoom, offset: number): [number, number][] {
  const hw = room.wCm / 2 + offset
  const hh = room.hCm / 2 + offset
  return ([[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]] as [number,number][]).map(([x,y]) => {
    const [rx,ry] = rot(x, y, room.rot)
    return [room.cx + rx, room.cy + ry] as [number,number]
  })
}

const pts = (poly: [number,number][]) => poly.map(([x,y]) => `${x},${y}`).join(' ')

const s2w = (sx: number, sy: number, pan: {x:number,y:number}, sc: number) =>
  ({ x: (sx - pan.x) / sc, y: (sy - pan.y) / sc })

function inRoom(wx: number, wy: number, room: ERoom, outerIncl = false): boolean {
  const [lx, ly] = rot(wx - room.cx, wy - room.cy, -room.rot)
  const off = outerIncl ? WALL_T / 2 : -WALL_T / 2
  return Math.abs(lx) <= room.wCm / 2 + off && Math.abs(ly) <= room.hCm / 2 + off
}

function findWall(
  wx: number, wy: number, room: ERoom
): { wall: EOpening['wall']; t: number } | null {
  const [lx, ly] = rot(wx - room.cx, wy - room.cy, -room.rot)
  const hw = room.wCm / 2, hh = room.hCm / 2
  const candidates: Array<{wall: EOpening['wall']; dist: number; t: number}> = [
    { wall: 'top',    dist: Math.abs(ly + hh), t: clamp((lx + hw) / room.wCm, 0.05, 0.95) },
    { wall: 'bottom', dist: Math.abs(ly - hh), t: clamp((hw - lx) / room.wCm, 0.05, 0.95) },
    { wall: 'right',  dist: Math.abs(lx - hw), t: clamp((ly + hh) / room.hCm, 0.05, 0.95) },
    { wall: 'left',   dist: Math.abs(lx + hw), t: clamp((hh - ly) / room.hCm, 0.05, 0.95) },
  ]
  const inBounds = candidates.filter(c => {
    if (c.wall === 'top' || c.wall === 'bottom') return Math.abs(lx) <= hw + WALL_T
    return Math.abs(ly) <= hh + WALL_T
  })
  const best = inBounds.sort((a, b) => a.dist - b.dist)[0]
  return best && best.dist < WALL_HIT ? best : null
}

const fromStore = (r: Room): ERoom => ({
  id: r.id, type: r.type,
  cx: r.position[0] * 100, cy: r.position[1] * 100,
  wCm: r.widthCm, hCm: r.lengthCm, rot: r.rotation,
})

// ─── Duvar grafiği yardımcıları ───────────────────────────────────────────────

/** En yakın vertex'i bulur (threshold cm cinsinden) */
function findNearVertex(wx: number, wy: number, vertices: Vertex[], threshold: number): Vertex | null {
  let best: Vertex | null = null
  let bestD = threshold
  for (const v of vertices) {
    const d = Math.hypot(v.x - wx, v.y - wy)
    if (d < bestD) { best = v; bestD = d }
  }
  return best
}

/** Tıklanan noktanın bir duvara uzaklığı + yansıma noktası */
function projectOnWall(
  wx: number, wy: number, wall: Wall, vmap: Map<string,Vertex>
): { dist: number; t: number; px: number; py: number } | null {
  const a = vmap.get(wall.v1); const b = vmap.get(wall.v2)
  if (!a || !b) return null
  const dx = b.x - a.x, dy = b.y - a.y
  const len2 = dx*dx + dy*dy
  if (len2 < 1) return null
  const t = clamp(((wx - a.x) * dx + (wy - a.y) * dy) / len2, 0, 1)
  const px = a.x + t * dx, py = a.y + t * dy
  const dist = Math.hypot(wx - px, wy - py)
  return { dist, t, px, py }
}

/** En yakın duvarı bul (threshold cm içinde) */
function findNearWall(
  wx: number, wy: number, walls: Wall[], vmap: Map<string,Vertex>, threshold: number
): { wall: Wall; t: number; px: number; py: number } | null {
  let best: { wall: Wall; t: number; px: number; py: number } | null = null
  let bestD = threshold
  for (const w of walls) {
    const p = projectOnWall(wx, wy, w, vmap)
    if (!p) continue
    if (p.dist < bestD) { best = { wall: w, t: p.t, px: p.px, py: p.py }; bestD = p.dist }
  }
  return best
}

/** Vertex-duvar komşuluğu — her vertex'in bağlı olduğu (wallId, diğer vertex) listesi */
function buildAdjacency(vertices: Vertex[], walls: Wall[]): Map<string, Array<{wallId:string; other:string}>> {
  const adj = new Map<string, Array<{wallId:string; other:string}>>()
  for (const v of vertices) adj.set(v.id, [])
  for (const w of walls) {
    adj.get(w.v1)?.push({ wallId: w.id, other: w.v2 })
    adj.get(w.v2)?.push({ wallId: w.id, other: w.v1 })
  }
  return adj
}

/**
 * Yeni eklenen duvarı kapatan en kısa döngüyü bul (BFS v2 → v1, newWall hariç).
 * Bulunursa vertex id'leri sırayla döndürür (newWall hariç path, sonra v1 kapatmak için).
 */
function findCycleClosedBy(
  newWall: Wall, vertices: Vertex[], walls: Wall[]
): { vertexIds: string[]; wallIds: string[] } | null {
  const adj = buildAdjacency(vertices, walls)
  // BFS: v2 → v1, newWall'ı kullanma
  const parents = new Map<string, { from: string; wallId: string }>()
  const queue = [newWall.v2]
  const visited = new Set<string>([newWall.v2])
  while (queue.length) {
    const cur = queue.shift()!
    if (cur === newWall.v1 && cur !== newWall.v2) break
    const nbrs = adj.get(cur) ?? []
    for (const { wallId, other } of nbrs) {
      if (wallId === newWall.id) continue
      if (visited.has(other)) continue
      visited.add(other)
      parents.set(other, { from: cur, wallId })
      if (other === newWall.v1) { queue.length = 0; break }
      queue.push(other)
    }
  }
  if (!parents.has(newWall.v1)) return null
  // Path reconstruct: v1 → ... → v2
  const path: string[] = [newWall.v1]
  const wallPath: string[] = []
  let cur = newWall.v1
  while (cur !== newWall.v2) {
    const p = parents.get(cur)
    if (!p) return null
    wallPath.push(p.wallId)
    path.push(p.from)
    cur = p.from
  }
  // path: v1, v_prev, ..., v2 → döngü için newWall'ı ekleyerek kapatalım
  // Aslında döngü vertex listesi: [v1, ..., v2] ve newWall (v1-v2) kapatır
  // wallIds: path'teki duvarlar + newWall
  const vertexIds = path  // CCW/CW bilinmez, sonra düzelteceğiz
  const wallIds = [...wallPath, newWall.id]
  return { vertexIds, wallIds }
}

/**
 * Döngünün 3D export için CCW olup olmadığını kontrol eder.
 *
 * Tek source of truth: `polygonSignedArea` (polygon.ts).
 * Pozitif alan → CCW (Y-up math convention, 3D Shape için doğru).
 *
 * NOT: Editör SVG'de Y-down render eder ama export anlamında "CCW" 3D
 * tarafının beklentisidir. Bu yüzden matematik convention kullanılır —
 * görsel CCW ≠ matematiksel CCW. `ensureCCW` (polygon.ts) da bu convention'la
 * çalışır, round-trip tutarlı.
 */
function isCCW(vertexIds: string[], vmap: Map<string,Vertex>): boolean {
  const pts: [number, number][] = vertexIds
    .map(id => vmap.get(id))
    .filter((v): v is Vertex => !!v)
    .map(v => [v.x, v.y] as [number, number])
  return polygonSignedArea(pts) > 0
}

/** İki nokta arasında 90° yakalaması (başlangıca göre) */
function snapTo90(startX: number, startY: number, x: number, y: number): [number, number] {
  const dx = x - startX, dy = y - startY
  if (Math.abs(dx) > Math.abs(dy)) return [x, startY]
  return [startX, y]
}

// ─── Alt bileşenler ───────────────────────────────────────────────────────────

function GridLines({ sc, pan, vw, vh }: {
  sc: number; pan: {x:number;y:number}; vw: number; vh: number
}) {
  const wx1 = -pan.x / sc, wy1 = -pan.y / sc
  const wx2 = (vw - pan.x) / sc, wy2 = (vh - pan.y) / sc
  const showMinor = GRID * sc >= 5
  const showMajor = MAJOR * sc >= 4
  if (!showMajor) return null

  const lines: React.ReactNode[] = []
  const sw = 1 / sc

  if (showMinor) {
    for (let x = Math.floor(wx1/GRID)*GRID; x <= wx2; x += GRID) {
      if (x % MAJOR === 0) continue
      lines.push(<line key={`v${x}`} x1={x} y1={wy1} x2={x} y2={wy2}
        stroke="#dedbd5" strokeWidth={sw * 0.5} />)
    }
    for (let y = Math.floor(wy1/GRID)*GRID; y <= wy2; y += GRID) {
      if (y % MAJOR === 0) continue
      lines.push(<line key={`h${y}`} x1={wx1} y1={y} x2={wx2} y2={y}
        stroke="#dedbd5" strokeWidth={sw * 0.5} />)
    }
  }
  for (let x = Math.floor(wx1/MAJOR)*MAJOR; x <= wx2; x += MAJOR) {
    lines.push(<line key={`mv${x}`} x1={x} y1={wy1} x2={x} y2={wy2}
      stroke="#c4bfb8" strokeWidth={sw} />)
    lines.push(<text key={`lt${x}`} x={x + 2/sc} y={wy1 + 14/sc}
      fontSize={10/sc} fill="#a09890" style={{userSelect:'none'}}>{x/100}m</text>)
  }
  for (let y = Math.floor(wy1/MAJOR)*MAJOR; y <= wy2; y += MAJOR) {
    lines.push(<line key={`mh${y}`} x1={wx1} y1={y} x2={wx2} y2={y}
      stroke="#c4bfb8" strokeWidth={sw} />)
    if (y !== 0) lines.push(<text key={`lh${y}`} x={wx1 + 3/sc} y={y - 3/sc}
      fontSize={10/sc} fill="#a09890" style={{userSelect:'none'}}>{y/100}m</text>)
  }
  lines.push(<line key="ax" x1={wx1} y1={0} x2={wx2} y2={0} stroke="#e87070" strokeWidth={sw * 1.5} opacity={0.5} />)
  lines.push(<line key="ay" x1={0} y1={wy1} x2={0} y2={wy2} stroke="#70c870" strokeWidth={sw * 1.5} opacity={0.5} />)

  return <g transform={`translate(${pan.x},${pan.y}) scale(${sc})`}>{lines}</g>
}

/** Kapı sembolü (rect oda için) */
function DoorSymbol({ op, room, sc }: { op: EOpening; room: ERoom; sc: number }) {
  const hw = room.wCm / 2, hh = room.hCm / 2
  const walls = {
    top:    { len: room.wCm, bx:-hw, by:-hh, ax:1, ay:0, nx:0, ny:-1 },
    right:  { len: room.hCm, bx:hw,  by:-hh, ax:0, ay:1, nx:1, ny:0  },
    bottom: { len: room.wCm, bx:hw,  by:hh,  ax:-1,ay:0, nx:0, ny:1  },
    left:   { len: room.hCm, bx:-hw, by:hh,  ax:0, ay:-1,nx:-1,ny:0  },
  }
  const w = walls[op.wall]
  const cx = w.bx + op.t * w.len * w.ax
  const cy = w.by + op.t * w.len * w.ay
  const hs = op.swingRight ? 1 : -1
  const hx = cx + hs * (op.wCm / 2) * w.ax
  const hy = cy + hs * (op.wCm / 2) * w.ay
  const fx = hx - hs * op.wCm * w.ax
  const fy = hy - hs * op.wCm * w.ay
  const is = op.swingIn ? 1 : -1
  const ex = hx - hs * op.wCm * w.ax + is * op.wCm * w.nx
  const ey = hy - hs * op.wCm * w.ay + is * op.wCm * w.ny

  const Ax = fx - hx, Ay = fy - hy
  const Bx = ex - hx, By = ey - hy
  const cross = Ax * By - Ay * Bx
  const sweepFlag = cross > 0 ? 1 : 0

  const wpt = (lx: number, ly: number) => {
    const [rx, ry] = rot(lx, ly, room.rot)
    return { x: room.cx + rx, y: room.cy + ry }
  }
  const H = wpt(hx, hy), F = wpt(fx, fy), E = wpt(ex, ey)
  const G1 = wpt(cx - (op.wCm/2) * w.ax, cy - (op.wCm/2) * w.ay)
  const G2 = wpt(cx + (op.wCm/2) * w.ax, cy + (op.wCm/2) * w.ay)
  const gapW = (WALL_T + 4) / sc

  return (
    <g>
      <line x1={G1.x} y1={G1.y} x2={G2.x} y2={G2.y} stroke="white" strokeWidth={gapW} />
      <line x1={H.x} y1={H.y} x2={E.x} y2={E.y} stroke="#2d2d2d" strokeWidth={1.8/sc} />
      <line x1={H.x} y1={H.y} x2={F.x} y2={F.y}
        stroke="#2d2d2d" strokeWidth={0.8/sc} strokeDasharray={`${2/sc},${1.5/sc}`} />
      <path
        d={`M ${F.x} ${F.y} A ${op.wCm} ${op.wCm} 0 0 ${sweepFlag} ${E.x} ${E.y}`}
        fill="none" stroke="#555" strokeWidth={0.9/sc}
        strokeDasharray={`${3/sc},${2/sc}`}
      />
    </g>
  )
}

/** Pencere sembolü (rect oda için) */
function WindowSymbol({ op, room, sc }: { op: EOpening; room: ERoom; sc: number }) {
  const hw = room.wCm / 2, hh = room.hCm / 2
  const walls = {
    top:    { len: room.wCm, bx:-hw, by:-hh, ax:1, ay:0, nx:0, ny:-1 },
    right:  { len: room.hCm, bx:hw,  by:-hh, ax:0, ay:1, nx:1, ny:0  },
    bottom: { len: room.wCm, bx:hw,  by:hh,  ax:-1,ay:0, nx:0, ny:1  },
    left:   { len: room.hCm, bx:-hw, by:hh,  ax:0, ay:-1,nx:-1,ny:0  },
  }
  const w = walls[op.wall]
  const cx = w.bx + op.t * w.len * w.ax
  const cy = w.by + op.t * w.len * w.ay
  const hw2 = op.wCm / 2
  const t2 = WALL_T / 2
  const wpt = (lx: number, ly: number) => {
    const [rx, ry] = rot(lx, ly, room.rot)
    return { x: room.cx + rx, y: room.cy + ry }
  }
  const A1 = wpt(cx - hw2*w.ax - t2*w.nx, cy - hw2*w.ay - t2*w.ny)
  const A2 = wpt(cx + hw2*w.ax - t2*w.nx, cy + hw2*w.ay - t2*w.ny)
  const B1 = wpt(cx - hw2*w.ax,             cy - hw2*w.ay)
  const B2 = wpt(cx + hw2*w.ax,             cy + hw2*w.ay)
  const C1 = wpt(cx - hw2*w.ax + t2*w.nx, cy - hw2*w.ay + t2*w.ny)
  const C2 = wpt(cx + hw2*w.ax + t2*w.nx, cy + hw2*w.ay + t2*w.ny)
  const G1 = wpt(cx - hw2*w.ax, cy - hw2*w.ay)
  const G2 = wpt(cx + hw2*w.ax, cy + hw2*w.ay)
  const gapW = (WALL_T + 4) / sc

  return (
    <g>
      <line x1={G1.x} y1={G1.y} x2={G2.x} y2={G2.y} stroke="white" strokeWidth={gapW} />
      <line x1={A1.x} y1={A1.y} x2={A2.x} y2={A2.y} stroke="#2d2d2d" strokeWidth={1.5/sc} />
      <line x1={B1.x} y1={B1.y} x2={B2.x} y2={B2.y} stroke="#777" strokeWidth={0.8/sc} />
      <line x1={C1.x} y1={C1.y} x2={C2.x} y2={C2.y} stroke="#2d2d2d" strokeWidth={1.5/sc} />
    </g>
  )
}

/** Duvar grafiği kapı sembolü */
function WallDoorSymbol({ op, wall, vmap, sc }: {
  op: WallOp; wall: Wall; vmap: Map<string,Vertex>; sc: number
}) {
  const a = vmap.get(wall.v1); const b = vmap.get(wall.v2)
  if (!a || !b) return null
  const dx = b.x - a.x, dy = b.y - a.y
  const len = Math.hypot(dx, dy)
  if (len < 1) return null
  const ax = dx / len, ay = dy / len      // wall along unit
  const sign = op.flipNormal ? -1 : 1
  const nx = -ay * sign, ny = ax * sign   // wall normal unit
  const cx = a.x + op.t * dx
  const cy = a.y + op.t * dy
  const hs = op.swingRight ? 1 : -1
  const hx = cx + hs * (op.wCm / 2) * ax
  const hy = cy + hs * (op.wCm / 2) * ay
  const fx = hx - hs * op.wCm * ax
  const fy = hy - hs * op.wCm * ay
  const is = op.swingIn ? 1 : -1
  const ex = hx - hs * op.wCm * ax + is * op.wCm * nx
  const ey = hy - hs * op.wCm * ay + is * op.wCm * ny

  const Ax = fx - hx, Ay = fy - hy
  const Bx = ex - hx, By = ey - hy
  const cross = Ax * By - Ay * Bx
  const sweepFlag = cross > 0 ? 1 : 0
  const g1x = cx - (op.wCm/2) * ax, g1y = cy - (op.wCm/2) * ay
  const g2x = cx + (op.wCm/2) * ax, g2y = cy + (op.wCm/2) * ay
  const gapW = (WALL_T + 4) / sc

  return (
    <g>
      <line x1={g1x} y1={g1y} x2={g2x} y2={g2y} stroke="white" strokeWidth={gapW} />
      <line x1={hx} y1={hy} x2={ex} y2={ey} stroke="#2d2d2d" strokeWidth={1.8/sc} />
      <line x1={hx} y1={hy} x2={fx} y2={fy}
        stroke="#2d2d2d" strokeWidth={0.8/sc} strokeDasharray={`${2/sc},${1.5/sc}`} />
      <path
        d={`M ${fx} ${fy} A ${op.wCm} ${op.wCm} 0 0 ${sweepFlag} ${ex} ${ey}`}
        fill="none" stroke="#555" strokeWidth={0.9/sc}
        strokeDasharray={`${3/sc},${2/sc}`}
      />
    </g>
  )
}

/** Duvar grafiği pencere sembolü */
function WallWindowSymbol({ op, wall, vmap, sc }: {
  op: WallOp; wall: Wall; vmap: Map<string,Vertex>; sc: number
}) {
  const a = vmap.get(wall.v1); const b = vmap.get(wall.v2)
  if (!a || !b) return null
  const dx = b.x - a.x, dy = b.y - a.y
  const len = Math.hypot(dx, dy)
  if (len < 1) return null
  const ax = dx / len, ay = dy / len
  const sign = op.flipNormal ? -1 : 1
  const nx = -ay * sign, ny = ax * sign
  const cx = a.x + op.t * dx
  const cy = a.y + op.t * dy
  const hw2 = op.wCm / 2
  const t2 = WALL_T / 2

  const A1x = cx - hw2*ax - t2*nx, A1y = cy - hw2*ay - t2*ny
  const A2x = cx + hw2*ax - t2*nx, A2y = cy + hw2*ay - t2*ny
  const B1x = cx - hw2*ax,          B1y = cy - hw2*ay
  const B2x = cx + hw2*ax,          B2y = cy + hw2*ay
  const C1x = cx - hw2*ax + t2*nx, C1y = cy - hw2*ay + t2*ny
  const C2x = cx + hw2*ax + t2*nx, C2y = cy + hw2*ay + t2*ny
  const gapW = (WALL_T + 4) / sc

  return (
    <g>
      <line x1={B1x} y1={B1y} x2={B2x} y2={B2y} stroke="white" strokeWidth={gapW} />
      <line x1={A1x} y1={A1y} x2={A2x} y2={A2y} stroke="#2d2d2d" strokeWidth={1.5/sc} />
      <line x1={B1x} y1={B1y} x2={B2x} y2={B2y} stroke="#777" strokeWidth={0.8/sc} />
      <line x1={C1x} y1={C1y} x2={C2x} y2={C2y} stroke="#2d2d2d" strokeWidth={1.5/sc} />
    </g>
  )
}

/** Ölçü çizgileri (rect oda için) */
function DimLines({ room, sc }: { room: ERoom; sc: number }) {
  const wpt = (lx: number, ly: number) => {
    const [rx, ry] = rot(lx, ly, room.rot)
    return { x: room.cx + rx, y: room.cy + ry }
  }
  const hw = room.wCm / 2, hh = room.hCm / 2
  const off = WALL_T / 2 + 20
  const tk = 4 / sc, sw = 1 / sc, fs = 11 / sc

  const b1 = wpt(-hw, hh + off), b2 = wpt(hw, hh + off)
  const bm = { x: (b1.x+b2.x)/2, y: (b1.y+b2.y)/2 }
  const r1 = wpt(hw + off, -hh), r2 = wpt(hw + off, hh)
  const rm = { x: (r1.x+r2.x)/2, y: (r1.y+r2.y)/2 }
  const deg = room.rot * 180 / Math.PI

  return (
    <g fill="none" stroke="#2563eb" strokeWidth={sw} style={{pointerEvents:'none'}}>
      <line x1={b1.x} y1={b1.y} x2={b2.x} y2={b2.y} />
      <line x1={wpt(-hw, hh).x} y1={wpt(-hw,hh).y} x2={b1.x} y2={b1.y} strokeDasharray={`${2/sc},${2/sc}`} />
      <line x1={wpt(hw, hh).x} y1={wpt(hw,hh).y} x2={b2.x} y2={b2.y} strokeDasharray={`${2/sc},${2/sc}`} />
      {[-1,1].map(s => {
        const e = wpt(s * hw, hh + off)
        return <line key={s} x1={e.x - tk*Math.sin(room.rot)} y1={e.y + tk*Math.cos(room.rot)}
          x2={e.x + tk*Math.sin(room.rot)} y2={e.y - tk*Math.cos(room.rot)} />
      })}
      <text x={bm.x} y={bm.y} fontSize={fs} fill="#2563eb" stroke="none"
        textAnchor="middle" dominantBaseline="middle"
        transform={`rotate(${deg},${bm.x},${bm.y})`}
        style={{userSelect:'none'}}>
        <tspan dy={-fs * 0.6} style={{filter:'drop-shadow(0 0 2px white)'}}>{room.wCm} cm</tspan>
      </text>
      <line x1={r1.x} y1={r1.y} x2={r2.x} y2={r2.y} />
      <line x1={wpt(hw,-hh).x} y1={wpt(hw,-hh).y} x2={r1.x} y2={r1.y} strokeDasharray={`${2/sc},${2/sc}`} />
      <line x1={wpt(hw,hh).x}  y1={wpt(hw,hh).y}  x2={r2.x} y2={r2.y} strokeDasharray={`${2/sc},${2/sc}`} />
      {[-1,1].map(s => {
        const e = wpt(hw + off, s * hh)
        return <line key={s} x1={e.x + tk*Math.cos(room.rot)} y1={e.y + tk*Math.sin(room.rot)}
          x2={e.x - tk*Math.cos(room.rot)} y2={e.y - tk*Math.sin(room.rot)} />
      })}
      <text x={rm.x} y={rm.y} fontSize={fs} fill="#2563eb" stroke="none"
        textAnchor="middle" dominantBaseline="middle"
        transform={`rotate(${deg + 90},${rm.x},${rm.y})`}
        style={{userSelect:'none'}}>
        <tspan dy={-fs * 0.6}>{room.hCm} cm</tspan>
      </text>
    </g>
  )
}

function ResizeHandles({ room, sc, onDown }: {
  room: ERoom; sc: number; onDown: (handle: string, e: React.PointerEvent) => void
}) {
  const r = HANDLE_R / sc
  const hw = room.wCm / 2, hh = room.hCm / 2
  const handles = [
    { id:'n',  lx:0,   ly:-hh, cursor:'ns-resize' },
    { id:'s',  lx:0,   ly: hh, cursor:'ns-resize' },
    { id:'e',  lx: hw, ly:0,   cursor:'ew-resize' },
    { id:'w',  lx:-hw, ly:0,   cursor:'ew-resize' },
    { id:'ne', lx: hw, ly:-hh, cursor:'nesw-resize' },
    { id:'nw', lx:-hw, ly:-hh, cursor:'nwse-resize' },
    { id:'se', lx: hw, ly: hh, cursor:'nwse-resize' },
    { id:'sw', lx:-hw, ly: hh, cursor:'nesw-resize' },
  ]
  return (
    <g>
      {handles.map(h => {
        const [rx, ry] = rot(h.lx, h.ly, room.rot)
        const wx = room.cx + rx, wy = room.cy + ry
        return (
          <rect key={h.id}
            x={wx - r} y={wy - r} width={r*2} height={r*2}
            fill="white" stroke="#2563eb" strokeWidth={1/sc}
            rx={h.id.length === 2 ? r * 0.5 : 0}
            style={{ cursor: h.cursor }}
            onPointerDown={e => { e.stopPropagation(); onDown(h.id, e) }}
          />
        )
      })}
    </g>
  )
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────
interface Props { onClose: () => void }

export default function AdvancedFloorPlanEditor({ onClose }: Props) {
  const storeRooms    = useDesignStore(s => s.rooms)
  const bpUrl         = useDesignStore(s => s.blueprintUrl)
  const bpScale       = useDesignStore(s => s.blueprintScale)
  const bpOpacity     = useDesignStore(s => s.blueprintOpacity)
  const setBlueprint  = useDesignStore(s => s.setBlueprint)
  const showToast     = useDesignStore(s => s.showToast)
  const activeFloor   = useDesignStore(s => s.activeFloorId)
  const floors        = useDesignStore(s => s.floors)

  // Rect odalar (eski model)
  const [rooms, setRooms]       = useState<ERoom[]>([])
  const [openings, setOpenings] = useState<EOpening[]>([])

  // Duvar grafiği (yeni model)
  const [vertices, setVertices] = useState<Vertex[]>([])
  const [walls, setWalls]       = useState<Wall[]>([])
  const [wallOps, setWallOps]   = useState<WallOp[]>([])
  const [graphRooms, setGraphRooms] = useState<GraphRoom[]>([])

  // Seçim & araç
  const [tool, setTool]         = useState<Tool>('select')
  const [newType, setNewType]   = useState<RoomType>('salon')
  const [selId, setSelId]       = useState<string | null>(null)
  const [selOpId, setSelOpId]   = useState<string | null>(null)
  const [selWallId, setSelWallId] = useState<string | null>(null)
  const [selWallOpId, setSelWallOpId] = useState<string | null>(null)
  const [selGRoomId, setSelGRoomId]   = useState<string | null>(null)

  const [sc, setSc]             = useState(INIT_SC)
  const [pan, setPan]           = useState({ x: 0, y: 0 })
  const [showGrid, setShowGrid] = useState(true)
  const [bgOpacity, setBgOpacity] = useState(bpOpacity)
  const [cursor, setCursor]     = useState('default')
  const [svgSize, setSvgSize]   = useState({ w: 900, h: 600 })

  // Çizim önizlemeleri
  const [newPrev, setNewPrev]   = useState<{x:number;y:number;w:number;h:number} | null>(null)
  const [wallPrev, setWallPrev] = useState<{x1:number;y1:number;x2:number;y2:number} | null>(null)

  // ─── Faz 2: Smart guides + HUD state ────────────────────────────────────────
  const [guides, setGuides] = useState<SnapResult | null>(null)
  const [cursorScreen, setCursorScreen] = useState<{x:number;y:number} | null>(null)
  const [hudLines, setHudLines] = useState<string[]>([])

  // ─── Faz 3: Multi-select + marquee ──────────────────────────────────────────
  const [multiRectIds, setMultiRectIds] = useState<Set<string>>(new Set())
  const [marquee, setMarquee] = useState<{x1:number;y1:number;x2:number;y2:number} | null>(null)
  const altRef = useRef(false)

  // ─── Faz 4: Inline label rename + numeric input ─────────────────────────────
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null)
  const [numericBuffer, setNumericBuffer] = useState<string | null>(null)
  // addWallSegment useCallback'i keydown effect'ten sonra tanımlandığı için ref ile erişiyoruz
  const addWallSegmentRef = useRef<((startVId: string, endX: number, endY: number) => void) | null>(null)

  // ─── Faz 5: Layers + hover + context menu ───────────────────────────────────
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())
  const [hoverRectId, setHoverRectId] = useState<string | null>(null)
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; actions: MenuAction[] } | null>(null)

  // Kapalı döngü algılanınca "odaya çevir" önerisi
  const [pendingCycle, setPendingCycle] = useState<{vertexIds:string[]; wallIds:string[]} | null>(null)

  // Blueprint
  const [bpSize, setBpSize]     = useState<{w:number;h:number} | null>(null)
  const [bpCalib, setBpCalib]   = useState<{ p1:[number,number] | null; p2:[number,number] | null; askDist: boolean }>({ p1: null, p2: null, askDist: false })
  const [calibMode, setCalibMode] = useState(false)

  // Refs
  const svgRef   = useRef<SVGSVGElement>(null)
  const dragRef  = useRef<DragState | null>(null)
  const spaceRef = useRef(false)
  const shiftRef = useRef(false)
  const bpFileRef = useRef<HTMLInputElement>(null)

  // Vertex map (hızlı erişim)
  const vmap = useMemo(() => {
    const m = new Map<string, Vertex>()
    for (const v of vertices) m.set(v.id, v)
    return m
  }, [vertices])

  // ─── Editör-local undo/redo geçmişi ─────────────────────────────────────────
  // Zundo store-level; editör local state'te çalıştığı için ayrı history gerek.
  // 6 state slot'unu tek snapshot'ta atomik tutar.
  interface Snap {
    rooms: ERoom[]; openings: EOpening[]
    vertices: Vertex[]; walls: Wall[]
    wallOps: WallOp[]; graphRooms: GraphRoom[]
  }
  const initialSnap = useMemo<Snap>(() => ({
    rooms: [], openings: [], vertices: [], walls: [], wallOps: [], graphRooms: [],
  }), [])
  const history = useEditorHistory<Snap>(initialSnap)

  // 6 state slot'u değiştikçe snapshot push et (300ms debounce ile)
  useEffect(() => {
    history.push({ rooms, openings, vertices, walls, wallOps, graphRooms })
  }, [rooms, openings, vertices, walls, wallOps, graphRooms, history])

  // Snapshot'ı atomik uygula
  const applySnap = useCallback((s: Snap) => {
    setRooms(s.rooms); setOpenings(s.openings)
    setVertices(s.vertices); setWalls(s.walls)
    setWallOps(s.wallOps); setGraphRooms(s.graphRooms)
  }, [])

  // ─── Faz 5: Fit / zoom helpers ──────────────────────────────────────────────
  const fitBounds = useCallback((
    minX: number, minY: number, maxX: number, maxY: number, padding = 80,
  ) => {
    if (maxX - minX < 1 || maxY - minY < 1) return
    const w = maxX - minX + padding * 2
    const h = maxY - minY + padding * 2
    const newSc = clamp(
      Math.min(svgSize.w / w, svgSize.h / h),
      MIN_SC, MAX_SC,
    )
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    setSc(newSc)
    setPan({ x: svgSize.w / 2 - cx * newSc, y: svgSize.h / 2 - cy * newSc })
  }, [svgSize])

  const fitAll = useCallback(() => {
    const xs: number[] = []
    const ys: number[] = []
    for (const r of rooms) {
      xs.push(r.cx - r.wCm/2, r.cx + r.wCm/2)
      ys.push(r.cy - r.hCm/2, r.cy + r.hCm/2)
    }
    for (const v of vertices) { xs.push(v.x); ys.push(v.y) }
    if (!xs.length) return
    fitBounds(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys))
  }, [rooms, vertices, fitBounds])

  const zoom100 = useCallback(() => {
    setSc(INIT_SC)
    // Merkezi koru — pan'ı svg ortası yap
    setPan({ x: svgSize.w / 2, y: svgSize.h / 2 })
  }, [svgSize])

  const zoomSelection = useCallback(() => {
    const xs: number[] = []
    const ys: number[] = []
    const selIds = new Set<string>(multiRectIds)
    if (selId) selIds.add(selId)
    for (const r of rooms) {
      if (!selIds.has(r.id)) continue
      xs.push(r.cx - r.wCm/2, r.cx + r.wCm/2)
      ys.push(r.cy - r.hCm/2, r.cy + r.hCm/2)
    }
    if (!xs.length) return
    fitBounds(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), 120)
  }, [rooms, selId, multiRectIds, fitBounds])

  // SVG boyutunu izle
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect
      setSvgSize({ w: Math.max(1, width), h: Math.max(1, height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Blueprint boyutunu yükle
  useEffect(() => {
    if (!bpUrl) { setBpSize(null); return }
    // Bug-fix: hızlı URL değişiminde stale onload callback önle (cleanup flag)
    let cancelled = false
    const img = new Image()
    img.onload = () => { if (!cancelled) setBpSize({ w: img.naturalWidth, h: img.naturalHeight }) }
    img.onerror = () => { if (!cancelled) setBpSize(null) }
    img.src = bpUrl
    return () => { cancelled = true }
  }, [bpUrl])

  // Store'dan rect odaları yükle (mount)
  useEffect(() => {
    const floorId = activeFloor
    const onThisFloor = (r: Room) => (r.floorId ?? floors[0]?.id) === floorId
    // Rect odalar
    const loaded = storeRooms
      .filter(r => onThisFloor(r) && r.shape !== 'polygon')
      .map(fromStore)
    setRooms(loaded)

    const loadedOps: EOpening[] = []
    for (const r of storeRooms.filter(r => onThisFloor(r) && r.shape !== 'polygon')) {
      for (const op of r.openings ?? []) {
        if (op.wallIndex !== undefined) continue
        const wall2d = W3D_2D[op.wall]
        if (!wall2d) continue
        loadedOps.push({
          id: op.id, roomId: r.id, wall: wall2d,
          kind: (op.type === 'window' || op.type === 'panoramic') ? 'window' : 'door',
          t: op.positionAlongWall, wCm: op.widthCm,
          swingRight: false, swingIn: true,
        })
      }
    }
    setOpenings(loadedOps)

    // Bug-fix: Polygon odaları da store'dan yeniden inşa et.
    // Eski kod polygon odaları 'shape !== polygon' ile filtreleyip atıyordu →
    // editor kapat+aç'ta polygon odalar kayboluyor + wall graph sıfırlanıyordu.
    const newVertices: Vertex[] = []
    const newWalls: Wall[] = []
    const newGraphRooms: GraphRoom[] = []
    const newWallOps: WallOp[] = []
    for (const r of storeRooms.filter(r => onThisFloor(r) && r.shape === 'polygon' && r.vertices && r.vertices.length >= 3)) {
      const verts = r.vertices!
      // World konumuna rotate + translate ederek vertex'leri döndür
      const [cx, cy] = [r.position[0] * 100, r.position[1] * 100]
      const cosR = Math.cos(r.rotation), sinR = Math.sin(r.rotation)
      const vIds: string[] = []
      for (const [lx, ly] of verts) {
        const worldX = cx + (lx * 100) * cosR - (ly * 100) * sinR
        const worldY = cy + (lx * 100) * sinR + (ly * 100) * cosR
        const v: Vertex = { id: uid('v'), x: worldX, y: worldY }
        newVertices.push(v)
        vIds.push(v.id)
      }
      // Her consecutive vertex çifti bir duvar
      const wIds: string[] = []
      for (let i = 0; i < vIds.length; i++) {
        const v1 = vIds[i], v2 = vIds[(i+1) % vIds.length]
        const w: Wall = { id: uid('w'), v1, v2 }
        newWalls.push(w); wIds.push(w.id)
      }
      newGraphRooms.push({ id: r.id, type: r.type, vertexIds: vIds, wallIds: wIds })
      // Duvar açıklıkları (wallIndex ile)
      for (const op of r.openings ?? []) {
        if (op.wallIndex === undefined || op.wallIndex < 0 || op.wallIndex >= wIds.length) continue
        newWallOps.push({
          id: op.id, wallId: wIds[op.wallIndex],
          kind: (op.type === 'window' || op.type === 'panoramic') ? 'window' : 'door',
          t: op.positionAlongWall, wCm: op.widthCm,
          swingRight: false, swingIn: true, flipNormal: false,
        })
      }
    }
    setVertices(newVertices)
    setWalls(newWalls)
    setGraphRooms(newGraphRooms)
    setWallOps(newWallOps)

    // Seçimi temizle — farklı katın seçimi bu katta yanlış olur
    setSelId(null); setSelOpId(null); setSelWallId(null); setSelWallOpId(null); setSelGRoomId(null)
    setMultiRectIds(new Set())

    // Editor history: floor değişiminde önceki katın geçmişini atıp
    // yüklenen state'i baseline yap
    history.reset({
      rooms: loaded, openings: loadedOps,
      vertices: newVertices, walls: newWalls,
      wallOps: newWallOps, graphRooms: newGraphRooms,
    })
  // Bug-fix: activeFloor değişikliğinde yeniden yükle (FloorTabs ile geçişte
  // editor eski katın state'ini gösteriyordu).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFloor])

  // Pan'ı ilk yüklemede merkeze ayarla
  useEffect(() => {
    if (rooms.length === 0 && vertices.length === 0) return
    const xs = rooms.map(r => r.cx).concat(vertices.map(v => v.x))
    const ys = rooms.map(r => r.cy).concat(vertices.map(v => v.y))
    if (!xs.length) return
    const cx = xs.reduce((a,b)=>a+b,0) / xs.length
    const cy = ys.reduce((a,b)=>a+b,0) / ys.length
    setPan({ x: svgSize.w / 2 - cx * sc, y: svgSize.h / 2 - cy * sc })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms.length > 0])

  // Klavye — Figma-benzeri kısayollar
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable
      if (isInput) return

      // Modifier state
      const mod = e.ctrlKey || e.metaKey

      // Space → pan, modifier'lar
      if (e.code === 'Space') { spaceRef.current = true; e.preventDefault(); return }
      if (e.key === 'Shift') shiftRef.current = true
      if (e.key === 'Alt') altRef.current = true

      // ── Faz 4: Numeric input during wall draw ──────────────────────────────
      if (dragRef.current?.kind === 'drawWall' && !mod && /^[0-9.]$/.test(e.key)) {
        e.preventDefault()
        setNumericBuffer(b => (b ?? '') + e.key)
        return
      }
      if (numericBuffer !== null && e.key === 'Backspace') {
        e.preventDefault()
        setNumericBuffer(b => b && b.length > 1 ? b.slice(0, -1) : null)
        return
      }
      if (numericBuffer !== null && e.key === 'Enter') {
        e.preventDefault()
        const lenCm = parseFloat(numericBuffer)
        // Bug-fix: NaN / Infinity / negatif / 0 guard
        if (!Number.isFinite(lenCm) || lenCm < MIN_WALL || lenCm > 50000) {
          showToast(`Geçersiz uzunluk (${MIN_WALL}–50000 cm)`, 'warning')
          setNumericBuffer(null)
          return
        }
        if (lenCm > 0 && dragRef.current?.kind === 'drawWall' && dragRef.current.vStartId && wallPrev) {
          const sv = vmap.get(dragRef.current.vStartId)
          if (sv) {
            const dx = wallPrev.x2 - sv.x, dy = wallPrev.y2 - sv.y
            const curLen = Math.hypot(dx, dy)
            if (curLen > 0.1) {
              const nx = dx / curLen, ny = dy / curLen
              const endX = sv.x + nx * lenCm
              const endY = sv.y + ny * lenCm
              addWallSegmentRef.current?.(dragRef.current.vStartId, endX, endY)
              dragRef.current = null
              setWallPrev(null)
              setHudLines([]); setCursorScreen(null)
            }
          }
        }
        setNumericBuffer(null)
        return
      }

      // ── Undo / Redo (editör-local, ana app'e yayılmasın) ──────────────────
      if (mod && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        e.preventDefault(); e.stopPropagation()
        const prev = history.undo()
        if (prev) applySnap(prev)
        return
      }
      if (mod && ((e.key === 'y' || e.key === 'Y') || ((e.key === 'z' || e.key === 'Z') && e.shiftKey))) {
        e.preventDefault(); e.stopPropagation()
        const next = history.redo()
        if (next) applySnap(next)
        return
      }

      // ── Ctrl+D: Çoğalt ────────────────────────────────────────────────────
      if (mod && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault()
        const ids = new Set<string>(multiRectIds)
        if (selId) ids.add(selId)
        if (ids.size === 0) return
        const cloneMap = new Map<string, string>()
        setRooms(rs => {
          const clones = rs
            .filter(r => ids.has(r.id))
            .map(src => {
              // Bug-fix: offset room-local eksende → world'e rotate et.
              // Aksi takdirde 45° rotate'li odada klon yanlış yönde çıkar.
              const [ox, oy] = rot(40, 40, src.rot)
              const clone: ERoom = { ...src, id: uid('r'), cx: src.cx + ox, cy: src.cy + oy }
              cloneMap.set(src.id, clone.id)
              return clone
            })
          return [...rs, ...clones]
        })
        setOpenings(os => [
          ...os,
          ...os
            .filter(o => ids.has(o.roomId))
            .map(o => ({ ...o, id: uid('o'), roomId: cloneMap.get(o.roomId)! })),
        ])
        // Klonları seç
        const cloneIds = new Set(cloneMap.values())
        setMultiRectIds(cloneIds)
        setSelId(null)
        showToast(`${ids.size} oda çoğaltıldı`, 'success')
        return
      }

      // ── Faz 5: Fit / zoom kısayolları ──────────────────────────────────────
      if (!mod && !e.shiftKey && !e.altKey) {
        if (e.key === 'f' || e.key === 'F' || e.key === '0') { e.preventDefault(); fitAll(); return }
        if (e.key === '1') { e.preventDefault(); zoom100(); return }
        if (e.key === '2') { e.preventDefault(); zoomSelection(); return }
      }

      // Bug-fix: Tool değişince drag state'i temizle (çakışma önlemi)
      const switchTool = (t: Tool) => {
        if (dragRef.current) {
          dragRef.current = null
          setWallPrev(null); setNewPrev(null)
          setGuides(null); setHudLines([]); setCursorScreen(null)
          setMarquee(null)
        }
        setNumericBuffer(null)
        setTool(t)
      }

      // ── Araç kısayolları (modifier yok) ───────────────────────────────────
      if (!mod && !e.shiftKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'v': switchTool('select');    return
          case 'r': {
            // R: seçili rect varsa 90° döndür; yoksa Rect tool'a geç
            const targetIds = new Set<string>(multiRectIds)
            if (selId) targetIds.add(selId)
            if (targetIds.size > 0) {
              setRooms(rs => rs.map(r =>
                targetIds.has(r.id) ? { ...r, rot: normalizeAngle(r.rot + Math.PI/2) } : r
              ))
            } else {
              switchTool('addRect')
            }
            return
          }
          case 'w': switchTool('drawWall');  return
          case 'd': switchTool('addDoor');   return
          case 'o': switchTool('addWindow'); return
        }
      }

      // ── Shift+R: -90° ──────────────────────────────────────────────────────
      if (!mod && e.shiftKey && (e.key === 'R' || e.key === 'r')) {
        const targetIds = new Set<string>(multiRectIds)
        if (selId) targetIds.add(selId)
        if (targetIds.size > 0) {
          setRooms(rs => rs.map(r =>
            targetIds.has(r.id) ? { ...r, rot: normalizeAngle(r.rot - Math.PI/2) } : r
          ))
        }
        return
      }

      // ── Ok tuşları: seçili rect'leri taşı ──────────────────────────────────
      if (!mod && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        const targetIds = new Set<string>(multiRectIds)
        if (selId) targetIds.add(selId)
        if (targetIds.size === 0) return
        e.preventDefault()
        const step = e.shiftKey ? 1 : 10  // Shift = 1cm ince, normal = 10cm
        let dx = 0, dy = 0
        switch (e.key) {
          case 'ArrowLeft':  dx = -step; break
          case 'ArrowRight': dx =  step; break
          case 'ArrowUp':    dy = -step; break
          case 'ArrowDown':  dy =  step; break
        }
        setRooms(rs => rs.map(r =>
          targetIds.has(r.id) ? { ...r, cx: r.cx + dx, cy: r.cy + dy } : r
        ))
        return
      }

      // ── Escape: aktif çizimi iptal + seçimi temizle + select'e dön ─────────
      if (e.key === 'Escape') {
        setSelId(null); setSelOpId(null); setSelWallId(null); setSelWallOpId(null); setSelGRoomId(null)
        setMultiRectIds(new Set())
        setMarquee(null)
        setPendingCycle(null)
        setEditingLabelId(null)
        setNumericBuffer(null)
        setCtxMenu(null)
        // Bug-fix: tüm drag kind'larını temizle (sadece drawWall+marquee değil)
        dragRef.current = null
        setWallPrev(null); setNewPrev(null)
        setGuides(null); setHudLines([]); setCursorScreen(null)
        if (tool !== 'select') setTool('select')
        return
      }

      // ── Sil (Delete / Backspace) ──────────────────────────────────────────
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Multi-select sil
        if (multiRectIds.size > 0) {
          const ids = multiRectIds
          setRooms(rs => rs.filter(r => !ids.has(r.id)))
          setOpenings(os => os.filter(o => !ids.has(o.roomId)))
          setMultiRectIds(new Set())
          return
        }
        if (selId) {
          setRooms(rs => rs.filter(r => r.id !== selId))
          setOpenings(os => os.filter(o => o.roomId !== selId))
          setSelId(null)
        }
        if (selOpId) {
          setOpenings(os => os.filter(o => o.id !== selOpId))
          setSelOpId(null)
        }
        if (selWallId) {
          setWalls(ws => ws.filter(w => w.id !== selWallId))
          setWallOps(ops => ops.filter(o => o.wallId !== selWallId))
          setGraphRooms(rs => rs.filter(r => !r.wallIds.includes(selWallId)))
          setSelWallId(null)
        }
        if (selWallOpId) {
          setWallOps(os => os.filter(o => o.id !== selWallOpId))
          setSelWallOpId(null)
        }
        if (selGRoomId) {
          setGraphRooms(rs => rs.filter(r => r.id !== selGRoomId))
          setSelGRoomId(null)
        }
      }
    }
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') spaceRef.current = false
      if (e.key === 'Shift') shiftRef.current = false
      if (e.key === 'Alt') altRef.current = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [selId, selOpId, selWallId, selWallOpId, selGRoomId, multiRectIds, tool, history, applySnap, showToast, numericBuffer, wallPrev, vmap, fitAll, zoom100, zoomSelection])

  // SVG koordinatları
  const getSVGCoords = useCallback((e: React.PointerEvent) => {
    const rect = svgRef.current!.getBoundingClientRect()
    return { sx: e.clientX - rect.left, sy: e.clientY - rect.top }
  }, [])

  // Tekerlek zoom — native listener (React onWheel passive default, preventDefault çalışmaz)
  // Ctrl+wheel browser zoom'unu + page scroll'u engellemek için passive:false zorunlu
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()   // Ctrl+wheel browser zoom + page scroll engeli
      const rect = el.getBoundingClientRect()
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
      setSc(prev => {
        const newSc = clamp(prev * factor, MIN_SC, MAX_SC)
        setPan(p => ({
          x: sx - (sx - p.x) * (newSc / prev),
          y: sy - (sy - p.y) * (newSc / prev),
        }))
        return newSc
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // Duvar grafiğine yeni duvar ekle + döngü kontrolü
  // Not: addWallSegmentRef keydown effect'te kullanılıyor (yukarıda tanımlı)
  const addWallSegment = useCallback((startVId: string, endX: number, endY: number) => {
    const snapped = findNearVertex(endX, endY, vertices, V_SNAP)
    let endId: string
    let newVertices = vertices
    if (snapped && snapped.id !== startVId) {
      endId = snapped.id
    } else {
      const newV: Vertex = { id: uid('v'), x: snap(endX, GRID), y: snap(endY, GRID) }
      endId = newV.id
      newVertices = [...vertices, newV]
      setVertices(newVertices)
    }
    // Aynı iki vertex arasında duvar varsa yoksay
    if (walls.some(w =>
      (w.v1 === startVId && w.v2 === endId) || (w.v1 === endId && w.v2 === startVId))) {
      return { endId, newWall: null }
    }
    const newWall: Wall = { id: uid('w'), v1: startVId, v2: endId }
    const newWalls = [...walls, newWall]
    setWalls(newWalls)
    // Döngü algıla
    const cycle = findCycleClosedBy(newWall, newVertices, newWalls)
    if (cycle) setPendingCycle(cycle)
    return { endId, newWall }
  }, [vertices, walls])

  // addWallSegmentRef'e son callback'i yaz (keydown numeric input handler için)
  useEffect(() => { addWallSegmentRef.current = addWallSegment }, [addWallSegment])

  // Sağ tık: en yakın duvarı böl; yoksa seçime göre context menu aç
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const rect = svgRef.current!.getBoundingClientRect()
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top
    const { x: wx, y: wy } = s2w(sx, sy, pan, sc)
    const hit = findNearWall(wx, wy, walls, vmap, WALL_SPLIT_HIT)
    if (!hit) {
      // Faz 5: Context menu — seçime göre aksiyonlar
      // Hangi rect üzerine tıklandı?
      let hoveredRectId: string | null = null
      for (const r of [...rooms].reverse()) {
        if (inRoom(wx, wy, r, true)) { hoveredRectId = r.id; break }
      }
      const targetIds = new Set<string>()
      if (hoveredRectId) {
        // Eğer tıklanan rect multi-select'te ise tüm multi üstünde açılsın;
        // değilse sadece üstündeki rect seçilir + menu o rect için açılır
        if (multiRectIds.has(hoveredRectId)) {
          for (const id of multiRectIds) targetIds.add(id)
        } else {
          targetIds.add(hoveredRectId)
          setSelId(hoveredRectId); setMultiRectIds(new Set())
        }
      } else if (selId) targetIds.add(selId)
      else for (const id of multiRectIds) targetIds.add(id)

      if (targetIds.size === 0) return

      const actions: MenuAction[] = []
      actions.push({
        id: 'duplicate', icon: '⎘', label: 'Çoğalt', shortcut: 'Ctrl+D',
        onClick: () => {
          const cloneMap = new Map<string, string>()
          setRooms(rs => {
            const clones = rs.filter(r => targetIds.has(r.id)).map(src => {
              // Bug-fix: offset room-local eksende → world'e rotate et.
              // Aksi takdirde 45° rotate'li odada klon yanlış yönde çıkar.
              const [ox, oy] = rot(40, 40, src.rot)
              const clone: ERoom = { ...src, id: uid('r'), cx: src.cx + ox, cy: src.cy + oy }
              cloneMap.set(src.id, clone.id); return clone
            })
            return [...rs, ...clones]
          })
          setOpenings(os => [...os, ...os.filter(o => targetIds.has(o.roomId)).map(o =>
            ({ ...o, id: uid('o'), roomId: cloneMap.get(o.roomId)! }))])
          setMultiRectIds(new Set(cloneMap.values()))
          setSelId(null)
        },
      })
      actions.push({
        id: 'rotate90', icon: '↻', label: 'Döndür 90°', shortcut: 'R',
        onClick: () => setRooms(rs => rs.map(r =>
          targetIds.has(r.id) ? { ...r, rot: r.rot + Math.PI/2 } : r)),
      })
      if (targetIds.size >= 2) {
        actions.push({ id: 'separator', label: '', onClick: () => {} })
        actions.push({
          id: 'align-left', icon: '⫮', label: 'Sola Hizala',
          onClick: () => {
            const list = rooms.filter(r => targetIds.has(r.id))
            const minL = Math.min(...list.map(r => r.cx - r.wCm/2))
            setRooms(rs => rs.map(r => targetIds.has(r.id) ? { ...r, cx: minL + r.wCm/2 } : r))
          },
        })
        actions.push({
          id: 'align-right', icon: '⫯', label: 'Sağa Hizala',
          onClick: () => {
            const list = rooms.filter(r => targetIds.has(r.id))
            const maxR = Math.max(...list.map(r => r.cx + r.wCm/2))
            setRooms(rs => rs.map(r => targetIds.has(r.id) ? { ...r, cx: maxR - r.wCm/2 } : r))
          },
        })
        actions.push({
          id: 'align-top', icon: '⫰', label: 'Üste Hizala',
          onClick: () => {
            const list = rooms.filter(r => targetIds.has(r.id))
            const minT = Math.min(...list.map(r => r.cy - r.hCm/2))
            setRooms(rs => rs.map(r => targetIds.has(r.id) ? { ...r, cy: minT + r.hCm/2 } : r))
          },
        })
        actions.push({
          id: 'align-bottom', icon: '⫱', label: 'Alta Hizala',
          onClick: () => {
            const list = rooms.filter(r => targetIds.has(r.id))
            const maxB = Math.max(...list.map(r => r.cy + r.hCm/2))
            setRooms(rs => rs.map(r => targetIds.has(r.id) ? { ...r, cy: maxB - r.hCm/2 } : r))
          },
        })
        actions.push({
          id: 'align-cx', icon: '⫲', label: 'Merkez X Hizala',
          onClick: () => {
            const list = rooms.filter(r => targetIds.has(r.id))
            const avg = list.reduce((s, r) => s + r.cx, 0) / list.length
            setRooms(rs => rs.map(r => targetIds.has(r.id) ? { ...r, cx: avg } : r))
          },
        })
        actions.push({
          id: 'align-cy', icon: '⫳', label: 'Merkez Y Hizala',
          onClick: () => {
            const list = rooms.filter(r => targetIds.has(r.id))
            const avg = list.reduce((s, r) => s + r.cy, 0) / list.length
            setRooms(rs => rs.map(r => targetIds.has(r.id) ? { ...r, cy: avg } : r))
          },
        })
      }
      actions.push({ id: 'separator', label: '', onClick: () => {} })
      actions.push({
        id: 'delete', icon: '🗑', label: 'Sil', shortcut: 'Del', danger: true,
        onClick: () => {
          setRooms(rs => rs.filter(r => !targetIds.has(r.id)))
          setOpenings(os => os.filter(o => !targetIds.has(o.roomId)))
          setMultiRectIds(new Set()); setSelId(null)
        },
      })

      setCtxMenu({ x: e.clientX, y: e.clientY, actions })
      return
    }
    // Bug-fix: endpoint yakınında split etme (duplicate vertex + /0 riski)
    const wA = vmap.get(hit.wall.v1); const wB = vmap.get(hit.wall.v2)
    if (!wA || !wB) return
    const wallLen = Math.hypot(wB.x - wA.x, wB.y - wA.y)
    const distToA = Math.hypot(hit.px - wA.x, hit.py - wA.y)
    const distToB = Math.hypot(hit.px - wB.x, hit.py - wB.y)
    // 5 cm'den yakınsa endpoint'e — split etmeyi reddet
    if (wallLen < MIN_WALL || distToA < 5 || distToB < 5) {
      showToast('Bölme noktası duvar ucuna çok yakın', 'warning')
      return
    }
    // Yeni vertex
    const nv: Vertex = { id: uid('v'), x: hit.px, y: hit.py }
    // Duvarı ikiye böl
    const w = hit.wall
    const w1: Wall = { id: uid('w'), v1: w.v1, v2: nv.id }
    const w2: Wall = { id: uid('w'), v1: nv.id, v2: w.v2 }
    setVertices(vs => [...vs, nv])
    setWalls(ws => ws.flatMap(x => x.id === w.id ? [w1, w2] : [x]))
    // Bu duvarı kullanan graphRoom'ları güncelle
    setGraphRooms(rs => rs.map(room => {
      const idx = room.wallIds.indexOf(w.id)
      if (idx < 0) return room
      // vertexIds[idx] → vertexIds[idx+1] arası w duvarı; arada nv olacak
      const newWallIds = [...room.wallIds]
      const newVertexIds = [...room.vertexIds]
      const nextIdx = (idx + 1) % room.vertexIds.length
      // Yön: w.v1 === vertexIds[idx] ise w1, w2 sırası doğru; değilse ters
      if (room.vertexIds[idx] === w.v1) {
        newWallIds.splice(idx, 1, w1.id, w2.id)
        newVertexIds.splice(nextIdx, 0, nv.id)
      } else {
        newWallIds.splice(idx, 1, w2.id, w1.id)
        newVertexIds.splice(nextIdx, 0, nv.id)
      }
      return { ...room, wallIds: newWallIds, vertexIds: newVertexIds }
    }))
    // Açıklıklar: hangi yarıya düşüyorsa ona ata, t'yi yeniden hesapla
    // Bug-fix: splitT 0/1'e çok yakınsa /0 olur; guard üstte zaten var ama
    // defensive programming ile burada da clamp(0.01, 0.99) uygula
    setWallOps(ops => ops.map(o => {
      if (o.wallId !== w.id) return o
      const splitT = Math.max(0.01, Math.min(0.99, distToA / wallLen))
      if (o.t < splitT) {
        return { ...o, wallId: w1.id, t: clamp(o.t / splitT, 0.05, 0.95) }
      } else {
        return { ...o, wallId: w2.id, t: clamp((o.t - splitT) / (1 - splitT), 0.05, 0.95) }
      }
    }))
    showToast('Duvar bölündü', 'info')
  }, [pan, sc, walls, vmap, showToast, rooms, multiRectIds, selId])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Bug-fix: pointerCapture — cursor SVG dışına çıksa bile pointerMove devam etsin
    // (body scroll tetiklemesin, drag bozulmasın)
    try { (e.currentTarget as Element).setPointerCapture(e.pointerId) } catch { /* noop */ }
    if (e.button === 1 || spaceRef.current) {
      const { sx, sy } = getSVGCoords(e)
      dragRef.current = { kind: 'pan', sx0: sx, sy0: sy, wx0: pan.x, wy0: pan.y }
      setCursor('grabbing')
      return
    }
    if (e.button !== 0) return
    const { sx, sy } = getSVGCoords(e)
    const { x: wx, y: wy } = s2w(sx, sy, pan, sc)

    // Kroki kalibrasyon modu
    if (calibMode) {
      if (!bpCalib.p1) setBpCalib({ p1: [wx, wy], p2: null, askDist: false })
      else if (!bpCalib.p2) setBpCalib({ p1: bpCalib.p1, p2: [wx, wy], askDist: true })
      return
    }

    // drawWall: duvar grafiği çizimi
    if (tool === 'drawWall') {
      const existing = findNearVertex(wx, wy, vertices, V_SNAP)
      let startVId: string
      if (existing) {
        startVId = existing.id
      } else {
        const nv: Vertex = { id: uid('v'), x: snap(wx, GRID), y: snap(wy, GRID) }
        setVertices(vs => [...vs, nv])
        startVId = nv.id
      }
      dragRef.current = {
        kind: 'drawWall', sx0: sx, sy0: sy, wx0: wx, wy0: wy, vStartId: startVId,
      }
      const sv = existing ?? { x: snap(wx, GRID), y: snap(wy, GRID) }
      setWallPrev({ x1: sv.x, y1: sv.y, x2: sv.x, y2: sv.y })
      return
    }

    if (tool === 'addRect') {
      const snx = snap(wx, GRID), sny = snap(wy, GRID)
      dragRef.current = { kind: 'new', sx0: sx, sy0: sy, wx0: snx, wy0: sny }
      return
    }

    if (tool === 'addDoor' || tool === 'addWindow') {
      // Önce duvar grafiğine bak
      const hit = findNearWall(wx, wy, walls, vmap, WALL_HIT)
      if (hit) {
        const op: WallOp = {
          id: uid('o'), wallId: hit.wall.id, kind: tool === 'addDoor' ? 'door' : 'window',
          t: clamp(hit.t, 0.05, 0.95), wCm: tool === 'addDoor' ? 90 : 120,
          swingRight: false, swingIn: true, flipNormal: false,
        }
        setWallOps(os => [...os, op])
        setSelWallOpId(op.id); setSelOpId(null)
        return
      }
      // Yoksa rect odalara bak
      for (const room of [...rooms].reverse()) {
        if (!inRoom(wx, wy, room, true)) continue
        const found = findWall(wx, wy, room)
        if (!found) continue
        const op: EOpening = {
          id: uid('o'), roomId: room.id, kind: tool === 'addDoor' ? 'door' : 'window',
          wall: found.wall, t: found.t,
          wCm: tool === 'addDoor' ? 90 : 120, swingRight: false, swingIn: true,
        }
        setOpenings(os => [...os, op])
        setSelOpId(op.id); setSelWallOpId(null)
        return
      }
      return
    }

    // select modu
    // 1) Vertex'e tıklama → sürükle
    const hitV = findNearVertex(wx, wy, vertices, V_SNAP)
    if (hitV) {
      dragRef.current = {
        kind: 'vertex', sx0: sx, sy0: sy, wx0: wx, wy0: wy, vertexId: hitV.id,
      }
      return
    }
    // 2) WallOp'a tıklama
    for (const op of wallOps) {
      const w = walls.find(x => x.id === op.wallId); if (!w) continue
      const a = vmap.get(w.v1); const b = vmap.get(w.v2); if (!a || !b) continue
      const cx = a.x + op.t * (b.x - a.x); const cy = a.y + op.t * (b.y - a.y)
      if (Math.hypot(cx - wx, cy - wy) < op.wCm / 2) {
        setSelWallOpId(op.id); setSelId(null); setSelOpId(null); setSelWallId(null); setSelGRoomId(null)
        return
      }
    }
    // 3) Duvara tıklama
    const hitW = findNearWall(wx, wy, walls, vmap, WALL_HIT)
    if (hitW) {
      setSelWallId(hitW.wall.id); setSelId(null); setSelOpId(null); setSelWallOpId(null); setSelGRoomId(null)
      return
    }
    // 4) Rect oda açıklığı
    for (const op of openings) {
      const room = rooms.find(r => r.id === op.roomId)
      if (!room) continue
      if (inRoom(wx, wy, room, true) && !inRoom(wx, wy, room, false)) {
        setSelOpId(op.id); setSelId(null); setSelWallId(null); setSelWallOpId(null); setSelGRoomId(null)
        return
      }
    }
    // 5) Rect odaya tıkla → seç + sürükle (Shift → multi-select extend, Alt → duplicate+drag)
    for (const room of [...rooms].reverse()) {
      if (inRoom(wx, wy, room, true)) {
        // Kilitli odalar sadece seçilebilir, sürüklenemez
        if (room.locked && !e.shiftKey && !e.altKey && !altRef.current) {
          setSelId(room.id); setSelOpId(null); setSelWallId(null); setSelWallOpId(null); setSelGRoomId(null)
          setMultiRectIds(new Set())
          return
        }
        // Shift → multi-select toggle
        if (e.shiftKey) {
          setMultiRectIds(prev => {
            const next = new Set(prev)
            if (next.has(room.id)) next.delete(room.id)
            else next.add(room.id)
            // selId varsa multi'ye dahil et
            if (selId && !next.has(selId)) next.add(selId)
            return next
          })
          setSelId(null); setSelOpId(null); setSelWallId(null); setSelWallOpId(null); setSelGRoomId(null)
          return
        }
        // Alt → duplicate-and-drag
        if (altRef.current || e.altKey) {
          const clone: ERoom = { ...room, id: uid('r') }
          setRooms(rs => [...rs, clone])
          // Clone ait openings
          setOpenings(os => [
            ...os,
            ...os.filter(o => o.roomId === room.id).map(o => ({ ...o, id: uid('o'), roomId: clone.id })),
          ])
          setSelId(clone.id); setSelOpId(null); setSelWallId(null); setSelWallOpId(null); setSelGRoomId(null)
          setMultiRectIds(new Set())
          dragRef.current = {
            kind: 'move', sx0: sx, sy0: sy, wx0: wx, wy0: wy,
            roomId: clone.id, initCx: clone.cx, initCy: clone.cy, cloneDrag: true,
          }
          return
        }
        // Normal seç + sürükle. Multi-select'te sürüklenen de dahilse tüm grubu taşı
        const isPartOfMulti = multiRectIds.has(room.id)
        if (isPartOfMulti && multiRectIds.size > 1) {
          // Multi-move: tüm seçili odaların başlangıç pozisyonlarını kaydet
          const initPos = new Map<string, { cx: number; cy: number }>()
          for (const r of rooms) if (multiRectIds.has(r.id)) initPos.set(r.id, { cx: r.cx, cy: r.cy })
          dragRef.current = {
            kind: 'move', sx0: sx, sy0: sy, wx0: wx, wy0: wy,
            roomId: room.id, initCx: room.cx, initCy: room.cy,
            initPositions: initPos,
          }
          return
        }
        setSelId(room.id); setSelOpId(null); setSelWallId(null); setSelWallOpId(null); setSelGRoomId(null)
        setMultiRectIds(new Set())
        dragRef.current = {
          kind: 'move', sx0: sx, sy0: sy, wx0: wx, wy0: wy,
          roomId: room.id, initCx: room.cx, initCy: room.cy,
        }
        return
      }
    }
    // 6) Polygon oda içi → seç
    for (const gr of graphRooms) {
      if (pointInPolygon(wx, wy, gr.vertexIds.map(id => vmap.get(id)!))) {
        setSelGRoomId(gr.id); setSelId(null); setSelOpId(null); setSelWallId(null); setSelWallOpId(null)
        setMultiRectIds(new Set())
        return
      }
    }
    // 7) Boş alan — Ctrl basılıysa marquee başlat, değilse seçim temizle
    if (e.ctrlKey || e.metaKey) {
      dragRef.current = { kind: 'marquee', sx0: sx, sy0: sy, wx0: wx, wy0: wy }
      setMarquee({ x1: wx, y1: wy, x2: wx, y2: wy })
      return
    }
    setSelId(null); setSelOpId(null); setSelWallId(null); setSelWallOpId(null); setSelGRoomId(null)
    setMultiRectIds(new Set())
  }, [tool, rooms, openings, pan, sc, getSVGCoords, vertices, walls, vmap, wallOps, graphRooms, calibMode, bpCalib, selId, multiRectIds])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current
    // Faz 5: Hover highlight (drag yokken, select tool'unda)
    if (!d && tool === 'select') {
      const { sx, sy } = getSVGCoords(e)
      const { x: wx, y: wy } = s2w(sx, sy, pan, sc)
      let hit: string | null = null
      for (const r of [...rooms].reverse()) {
        if (inRoom(wx, wy, r, true)) { hit = r.id; break }
      }
      if (hit !== hoverRectId) setHoverRectId(hit)
    }
    if (!d) return
    const { sx, sy } = getSVGCoords(e)
    setCursorScreen({ x: e.clientX, y: e.clientY })

    if (d.kind === 'pan') {
      setPan({ x: d.wx0 + (sx - d.sx0), y: d.wy0 + (sy - d.sy0) })
      return
    }
    const { x: wx, y: wy } = s2w(sx, sy, pan, sc)

    // Smart snap eşiği — ekranda sabit 6px, zoom'a göre cm'e çevir
    const snapThreshold = 6 / sc

    if (d.kind === 'drawWall' && d.vStartId) {
      const sv = vmap.get(d.vStartId)
      if (!sv) return
      let ex = snap(wx, GRID), ey = snap(wy, GRID)
      // 1. Var olan vertex'e snap (güçlü — 25cm)
      const hitV = findNearVertex(wx, wy, vertices.filter(v => v.id !== d.vStartId), V_SNAP)
      if (hitV) { ex = hitV.x; ey = hitV.y }
      // 2. Shift → 90°
      else if (shiftRef.current) {
        const [sx2, sy2] = snapTo90(sv.x, sv.y, ex, ey)
        ex = sx2; ey = sy2
      }
      setWallPrev({ x1: sv.x, y1: sv.y, x2: ex, y2: ey })
      // HUD: canlı uzunluk (veya numeric input aktifse onu göster)
      const len = Math.round(Math.hypot(ex - sv.x, ey - sv.y))
      if (numericBuffer !== null) {
        setHudLines([`${numericBuffer} cm ✏`, `Enter = kilitle · Backspace = sil`])
      } else {
        setHudLines([`${len} cm`, `${(len/100).toFixed(2)} m · Yaz: tam uzunluk kilitle`])
      }
      d.moved = true
      return
    }

    if (d.kind === 'vertex' && d.vertexId) {
      // Smart snap: mevcut vertex'leri ve rect kenarlarını hedefler
      const snappedX = snap(wx, GRID), snappedY = snap(wy, GRID)
      const snapTargets = collectSnapTargets(d.vertexId, rooms, vertices.filter(v => v.id !== d.vertexId))
      const snapRes = findPointSnap(snappedX, snappedY, snapTargets, snapThreshold)
      const finalX = snappedX + snapRes.dx
      const finalY = snappedY + snapRes.dy
      setVertices(vs => vs.map(v =>
        v.id === d.vertexId ? { ...v, x: finalX, y: finalY } : v
      ))
      setGuides(snapRes)
      setHudLines([`Δ ${finalX - d.wx0 >= 0 ? '+' : ''}${Math.round(finalX - d.wx0)} × ${finalY - d.wy0 >= 0 ? '+' : ''}${Math.round(finalY - d.wy0)} cm`])
      return
    }

    if (d.kind === 'new') {
      const snx = snap(wx, GRID), sny = snap(wy, GRID)
      const x = Math.min(d.wx0, snx), y = Math.min(d.wy0, sny)
      const w = Math.max(MIN_ROOM, Math.abs(snx - d.wx0))
      const h = Math.max(MIN_ROOM, Math.abs(sny - d.wy0))
      setNewPrev({ x, y, w, h })
      setHudLines([`W ${w} × H ${h}`, `${(w/100).toFixed(2)}m × ${(h/100).toFixed(2)}m`])
      return
    }

    if (d.kind === 'move' && d.roomId) {
      const dx = wx - d.wx0, dy = wy - d.wy0
      const tCx = snap(d.initCx! + dx, GRID)
      const tCy = snap(d.initCy! + dy, GRID)
      // Smart snap: sürüklenen rect'in bounds'u başka rect kenarları + vertex'ler ile karşılaştır
      const room = rooms.find(r => r.id === d.roomId)!
      // Multi-move varsa snap'i lider odaya uygula, diğerleri aynı delta ile gitsin
      const excludeIds = d.initPositions ? new Set(d.initPositions.keys()) : new Set<string>([d.roomId])
      const bounds = {
        left: tCx - room.wCm / 2, right: tCx + room.wCm / 2,
        top:  tCy - room.hCm / 2, bottom: tCy + room.hCm / 2,
        cx: tCx, cy: tCy,
      }
      const snapTargets: SnapTarget[] = collectSnapTargets(d.roomId, rooms.filter(r => !excludeIds.has(r.id)), vertices)
      const snapRes = findSmartSnap(bounds, snapTargets, snapThreshold)
      const finalCx = tCx + snapRes.dx
      const finalCy = tCy + snapRes.dy
      // Delta lider odadan hesaplanır, tüm multi-selection aynı delta ile gider
      const dCx = finalCx - d.initCx!
      const dCy = finalCy - d.initCy!
      if (d.initPositions) {
        const positions = d.initPositions
        setRooms(rs => rs.map(r => {
          const init = positions.get(r.id)
          if (!init) return r
          return { ...r, cx: init.cx + dCx, cy: init.cy + dCy }
        }))
        setHudLines([`${positions.size} oda`, `Δ ${dCx >= 0 ? '+' : ''}${dCx} × ${dCy >= 0 ? '+' : ''}${dCy} cm`])
      } else {
        setRooms(rs => rs.map(r => r.id === d.roomId ? { ...r, cx: finalCx, cy: finalCy } : r))
        setHudLines([`W ${room.wCm} × H ${room.hCm}`, `Pozisyon ${(finalCx/100).toFixed(2)}, ${(finalCy/100).toFixed(2)} m`])
      }
      setGuides(snapRes)
      return
    }

    if (d.kind === 'rotate' && d.roomId) {
      const room = rooms.find(r => r.id === d.roomId)
      if (!room) return
      const a = Math.atan2(wy - room.cy, wx - room.cx)
      let newRot = d.initRot! + (a - d.a0!)
      // Shift yoksa 5° snap
      if (!shiftRef.current) {
        const step = Math.PI / 36   // 5°
        newRot = Math.round(newRot / step) * step
      }
      // Bug-fix: biriken rotation'u [-π, π]'e normalize et (float precision)
      newRot = normalizeAngle(newRot)
      setRooms(rs => rs.map(r => r.id === d.roomId ? { ...r, rot: newRot } : r))
      const deg = Math.round(newRot * 180 / Math.PI)
      setHudLines([`${deg}°`, shiftRef.current ? 'Serbest döndür' : '5° snap · Shift = serbest'])
      return
    }

    if (d.kind === 'marquee') {
      setMarquee({ x1: d.wx0, y1: d.wy0, x2: wx, y2: wy })
      setHudLines([
        `${Math.round(Math.abs(wx - d.wx0))} × ${Math.round(Math.abs(wy - d.wy0))} cm`,
        'Ctrl+sürükle · içerideki odalar seçilir',
      ])
      return
    }

    if (d.kind === 'resize' && d.roomId && d.handle) {
      const room = rooms.find(r => r.id === d.roomId)!
      const [ldx, ldy] = rot(wx - d.wx0, wy - d.wy0, -room.rot)
      const h = d.handle
      const hDir = h.includes('e') ? 1 : h.includes('w') ? -1 : 0
      const vDir = h.includes('s') ? 1 : h.includes('n') ? -1 : 0
      // Bug-fix: Anchor-based resize (Figma/CAD standardı):
      // Tutulan köşe/kenar hareket eder, KARŞI köşe/kenar sabit kalır.
      // Eski kod `* 2` ile center-based simetrik resize yapıyordu (iki yöndan büyüme).
      // Yeni: wCm delta'nın yarısı kadar merkezi handle yönüne kaydır → karşı kenar sabit.
      let wCm = d.initW!, hCm = d.initH!
      let localDCx = 0, localDCy = 0
      if (hDir !== 0) {
        const newW = Math.max(MIN_ROOM, d.initW! + snap(hDir * ldx, GRID))
        localDCx = hDir * (newW - d.initW!) / 2
        wCm = newW
      }
      if (vDir !== 0) {
        const newH = Math.max(MIN_ROOM, d.initH! + snap(vDir * ldy, GRID))
        localDCy = vDir * (newH - d.initH!) / 2
        hCm = newH
      }
      // Rotasyonlu odada local delta → world delta
      const [worldDx, worldDy] = rot(localDCx, localDCy, room.rot)
      const newCx = d.initCx! + worldDx
      const newCy = d.initCy! + worldDy
      setRooms(rs => rs.map(r => r.id === d.roomId ? { ...r, wCm, hCm, cx: newCx, cy: newCy } : r))
      const dw = wCm - d.initW!, dh = hCm - d.initH!
      setHudLines([
        `W ${wCm} × H ${hCm}`,
        `Δ ${dw >= 0 ? '+' : ''}${dw} × ${dh >= 0 ? '+' : ''}${dh} cm`,
      ])
    }
  }, [pan, sc, rooms, getSVGCoords, vertices, vmap, tool, hoverRectId])

  const handlePointerUp = useCallback((_e: React.PointerEvent) => {
    const d = dragRef.current
    dragRef.current = null
    setCursor('default')
    // Faz 2: guides + HUD temizle (drag bitti)
    setGuides(null)
    setHudLines([])
    setCursorScreen(null)

    // Faz 3: Marquee sonlandı → içindeki rect'leri multi-select'e ekle
    if (d?.kind === 'marquee' && marquee) {
      const mLeft = Math.min(marquee.x1, marquee.x2)
      const mRight = Math.max(marquee.x1, marquee.x2)
      const mTop = Math.min(marquee.y1, marquee.y2)
      const mBottom = Math.max(marquee.y1, marquee.y2)
      const hitIds = rooms.filter(r => {
        // Rotated rect'ler için bbox approximation yeterli
        const hw = r.wCm / 2, hh = r.hCm / 2
        // Axis-aligned bbox — rotated için daha geniş ama "inside" kontrol için yeterli
        return r.cx - hw >= mLeft && r.cx + hw <= mRight
            && r.cy - hh >= mTop && r.cy + hh <= mBottom
      }).map(r => r.id)
      setMultiRectIds(new Set(hitIds))
      setMarquee(null)
      if (hitIds.length > 0) {
        setSelId(null); setSelOpId(null); setSelWallId(null); setSelWallOpId(null); setSelGRoomId(null)
      }
      return
    }

    if (d?.kind === 'new' && newPrev && newPrev.w >= MIN_ROOM && newPrev.h >= MIN_ROOM) {
      const newRoom: ERoom = {
        id: uid('r'), type: newType,
        cx: newPrev.x + newPrev.w / 2, cy: newPrev.y + newPrev.h / 2,
        wCm: newPrev.w, hCm: newPrev.h, rot: 0,
      }
      setRooms(rs => [...rs, newRoom])
      setSelId(newRoom.id)
    }
    setNewPrev(null)

    // Wall draw tamamlanırken numeric buffer temizle
    if (d?.kind === 'drawWall') setNumericBuffer(null)

    if (d?.kind === 'drawWall' && d.vStartId) {
      const end = wallPrev ? { x: wallPrev.x2, y: wallPrev.y2 } : null
      if (end) {
        const sv = vmap.get(d.vStartId)
        if (sv) {
          const len = Math.hypot(end.x - sv.x, end.y - sv.y)
          if (len >= MIN_WALL) {
            addWallSegment(d.vStartId, end.x, end.y)
          }
        }
      }
      setWallPrev(null)
    }
  }, [newPrev, newType, wallPrev, vmap, addWallSegment, marquee, rooms])

  const handleResizeDown = useCallback((handle: string, e: React.PointerEvent) => {
    if (!selId) return
    const room = rooms.find(r => r.id === selId)!
    // Bug-fix: pointerCapture — pointer canvas dışına çıksa bile drag devam etsin
    try { (e.currentTarget as Element).setPointerCapture(e.pointerId) } catch { /* noop */ }
    const { sx, sy } = getSVGCoords(e)
    const { x: wx, y: wy } = s2w(sx, sy, pan, sc)
    dragRef.current = {
      kind: 'resize', sx0: sx, sy0: sy, wx0: wx, wy0: wy,
      roomId: room.id, handle,
      initCx: room.cx, initCy: room.cy, initW: room.wCm, initH: room.hCm,
    }
  }, [selId, rooms, pan, sc, getSVGCoords])

  // Açıklık çevirme
  const flipSwing = () => {
    setOpenings(os => os.map(o => o.id === selOpId ? { ...o, swingRight: !o.swingRight } : o))
    setWallOps(os => os.map(o => o.id === selWallOpId ? { ...o, swingRight: !o.swingRight } : o))
  }
  const flipSwingIn = () => {
    setOpenings(os => os.map(o => o.id === selOpId ? { ...o, swingIn: !o.swingIn } : o))
    setWallOps(os => os.map(o => o.id === selWallOpId ? { ...o, swingIn: !o.swingIn } : o))
  }
  const flipNormal = () => {
    setWallOps(os => os.map(o => o.id === selWallOpId ? { ...o, flipNormal: !o.flipNormal } : o))
  }

  // Polygon odaya çevir (kapalı döngüden)
  const convertCycleToRoom = useCallback((type: RoomType) => {
    if (!pendingCycle) return
    let vIds = [...pendingCycle.vertexIds]
    // CCW garanti et
    if (!isCCW(vIds, vmap)) vIds = vIds.slice().reverse()
    // wallIds'yi yeni vertex sırasına göre yeniden hesapla
    const wIds: string[] = []
    for (let i = 0; i < vIds.length; i++) {
      const a = vIds[i], b = vIds[(i+1) % vIds.length]
      const w = walls.find(x => (x.v1 === a && x.v2 === b) || (x.v1 === b && x.v2 === a))
      if (!w) return
      wIds.push(w.id)
    }
    const gr: GraphRoom = { id: uid('gr'), type, vertexIds: vIds, wallIds: wIds }
    setGraphRooms(rs => [...rs, gr])
    setPendingCycle(null)
    setSelGRoomId(gr.id)
  }, [pendingCycle, vmap, walls])

  // 3D'ye aktar
  const exportTo3D = useCallback(() => {
    const state = useDesignStore.getState()
    const floorId = activeFloor
    const otherRooms = state.rooms.filter(r => (r.floorId ?? floors[0]?.id) !== floorId)

    // Rect odalar
    const rectRooms: Room[] = rooms.map(er => {
      const existing = state.rooms.find(r => r.id === er.id)
      const meta = ROOM_TYPES.find(rt => rt.type === er.type)
      const base: Room = existing ?? {
        id: er.id, type: er.type,
        widthCm: 0, lengthCm: 0, position: [0,0], rotation: 0,
        color: meta?.wallCol ?? 0x8888aa,
        wallColor: RWALL[er.type] ?? '#e3ddd4',
        wallColorOuter: '#c8c0b4',
        floorType: (er.type === 'banyo' || er.type === 'mutfak') ? 'fayans' : 'parke',
        openings: [], removedWalls: [], floorId,
      }
      return {
        ...base, type: er.type,
        position: [er.cx / 100, er.cy / 100] as [number, number],
        widthCm: Math.round(er.wCm), lengthCm: Math.round(er.hCm),
        rotation: er.rot, floorId, shape: 'rectangle',
        openings: openings.filter(o => o.roomId === er.id).map(o => ({
          id: o.id,
          type: (o.kind === 'door' ? 'door' : 'window') as OpeningType,
          wall: W2D_3D[o.wall],
          positionAlongWall: clamp(o.t, 0.05, 0.95),
          widthCm: o.wCm,
          heightCm: o.kind === 'door' ? 210 : 120,
          bottomCm: o.kind === 'door' ? 0 : 90,
        })),
      }
    })

    // Polygon odalar
    const polyRooms: Room[] = graphRooms.map(gr => {
      const verts = gr.vertexIds.map(id => vmap.get(id)!).filter(Boolean)
      if (verts.length < 3) return null as unknown as Room
      // CCW kontrol
      let ordered = verts
      const ccw = (() => {
        let a = 0
        for (let i = 0; i < ordered.length; i++) {
          const v = ordered[i], vn = ordered[(i+1) % ordered.length]
          a += (vn.x - v.x) * (vn.y + v.y)
        }
        return a > 0
      })()
      if (!ccw) ordered = ordered.slice().reverse()

      // Centroid + local vertices (meters)
      // Bug-fix: Konkav polygon (L-şekli) için vertex-ortalama centroid
      // polygonun DIŞINDA olabilir → 3D oda konumu yanlış çıkar.
      // Area-weighted centroid (polygon.ts::polygonSignedArea formülü) kullan.
      let area = 0, cxSum = 0, cySum = 0
      for (let i = 0; i < ordered.length; i++) {
        const p1 = ordered[i]
        const p2 = ordered[(i + 1) % ordered.length]
        const cross = p1.x * p2.y - p2.x * p1.y
        area += cross
        cxSum += (p1.x + p2.x) * cross
        cySum += (p1.y + p2.y) * cross
      }
      area /= 2
      let cx: number, cy: number
      if (Math.abs(area) < 1) {
        // Degenerate polygon → fallback to vertex ortalaması
        cx = ordered.reduce((s,v)=>s+v.x,0) / ordered.length
        cy = ordered.reduce((s,v)=>s+v.y,0) / ordered.length
      } else {
        cx = cxSum / (6 * area)
        cy = cySum / (6 * area)
      }
      // Bounding box
      const xs = ordered.map(v=>v.x), ys = ordered.map(v=>v.y)
      const widthCm = Math.max(...xs) - Math.min(...xs)
      const heightCm = Math.max(...ys) - Math.min(...ys)
      const localVerts: [number, number][] = ordered.map(v => [(v.x - cx) / 100, (v.y - cy) / 100])

      // Openings (wallIds sırasına göre wallIndex ver)
      const wallOpsForRoom: WallOpening[] = []
      gr.wallIds.forEach((wId, idx) => {
        const ops = wallOps.filter(o => o.wallId === wId)
        for (const op of ops) {
          wallOpsForRoom.push({
            id: op.id,
            type: (op.kind === 'door' ? 'door' : 'window') as OpeningType,
            wall: 'front',  // dummy (polygon için wallIndex kullanılır)
            wallIndex: idx,
            positionAlongWall: clamp(op.t, 0.05, 0.95),
            widthCm: op.wCm,
            heightCm: op.kind === 'door' ? 210 : 120,
            bottomCm: op.kind === 'door' ? 0 : 90,
          })
        }
      })

      const existing = state.rooms.find(r => r.id === gr.id)
      const meta = ROOM_TYPES.find(rt => rt.type === gr.type)
      const base: Room = existing ?? {
        id: gr.id, type: gr.type,
        widthCm: 0, lengthCm: 0, position: [0,0], rotation: 0,
        color: meta?.wallCol ?? 0x8888aa,
        wallColor: RWALL[gr.type] ?? '#e3ddd4',
        wallColorOuter: '#c8c0b4',
        floorType: (gr.type === 'banyo' || gr.type === 'mutfak') ? 'fayans' : 'parke',
        openings: [], removedWalls: [], floorId,
      }
      return {
        ...base, type: gr.type,
        position: [cx / 100, cy / 100] as [number, number],
        widthCm: Math.max(20, Math.round(widthCm)),
        lengthCm: Math.max(20, Math.round(heightCm)),
        rotation: 0, floorId,
        shape: 'polygon', vertices: localVerts,
        openings: wallOpsForRoom,
      }
    }).filter(Boolean) as Room[]

    useDesignStore.setState(() => ({
      rooms: [...otherRooms, ...rectRooms, ...polyRooms],
      selection: { kind: null, id: null },
    }))
    const total = rectRooms.length + polyRooms.length
    showToast(`${total} oda 3D sahneye aktarıldı (${polyRooms.length} polygon)`, 'success')
    onClose()
  }, [rooms, openings, graphRooms, walls, wallOps, vmap, activeFloor, floors, showToast, onClose])

  // Blueprint yükle
  const handleBpUpload = async (file: File) => {
    try {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const url = await pdfToImageUrl(file)
        setBlueprint(url)
      } else {
        setBlueprint(URL.createObjectURL(file))
      }
      showToast('Kroki yüklendi', 'success')
    } catch (err) {
      showToast('Kroki yüklenemedi: ' + (err instanceof Error ? err.message : ''), 'error')
    }
  }

  // Kalibrasyon: p1-p2 arasına kullanıcı tarafından girilen mesafeyi uygula
  const applyCalibration = (meters: number) => {
    const { p1, p2 } = bpCalib
    if (!p1 || !p2 || !bpSize || meters <= 0) return
    const pxDist = Math.hypot(p2[0] - p1[0], p2[1] - p1[1])   // cm in editor world (sc=1.5 px/cm)
    // Şu an "cm" cinsinden fark ölçüldü ama bpScale m/px formülü Image boyutu üstünden
    // Gerçek piksel mesafesi: image orijinal genişliğinden ölçeklemeyi ters çevir
    // bpWCm = bpSize.w * bpScale * 100  →  bpScale = bpWCm / (bpSize.w * 100)
    // Yeni bpScale: meters gerçek değer → pxDist (cm) dünya birimi; oran = meters*100/pxDist
    const newWorldPerImgPx_cm = (meters * 100) / pxDist   // cm/worldCm, ama world = image düzlemi
    // Aslında mevcut: dünya cm = imagePixel * (bpScale * 100). Yeni: dünya cm_new = imagePixel * k
    // meters*100 = pxDist_cm_new; pxDist_cm_old = pxDist (world cm); ratio = meters*100/pxDist
    const ratio = newWorldPerImgPx_cm   // cm per world-cm (aslında ölçek ratio)
    const newScale = bpScale * ratio
    useDesignStore.setState({ blueprintScale: newScale })
    setBpCalib({ p1: null, p2: null, askDist: false })
    setCalibMode(false)
    showToast(`Kroki ölçeği ayarlandı (${newScale.toFixed(5)} m/px)`, 'success')
  }

  // Seçili öğeler
  const selRoom = useMemo(() => rooms.find(r => r.id === selId), [rooms, selId])
  const selOp   = useMemo(() => openings.find(o => o.id === selOpId), [openings, selOpId])
  const selWall = useMemo(() => walls.find(w => w.id === selWallId), [walls, selWallId])
  const selWOp  = useMemo(() => wallOps.find(o => o.id === selWallOpId), [wallOps, selWallOpId])
  const selGRoom = useMemo(() => graphRooms.find(r => r.id === selGRoomId), [graphRooms, selGRoomId])

  // Blueprint dünya boyutu
  const bpWCm = bpSize ? bpSize.w * bpScale * 100 : 0
  const bpHCm = bpSize ? bpSize.h * bpScale * 100 : 0

  const toolBtn = (t: Tool, label: string, icon: string, shortcut: string, title: string) => (
    <button
      onClick={() => setTool(t)}
      title={`${title} · ${shortcut}`}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all cursor-pointer
        ${tool === t
          ? 'bg-blue-600 text-white shadow-sm'
          : 'bg-white/80 text-stone-700 hover:bg-blue-50 border border-stone-200'}`}
    >
      <span>{icon}</span>
      <span className="hidden sm:inline">{label}</span>
      <kbd className={`hidden md:inline text-[9px] font-mono px-1 py-0 rounded
        ${tool === t ? 'bg-white/20 text-white' : 'bg-stone-200/70 text-stone-600'}`}>{shortcut}</kbd>
    </button>
  )

  // Tool label lookup (mode chip için)
  const toolLabels: Record<Tool, { label: string; icon: string }> = {
    select:    { label: 'Seç',       icon: '↖' },
    addRect:   { label: 'Dikdörtgen',icon: '▭' },
    drawWall:  { label: 'Duvar',     icon: '╱' },
    addDoor:   { label: 'Kapı',      icon: '🚪' },
    addWindow: { label: 'Pencere',   icon: '⬜' },
  }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-stone-100 select-none">

      {/* Araç Çubuğu */}
      <div className="flex items-center gap-2 px-3 py-2 bg-stone-800 text-white shadow-md flex-shrink-0 flex-wrap">
        <span className="font-bold text-sm text-stone-200 mr-2">🏗 Plan Editörü</span>

        <div className="flex gap-1">
          {toolBtn('select',    'Seç/Taşı',  '↖',  'V', 'Oda/duvar seç ve taşı')}
          {toolBtn('drawWall',  'Duvar Çiz', '╱',  'W', 'Uçtan uca sürükle — tek duvar oluştur')}
          {toolBtn('addRect',   'Dikdörtgen','▭',  'R', 'Hızlı dikdörtgen oda çiz')}
          {toolBtn('addDoor',   'Kapı',      '🚪', 'D', 'Duvara tıkla')}
          {toolBtn('addWindow', 'Pencere',   '⬜', 'O', 'Duvara tıkla')}
        </div>

        {/* Undo / Redo */}
        <div className="flex gap-1 ml-1">
          <button
            onClick={() => { const p = history.undo(); if (p) applySnap(p) }}
            disabled={!history.canUndo}
            title="Geri Al · Ctrl+Z"
            className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs transition-all
              ${history.canUndo
                ? 'bg-white/10 hover:bg-white/20 text-stone-200 cursor-pointer'
                : 'bg-white/5 text-stone-500 cursor-not-allowed'}`}
          >↩</button>
          <button
            onClick={() => { const n = history.redo(); if (n) applySnap(n) }}
            disabled={!history.canRedo}
            title="İleri Al · Ctrl+Y"
            className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs transition-all
              ${history.canRedo
                ? 'bg-white/10 hover:bg-white/20 text-stone-200 cursor-pointer'
                : 'bg-white/5 text-stone-500 cursor-not-allowed'}`}
          >↪</button>
        </div>

        {/* Faz 5: Fit / Zoom */}
        <FitZoomControls
          onFitAll={fitAll}
          onZoom100={zoom100}
          onZoomSelection={zoomSelection}
          hasSelection={!!selId || multiRectIds.size > 0}
        />

        {tool === 'addRect' && (
          <select
            value={newType}
            onChange={e => setNewType(e.target.value as RoomType)}
            className="text-xs px-2 py-1.5 rounded bg-white/10 text-white border border-white/20 cursor-pointer"
          >
            {ROOM_TYPES.map(rt => (
              <option key={rt.type} value={rt.type}>{rt.icon} {rt.label}</option>
            ))}
          </select>
        )}

        <div className="flex-1" />

        {/* Kroki yükle */}
        <button
          onClick={() => bpFileRef.current?.click()}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-white/10 hover:bg-white/20 text-stone-200 text-xs cursor-pointer"
          title="Kroki (PDF / görsel) yükle"
        >
          🗺 {bpUrl ? 'Kroki: değiştir' : 'Kroki yükle'}
        </button>
        <input
          ref={bpFileRef} type="file" accept="image/*,.pdf" className="hidden"
          onChange={async e => {
            const f = e.target.files?.[0]; if (!f) return
            await handleBpUpload(f); e.target.value = ''
          }}
        />
        {bpUrl && (
          <>
            <button
              onClick={() => { setCalibMode(m => !m); setBpCalib({ p1: null, p2: null, askDist: false }) }}
              className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs cursor-pointer
                ${calibMode ? 'bg-amber-500 text-white' : 'bg-white/10 hover:bg-white/20 text-stone-200'}`}
              title="Krokide iki nokta seç ve aralarındaki gerçek mesafeyi gir"
            >📐 Ölç</button>
            <button
              onClick={() => setBlueprint(null)}
              className="flex items-center gap-1 px-2 py-1.5 rounded bg-white/10 hover:bg-red-600 text-stone-200 text-xs cursor-pointer"
              title="Krokiyi kaldır"
            >✕</button>
          </>
        )}

        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
          <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)}
            className="cursor-pointer" />
          <span className="text-stone-300">Izgara</span>
        </label>

        {bpUrl && (
          <label className="flex items-center gap-1.5 text-xs">
            <span className="text-stone-300">Altlık</span>
            <input type="range" min={0} max={1} step={0.05} value={bgOpacity}
              onChange={e => setBgOpacity(Number(e.target.value))}
              className="w-20 cursor-pointer" />
          </label>
        )}

        <div className="flex items-center gap-1 text-xs">
          <button onClick={() => setSc(s => clamp(s * 1.25, MIN_SC, MAX_SC))}
            className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 cursor-pointer">+</button>
          <span className="text-stone-400 w-12 text-center">{Math.round(sc * 100 / INIT_SC)}%</span>
          <button onClick={() => setSc(s => clamp(s / 1.25, MIN_SC, MAX_SC))}
            className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 cursor-pointer">−</button>
        </div>

        <button
          onClick={exportTo3D}
          className="px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold cursor-pointer transition-colors"
        >3D'ye Aktar →</button>
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-stone-200 text-sm cursor-pointer transition-colors"
        >✕ Kapat</button>
      </div>

      {/* Kapalı döngü algılandı → odaya çevir */}
      {pendingCycle && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 border-b border-emerald-300 text-emerald-900 text-xs">
          <span className="font-semibold">✓ Kapalı alan algılandı ({pendingCycle.vertexIds.length} köşe)</span>
          <span>→ Odaya çevir:</span>
          {ROOM_TYPES.map(rt => (
            <button key={rt.type}
              onClick={() => convertCycleToRoom(rt.type)}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-white hover:bg-emerald-200 border border-emerald-300 cursor-pointer"
              title={rt.label}
            >{rt.icon} {rt.label}</button>
          ))}
          <button onClick={() => setPendingCycle(null)}
            className="ml-auto px-2 py-0.5 rounded text-emerald-700 hover:bg-emerald-200 cursor-pointer">Yoksay</button>
        </div>
      )}

      {/* Kalibrasyon mesafe girişi */}
      {bpCalib.askDist && (
        <CalibrationDialog
          onCancel={() => { setBpCalib({ p1: null, p2: null, askDist: false }); setCalibMode(false) }}
          onApply={m => applyCalibration(m)}
        />
      )}

      {/* İçerik alanı */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Sol panel: oda tipleri */}
        <div className="w-28 flex-shrink-0 bg-stone-50 border-r border-stone-200 flex flex-col overflow-y-auto py-2">
          <p className="text-[10px] text-stone-400 font-semibold px-2 mb-1 uppercase tracking-wide">Odalar</p>
          {ROOM_TYPES.map(rt => (
            <button
              key={rt.type}
              onClick={() => { setTool('addRect'); setNewType(rt.type as RoomType) }}
              className={`flex flex-col items-center gap-0.5 px-2 py-2 mx-1 mb-0.5 rounded text-xs cursor-pointer transition-colors
                ${tool === 'addRect' && newType === rt.type
                  ? 'bg-blue-100 text-blue-700 font-semibold'
                  : 'hover:bg-stone-100 text-stone-600'}`}
            >
              <span className="text-lg">{rt.icon}</span>
              <span className="leading-tight text-center text-[10px]">{rt.label}</span>
            </button>
          ))}
        </div>

        {/* SVG Canvas — overscroll-behavior: contain body scroll tetiklemesin;
            touchAction: none browser pinch-zoom + scroll engeli */}
        <div
          className="flex-1 relative overflow-hidden bg-stone-200"
          style={{ overscrollBehavior: 'contain', touchAction: 'none' }}
        >
          <svg
            ref={svgRef}
            width="100%" height="100%"
            style={{ cursor: cursor === 'grabbing' ? 'grabbing'
              : tool === 'addRect' || tool === 'drawWall' ? 'crosshair'
              : tool === 'addDoor' || tool === 'addWindow' ? 'cell'
              : calibMode ? 'crosshair' : 'default',
              display: 'block',
              touchAction: 'none',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onContextMenu={handleContextMenu}
          >
            {showGrid && <GridLines sc={sc} pan={pan} vw={svgSize.w} vh={svgSize.h} />}

            <g transform={`translate(${pan.x},${pan.y}) scale(${sc})`}>

              {/* Kroki altlık */}
              {bpUrl && bpSize && (
                <image href={bpUrl} x={0} y={0}
                  width={bpWCm} height={bpHCm}
                  opacity={bgOpacity}
                  style={{ pointerEvents: 'none' }}
                />
              )}

              {/* Polygon odalar (dolgular, duvarların altında) */}
              {graphRooms.filter(gr => !hiddenIds.has(gr.id)).map(gr => {
                const verts = gr.vertexIds.map(id => vmap.get(id)!).filter(Boolean)
                if (verts.length < 3) return null
                const poly = verts.map(v => [v.x, v.y] as [number, number])
                const fill = RFILL[gr.type] ?? '#f0ece6'
                // Centroid
                const cx = verts.reduce((s,v)=>s+v.x,0)/verts.length
                const cy = verts.reduce((s,v)=>s+v.y,0)/verts.length
                const isSel = gr.id === selGRoomId
                return (
                  <g key={gr.id}>
                    <polygon points={pts(poly)} fill={fill}
                      stroke={isSel ? '#2563eb' : '#5a5048'}
                      strokeWidth={(isSel ? 2 : 0.6) / sc}
                      strokeDasharray={isSel ? `${6/sc},${3/sc}` : undefined}
                      style={{ pointerEvents: 'none' }}
                    />
                    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
                      fontSize={13/sc} fontWeight="600" fill="#3a3028"
                      style={{ pointerEvents:'none', userSelect:'none' }}>
                      {RLABEL[gr.type] ?? gr.type}
                    </text>
                  </g>
                )
              })}

              {/* Rect odalar — pointerdown root handler tarafından ele alınır */}
              {rooms.filter(r => !hiddenIds.has(r.id)).map(room => {
                const outer = roomPoly(room, WALL_T / 2)
                const inner = roomPoly(room, -WALL_T / 2)
                const outerD = `M ${outer.map(([x,y]) => `${x},${y}`).join(' L ')} Z`
                const innerD = `M ${inner.map(([x,y]) => `${x},${y}`).join(' L ')} Z`
                const fill = RFILL[room.type] ?? '#f0ece6'
                const isSelRoom = room.id === selId
                const isMulti = multiRectIds.has(room.id)
                const displayLabel = room.customLabel || (RLABEL[room.type] ?? room.type)
                const isEditingLabel = editingLabelId === room.id
                return (
                  <g key={room.id}
                    style={{ cursor: tool === 'select' ? 'move' : 'default' }}
                    onDoubleClick={e => {
                      if (tool !== 'select') return
                      e.stopPropagation()
                      setEditingLabelId(room.id)
                    }}
                  >
                    <path d={`${outerD} ${innerD}`} fillRule="evenodd"
                      fill="#cfc9c0" stroke="#3a3530" strokeWidth={0.8/sc} />
                    <polygon points={pts(inner)} fill={fill} stroke="#5a5048" strokeWidth={0.6/sc} />
                    {isEditingLabel ? (
                      <foreignObject
                        x={room.cx - 70/sc} y={room.cy - 14/sc}
                        width={140/sc} height={28/sc}
                      >
                        <input
                          type="text"
                          defaultValue={displayLabel}
                          autoFocus
                          onFocus={e => e.currentTarget.select()}
                          onBlur={e => {
                            const val = e.currentTarget.value.trim()
                            setRooms(rs => rs.map(r =>
                              r.id === room.id ? { ...r, customLabel: val || undefined } : r
                            ))
                            setEditingLabelId(null)
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur()
                            if (e.key === 'Escape') { setEditingLabelId(null); e.stopPropagation() }
                          }}
                          onPointerDown={e => e.stopPropagation()}
                          style={{
                            width: '100%', height: '100%',
                            fontSize: `${13/sc}px`, fontWeight: 600,
                            textAlign: 'center', color: '#3a3028',
                            border: '2px solid #2563eb', borderRadius: `${3/sc}px`,
                            background: 'white', padding: `0 ${4/sc}px`,
                            outline: 'none', boxSizing: 'border-box',
                          }}
                        />
                      </foreignObject>
                    ) : (
                      <text x={room.cx} y={room.cy - 6/sc}
                        textAnchor="middle" dominantBaseline="middle"
                        fontSize={13/sc} fontWeight="600" fill="#3a3028"
                        style={{ pointerEvents:'none', userSelect:'none' }}>
                        {displayLabel}
                      </text>
                    )}
                    <text x={room.cx} y={room.cy + 9/sc}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={10/sc} fill="#7a7068"
                      style={{ pointerEvents:'none', userSelect:'none' }}>
                      {room.wCm}×{room.hCm} cm {room.locked ? '🔒' : ''}
                    </text>
                    {isSelRoom && (
                      <polygon points={pts(outer)}
                        fill="none" stroke="#2563eb" strokeWidth={2/sc}
                        strokeDasharray={`${6/sc},${3/sc}`}
                        pointerEvents="none" />
                    )}
                    {isMulti && !isSelRoom && (
                      <polygon points={pts(outer)}
                        fill="none" stroke="#f59e0b" strokeWidth={2/sc}
                        strokeDasharray={`${6/sc},${3/sc}`}
                        pointerEvents="none" />
                    )}
                    {/* Faz 5: Hover halo */}
                    {hoverRectId === room.id && !isSelRoom && !isMulti && (
                      <polygon points={pts(outer)}
                        fill="none" stroke="#60a5fa" strokeWidth={1.5/sc}
                        opacity={0.6} pointerEvents="none" />
                    )}
                  </g>
                )
              })}

              {/* Grafik duvarları (çift çizgi) */}
              {walls.filter(w => !hiddenIds.has(w.id)).map(w => {
                const a = vmap.get(w.v1); const b = vmap.get(w.v2)
                if (!a || !b) return null
                const dx = b.x - a.x, dy = b.y - a.y
                const len = Math.hypot(dx, dy)
                if (len < 1) return null
                const nx = -dy / len, ny = dx / len
                const t = WALL_T / 2
                const p1 = [a.x + nx*t, a.y + ny*t]
                const p2 = [b.x + nx*t, b.y + ny*t]
                const p3 = [b.x - nx*t, b.y - ny*t]
                const p4 = [a.x - nx*t, a.y - ny*t]
                const isSel = w.id === selWallId
                return (
                  <g key={w.id}>
                    <polygon
                      points={`${p1[0]},${p1[1]} ${p2[0]},${p2[1]} ${p3[0]},${p3[1]} ${p4[0]},${p4[1]}`}
                      fill="#cfc9c0"
                      stroke={isSel ? '#2563eb' : '#3a3530'}
                      strokeWidth={(isSel ? 2 : 0.9) / sc}
                    />
                  </g>
                )
              })}

              {/* Vertex'ler (duvar kesişim noktaları) */}
              {vertices.map(v => (
                <circle key={v.id} cx={v.x} cy={v.y} r={3/sc}
                  fill="#3a3530" stroke="white" strokeWidth={0.5/sc}
                  style={{ cursor: tool === 'select' ? 'move' : 'crosshair' }}
                />
              ))}

              {/* Duvar açıklıkları */}
              {wallOps.map(op => {
                const w = walls.find(x => x.id === op.wallId); if (!w) return null
                return op.kind === 'door'
                  ? <WallDoorSymbol key={op.id} op={op} wall={w} vmap={vmap} sc={sc} />
                  : <WallWindowSymbol key={op.id} op={op} wall={w} vmap={vmap} sc={sc} />
              })}
              {selWOp && (() => {
                const w = walls.find(x => x.id === selWOp.wallId); if (!w) return null
                const a = vmap.get(w.v1); const b = vmap.get(w.v2); if (!a || !b) return null
                const cx = a.x + selWOp.t * (b.x - a.x)
                const cy = a.y + selWOp.t * (b.y - a.y)
                return <circle cx={cx} cy={cy} r={8/sc}
                  fill="none" stroke="#f59e0b" strokeWidth={2/sc} />
              })()}

              {/* Rect oda açıklıkları */}
              {openings.map(op => {
                const room = rooms.find(r => r.id === op.roomId); if (!room) return null
                return op.kind === 'door'
                  ? <DoorSymbol key={op.id} op={op} room={room} sc={sc} />
                  : <WindowSymbol key={op.id} op={op} room={room} sc={sc} />
              })}
              {selOp && (() => {
                const room = rooms.find(r => r.id === selOp.roomId); if (!room) return null
                const walls2 = {
                  top:    { len: room.wCm, bx:-room.wCm/2, by:-room.hCm/2, ax:1, ay:0 },
                  right:  { len: room.hCm, bx:room.wCm/2,  by:-room.hCm/2, ax:0, ay:1 },
                  bottom: { len: room.wCm, bx:room.wCm/2,  by:room.hCm/2,  ax:-1,ay:0 },
                  left:   { len: room.hCm, bx:-room.wCm/2, by:room.hCm/2,  ax:0, ay:-1},
                }
                const w = walls2[selOp.wall]
                const cx = w.bx + selOp.t * w.len * w.ax
                const cy = w.by + selOp.t * w.len * w.ay
                const [rx, ry] = rot(cx, cy, room.rot)
                return <circle cx={room.cx + rx} cy={room.cy + ry}
                  r={8/sc} fill="none" stroke="#f59e0b" strokeWidth={2/sc} />
              })()}

              {selRoom && (<>
                <DimLines room={selRoom} sc={sc} />
                <ResizeHandles room={selRoom} sc={sc} onDown={handleResizeDown} />
                <RotationHandle
                  cx={selRoom.cx} cy={selRoom.cy} hh={selRoom.hCm / 2}
                  rot={selRoom.rot} sc={sc}
                  onPointerDown={e => {
                    const { sx, sy } = getSVGCoords(e)
                    const { x: wx, y: wy } = s2w(sx, sy, pan, sc)
                    const a0 = Math.atan2(wy - selRoom.cy, wx - selRoom.cx)
                    dragRef.current = {
                      kind: 'rotate', sx0: sx, sy0: sy, wx0: wx, wy0: wy,
                      roomId: selRoom.id, initRot: selRoom.rot, a0,
                    }
                  }}
                />
              </>)}

              {/* Marquee seçim dikdörtgeni (Ctrl+drag) */}
              {marquee && (() => {
                const x = Math.min(marquee.x1, marquee.x2)
                const y = Math.min(marquee.y1, marquee.y2)
                const w = Math.abs(marquee.x2 - marquee.x1)
                const h = Math.abs(marquee.y2 - marquee.y1)
                return (
                  <rect x={x} y={y} width={w} height={h}
                    fill="#2563eb" fillOpacity={0.08}
                    stroke="#2563eb" strokeWidth={1.5/sc}
                    strokeDasharray={`${4/sc},${3/sc}`}
                    pointerEvents="none" />
                )
              })()}

              {/* Yeni rect önizleme */}
              {newPrev && (
                <rect x={newPrev.x} y={newPrev.y} width={newPrev.w} height={newPrev.h}
                  fill={RFILL[newType] ?? '#e8f4fd'} fillOpacity={0.6}
                  stroke="#2563eb" strokeWidth={2/sc}
                  strokeDasharray={`${6/sc},${3/sc}`} />
              )}

              {/* Duvar çizim önizlemesi (text kaldırıldı — HUD gösteriyor) */}
              {wallPrev && (
                <g>
                  <line x1={wallPrev.x1} y1={wallPrev.y1} x2={wallPrev.x2} y2={wallPrev.y2}
                    stroke="#2563eb" strokeWidth={WALL_T}
                    strokeOpacity={0.35}
                    strokeLinecap="butt" />
                  <line x1={wallPrev.x1} y1={wallPrev.y1} x2={wallPrev.x2} y2={wallPrev.y2}
                    stroke="#2563eb" strokeWidth={2/sc}
                    strokeDasharray={`${6/sc},${3/sc}`} />
                </g>
              )}

              {/* Faz 2: Smart guide çizgileri — pembe (Figma) */}
              <GuideOverlay guides={guides} sc={sc} />

              {/* Kalibrasyon noktaları */}
              {bpCalib.p1 && (
                <circle cx={bpCalib.p1[0]} cy={bpCalib.p1[1]} r={5/sc}
                  fill="none" stroke="#f59e0b" strokeWidth={2/sc} />
              )}
              {bpCalib.p1 && bpCalib.p2 && (
                <>
                  <line x1={bpCalib.p1[0]} y1={bpCalib.p1[1]}
                    x2={bpCalib.p2[0]} y2={bpCalib.p2[1]}
                    stroke="#f59e0b" strokeWidth={2/sc}
                    strokeDasharray={`${6/sc},${3/sc}`} />
                  <circle cx={bpCalib.p2[0]} cy={bpCalib.p2[1]} r={5/sc}
                    fill="none" stroke="#f59e0b" strokeWidth={2/sc} />
                </>
              )}
            </g>
          </svg>

          {/* Faz 5: Empty state overlay */}
          {rooms.length === 0 && vertices.length === 0 && graphRooms.length === 0 && !bpUrl && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white/92 rounded-2xl p-6 shadow-xl pointer-events-auto text-center max-w-md">
                <div className="text-5xl mb-2">📐</div>
                <h3 className="text-base font-bold text-stone-800 mb-1">Plan Çizmeye Başla</h3>
                <p className="text-xs text-stone-600 mb-4">
                  Aşağıdaki araçlardan birini seç veya klavye kısayollarını kullan
                </p>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <button
                    onClick={() => setTool('addRect')}
                    className="flex flex-col items-center gap-1 px-3 py-3 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 cursor-pointer text-xs text-blue-800"
                  >
                    <span className="text-xl">▭</span>
                    <span className="font-medium">Dikdörtgen</span>
                    <kbd className="text-[9px] font-mono text-stone-500">R</kbd>
                  </button>
                  <button
                    onClick={() => setTool('drawWall')}
                    className="flex flex-col items-center gap-1 px-3 py-3 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 cursor-pointer text-xs text-blue-800"
                  >
                    <span className="text-xl">╱</span>
                    <span className="font-medium">Duvar Çiz</span>
                    <kbd className="text-[9px] font-mono text-stone-500">W</kbd>
                  </button>
                  <button
                    onClick={() => bpFileRef.current?.click()}
                    className="flex flex-col items-center gap-1 px-3 py-3 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 cursor-pointer text-xs text-amber-800"
                  >
                    <span className="text-xl">🗺</span>
                    <span className="font-medium">Kroki Yükle</span>
                    <span className="text-[9px] text-stone-500">PDF/PNG</span>
                  </button>
                </div>
                <div className="text-[10px] text-stone-400 leading-tight">
                  <div>V/R/W/D/O → araç kısayolları · F → ekrana sığdır</div>
                  <div>Ctrl+Z → geri al · Çift tık → etiket yeniden adlandır</div>
                </div>
              </div>
            </div>
          )}

          {/* Mode indicator (sol alt) — hangi araç aktif */}
          <div className="absolute bottom-2 left-2 flex flex-col gap-1 pointer-events-none">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold bg-stone-900 text-white rounded-full px-2.5 py-1 shadow-md">
              <span>{toolLabels[tool].icon}</span>
              <span>{toolLabels[tool].label}</span>
              <kbd className="bg-white/20 rounded px-1 py-0 text-[9px] font-mono ml-1">
                {tool === 'select' ? 'V' : tool === 'addRect' ? 'R' : tool === 'drawWall' ? 'W' : tool === 'addDoor' ? 'D' : 'O'}
              </kbd>
            </div>
            <div className="text-[10px] text-stone-600 bg-white/80 rounded px-2 py-1 max-w-md leading-tight">
              {tool === 'drawWall' && 'Başlangıç → bitiş sürükle · Shift = 90° kilit · Mevcut noktaya yakın → yapışır'}
              {tool === 'addRect'  && 'Tıkla-sürükle ile dikdörtgen oda çiz · R basılı kalır (sticky)'}
              {tool === 'addDoor'  && 'Duvar üstüne tıkla — kapı ekle · D basılı kalır'}
              {tool === 'addWindow'&& 'Duvar üstüne tıkla — pencere ekle · O basılı kalır'}
              {tool === 'select'   && 'Duvara sağ-tık: bölme · Boşluk+sürükle: kaydır · Ctrl+Z: geri al'}
              {calibMode && ' · KALİBRASYON: krokide iki nokta seç'}
            </div>
          </div>
        </div>

        {/* Sağ panel: her zaman görünür (Layers) + seçim varsa Özellikler */}
        <div className="w-60 flex-shrink-0 bg-stone-50 border-l border-stone-200 flex flex-col overflow-y-auto">
          {/* Faz 5: Layers panel — her zaman görünür */}
          <LayersPanel
            rectRooms={rooms.map(r => ({
              id: r.id,
              label: r.customLabel || (RLABEL[r.type] ?? r.type),
              wCm: r.wCm, hCm: r.hCm, locked: r.locked,
            }))}
            polyRooms={graphRooms.map(gr => ({
              id: gr.id, label: RLABEL[gr.type] ?? gr.type,
              vertexCount: gr.vertexIds.length,
            }))}
            walls={walls.map(w => {
              const a = vmap.get(w.v1); const b = vmap.get(w.v2)
              return {
                id: w.id,
                length: (a && b) ? Math.hypot(b.x - a.x, b.y - a.y) : 0,
              }
            })}
            selectedIds={{ rect: selId, poly: selGRoomId, wall: selWallId, multi: multiRectIds }}
            hiddenIds={hiddenIds}
            onSelectRect={(id, shift) => {
              if (shift) {
                setMultiRectIds(prev => {
                  const next = new Set(prev)
                  if (next.has(id)) next.delete(id); else next.add(id)
                  if (selId && !next.has(selId)) next.add(selId)
                  return next
                })
                setSelId(null); setSelOpId(null); setSelWallId(null); setSelWallOpId(null); setSelGRoomId(null)
              } else {
                setSelId(id); setSelOpId(null); setSelWallId(null); setSelWallOpId(null); setSelGRoomId(null)
                setMultiRectIds(new Set())
              }
            }}
            onSelectPoly={id => {
              setSelGRoomId(id); setSelId(null); setSelOpId(null); setSelWallId(null); setSelWallOpId(null)
              setMultiRectIds(new Set())
            }}
            onSelectWall={id => {
              setSelWallId(id); setSelId(null); setSelOpId(null); setSelWallOpId(null); setSelGRoomId(null)
              setMultiRectIds(new Set())
            }}
            onToggleHidden={id => {
              setHiddenIds(h => {
                const next = new Set(h)
                if (next.has(id)) next.delete(id); else next.add(id)
                return next
              })
            }}
            onRename={(id, newLabel) => {
              setRooms(rs => rs.map(r => r.id === id ? { ...r, customLabel: newLabel || undefined } : r))
            }}
          />

          {/* Özellikler (seçim varsa) */}
          {(selRoom || selOp || selWall || selWOp || selGRoom) && (
            <div className="p-3 border-b border-stone-200">
              <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-wide mb-2">Özellikler</p>

              {/* Rect oda */}
              {selRoom && (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-stone-500 block mb-0.5">Oda Tipi</label>
                    <select value={selRoom.type}
                      onChange={e => setRooms(rs => rs.map(r =>
                        r.id === selRoom.id ? { ...r, type: e.target.value as RoomType } : r))}
                      className="w-full text-xs px-2 py-1 border border-stone-200 rounded bg-white cursor-pointer">
                      {ROOM_TYPES.map(rt => (
                        <option key={rt.type} value={rt.type}>{rt.icon} {rt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-stone-500 block mb-0.5">Genişlik (cm)</label>
                    <input type="number" min={MIN_ROOM} max={3000} step={GRID}
                      value={Math.round(selRoom.wCm)}
                      onChange={e => setRooms(rs => rs.map(r =>
                        r.id === selRoom.id ? { ...r, wCm: Math.max(MIN_ROOM, Number(e.target.value)) } : r))}
                      className="w-full text-xs px-2 py-1 border border-stone-200 rounded bg-white" />
                  </div>
                  <div>
                    <label className="text-xs text-stone-500 block mb-0.5">Derinlik (cm)</label>
                    <input type="number" min={MIN_ROOM} max={3000} step={GRID}
                      value={Math.round(selRoom.hCm)}
                      onChange={e => setRooms(rs => rs.map(r =>
                        r.id === selRoom.id ? { ...r, hCm: Math.max(MIN_ROOM, Number(e.target.value)) } : r))}
                      className="w-full text-xs px-2 py-1 border border-stone-200 rounded bg-white" />
                  </div>
                  <div className="text-xs text-stone-400 bg-stone-100 rounded px-2 py-1">
                    Alan: {((selRoom.wCm / 100) * (selRoom.hCm / 100)).toFixed(2)} m²
                  </div>

                  {/* Faz 4: Özel etiket */}
                  <div>
                    <label className="text-xs text-stone-500 block mb-0.5">Özel Etiket</label>
                    <input type="text" placeholder={RLABEL[selRoom.type] ?? selRoom.type}
                      value={selRoom.customLabel ?? ''}
                      onChange={e => setRooms(rs => rs.map(r =>
                        r.id === selRoom.id ? { ...r, customLabel: e.target.value || undefined } : r))}
                      className="w-full text-xs px-2 py-1 border border-stone-200 rounded bg-white" />
                    <div className="text-[9px] text-stone-400 mt-0.5">Canvas üstünde çift tıklayarak da düzenlenebilir</div>
                  </div>

                  {/* Faz 4: Pozisyon */}
                  <div className="grid grid-cols-2 gap-1">
                    <div>
                      <label className="text-xs text-stone-500 block mb-0.5">X (m)</label>
                      <input type="number" step={0.01}
                        value={(selRoom.cx / 100).toFixed(2)}
                        onChange={e => setRooms(rs => rs.map(r =>
                          r.id === selRoom.id ? { ...r, cx: Number(e.target.value) * 100 } : r))}
                        className="w-full text-xs px-2 py-1 border border-stone-200 rounded bg-white" />
                    </div>
                    <div>
                      <label className="text-xs text-stone-500 block mb-0.5">Y (m)</label>
                      <input type="number" step={0.01}
                        value={(selRoom.cy / 100).toFixed(2)}
                        onChange={e => setRooms(rs => rs.map(r =>
                          r.id === selRoom.id ? { ...r, cy: Number(e.target.value) * 100 } : r))}
                        className="w-full text-xs px-2 py-1 border border-stone-200 rounded bg-white" />
                    </div>
                  </div>

                  {/* Faz 4: Rotation */}
                  <div>
                    <label className="text-xs text-stone-500 block mb-0.5">Döndürme (°)</label>
                    <input type="number" step={5} min={-180} max={180}
                      value={Math.round(normalizeAngle(selRoom.rot) * 180 / Math.PI)}
                      onChange={e => {
                        const deg = Number(e.target.value)
                        if (!Number.isFinite(deg)) return
                        setRooms(rs => rs.map(r =>
                          r.id === selRoom.id ? { ...r, rot: normalizeAngle(deg * Math.PI / 180) } : r))
                      }}
                      className="w-full text-xs px-2 py-1 border border-stone-200 rounded bg-white" />
                  </div>

                  {/* Faz 4: Kilit toggle */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox"
                      checked={!!selRoom.locked}
                      onChange={e => setRooms(rs => rs.map(r =>
                        r.id === selRoom.id ? { ...r, locked: e.target.checked || undefined } : r))}
                      className="cursor-pointer" />
                    <span className="text-xs text-stone-600">🔒 Kilitle (sürüklenmez)</span>
                  </label>

                  <button
                    onClick={() => {
                      setRooms(rs => rs.filter(r => r.id !== selId))
                      setOpenings(os => os.filter(o => o.roomId !== selId))
                      setSelId(null)
                    }}
                    className="w-full text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 cursor-pointer">
                    🗑 Odayı Sil
                  </button>
                </div>
              )}

              {/* Rect açıklık */}
              {selOp && !selRoom && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-stone-700">
                    {selOp.kind === 'door' ? '🚪 Kapı' : '⬜ Pencere'}
                  </div>
                  <div>
                    <label className="text-xs text-stone-500 block mb-0.5">Genişlik (cm)</label>
                    <input type="number" min={40} max={400} step={10}
                      value={selOp.wCm}
                      onChange={e => setOpenings(os => os.map(o =>
                        o.id === selOpId ? { ...o, wCm: Number(e.target.value) } : o))}
                      className="w-full text-xs px-2 py-1 border border-stone-200 rounded bg-white" />
                  </div>
                  <div>
                    <label className="text-xs text-stone-500 block mb-0.5">
                      Konum: {Math.round(selOp.t * 100)}%
                    </label>
                    <input type="range" min={0.05} max={0.95} step={0.01} value={selOp.t}
                      onChange={e => setOpenings(os => os.map(o =>
                        o.id === selOpId ? { ...o, t: Number(e.target.value) } : o))}
                      className="w-full cursor-pointer" />
                  </div>
                  {selOp.kind === 'door' && (<>
                    <button onClick={flipSwing}
                      className="w-full text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 cursor-pointer">
                      ↔ Menteşe yönü
                    </button>
                    <button onClick={flipSwingIn}
                      className="w-full text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 cursor-pointer">
                      ↕ İçe/Dışa aç
                    </button>
                  </>)}
                  <button
                    onClick={() => { setOpenings(os => os.filter(o => o.id !== selOpId)); setSelOpId(null) }}
                    className="w-full text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 cursor-pointer">
                    🗑 Sil
                  </button>
                </div>
              )}

              {/* Duvar (grafik) */}
              {selWall && (() => {
                const a = vmap.get(selWall.v1); const b = vmap.get(selWall.v2)
                if (!a || !b) return null
                const len = Math.round(Math.hypot(b.x - a.x, b.y - a.y))
                return (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-stone-700">📏 Duvar</div>
                    <div className="text-xs text-stone-400 bg-stone-100 rounded px-2 py-1">
                      Uzunluk: {len} cm ({(len/100).toFixed(2)} m)
                    </div>
                    <div className="text-[11px] text-stone-500">
                      Sağ-tıklayarak bölme noktası ekleyebilirsin.
                    </div>
                    <button
                      onClick={() => {
                        setWalls(ws => ws.filter(w => w.id !== selWallId))
                        setWallOps(os => os.filter(o => o.wallId !== selWallId))
                        setGraphRooms(rs => rs.filter(r => !r.wallIds.includes(selWallId!)))
                        setSelWallId(null)
                      }}
                      className="w-full text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 cursor-pointer">
                      🗑 Duvarı Sil
                    </button>
                  </div>
                )
              })()}

              {/* Duvar açıklığı */}
              {selWOp && !selWall && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-stone-700">
                    {selWOp.kind === 'door' ? '🚪 Kapı (duvar üstü)' : '⬜ Pencere (duvar üstü)'}
                  </div>
                  <div>
                    <label className="text-xs text-stone-500 block mb-0.5">Genişlik (cm)</label>
                    <input type="number" min={40} max={400} step={10}
                      value={selWOp.wCm}
                      onChange={e => setWallOps(os => os.map(o =>
                        o.id === selWallOpId ? { ...o, wCm: Number(e.target.value) } : o))}
                      className="w-full text-xs px-2 py-1 border border-stone-200 rounded bg-white" />
                  </div>
                  <div>
                    <label className="text-xs text-stone-500 block mb-0.5">
                      Konum: {Math.round(selWOp.t * 100)}%
                    </label>
                    <input type="range" min={0.05} max={0.95} step={0.01} value={selWOp.t}
                      onChange={e => setWallOps(os => os.map(o =>
                        o.id === selWallOpId ? { ...o, t: Number(e.target.value) } : o))}
                      className="w-full cursor-pointer" />
                  </div>
                  {selWOp.kind === 'door' && (<>
                    <button onClick={flipSwing}
                      className="w-full text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 cursor-pointer">
                      ↔ Menteşe yönü
                    </button>
                    <button onClick={flipSwingIn}
                      className="w-full text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 cursor-pointer">
                      ↕ İçe/Dışa aç
                    </button>
                    <button onClick={flipNormal}
                      className="w-full text-xs px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 cursor-pointer">
                      ⇋ Duvar normalini çevir
                    </button>
                  </>)}
                  {selWOp.kind === 'window' && (
                    <button onClick={flipNormal}
                      className="w-full text-xs px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 cursor-pointer">
                      ⇋ Duvar normalini çevir
                    </button>
                  )}
                  <button
                    onClick={() => { setWallOps(os => os.filter(o => o.id !== selWallOpId)); setSelWallOpId(null) }}
                    className="w-full text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 cursor-pointer">
                    🗑 Sil
                  </button>
                </div>
              )}

              {/* Polygon oda */}
              {selGRoom && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-stone-700">⬟ Polygon Oda</div>
                  <div>
                    <label className="text-xs text-stone-500 block mb-0.5">Oda Tipi</label>
                    <select value={selGRoom.type}
                      onChange={e => setGraphRooms(rs => rs.map(r =>
                        r.id === selGRoom.id ? { ...r, type: e.target.value as RoomType } : r))}
                      className="w-full text-xs px-2 py-1 border border-stone-200 rounded bg-white cursor-pointer">
                      {ROOM_TYPES.map(rt => (
                        <option key={rt.type} value={rt.type}>{rt.icon} {rt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="text-xs text-stone-400 bg-stone-100 rounded px-2 py-1">
                    {selGRoom.vertexIds.length} köşe · {selGRoom.wallIds.length} duvar
                  </div>
                  <button
                    onClick={() => {
                      setGraphRooms(rs => rs.filter(r => r.id !== selGRoomId))
                      setSelGRoomId(null)
                    }}
                    className="w-full text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 cursor-pointer">
                    🗑 Odayı Sil (duvarlar kalır)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Durum çubuğu */}
      <div className="flex items-center gap-4 px-3 py-1.5 bg-stone-800 text-stone-400 text-xs flex-shrink-0">
        <span>{rooms.length} rect · {graphRooms.length} polygon · {walls.length} duvar · {openings.length + wallOps.length} açıklık</span>
        {selRoom && <span className="text-blue-400">Seçili: {RLABEL[selRoom.type]} — {selRoom.wCm}×{selRoom.hCm} cm</span>}
        {selWall && (() => {
          const a = vmap.get(selWall.v1); const b = vmap.get(selWall.v2)
          if (!a || !b) return null
          return <span className="text-blue-400">Duvar: {Math.round(Math.hypot(b.x-a.x, b.y-a.y))} cm</span>
        })()}
        <span className="ml-auto">Ölçek: {Math.round(sc * 100 / INIT_SC)}% · 10 cm ızgara</span>
      </div>

      {/* Faz 2: Sürükleme sırasında cursor yanında boyut HUD'u */}
      {cursorScreen && hudLines.length > 0 && (
        <DimensionHUD x={cursorScreen.x} y={cursorScreen.y} lines={hudLines} />
      )}

      {/* Faz 5: Editor context menu */}
      {ctxMenu && (
        <EditorContextMenu
          x={ctxMenu.x} y={ctxMenu.y}
          actions={ctxMenu.actions}
          onClose={() => setCtxMenu(null)}
        />
      )}

      {/* Faz 3: Multi-select rozeti */}
      {multiRectIds.size > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500 text-white text-xs font-bold shadow-lg">
          <span>✦ {multiRectIds.size} oda seçili</span>
          <span className="text-white/70 font-normal text-[10px]">↑↓←→ taşı · Ctrl+D çoğalt · R döndür · Del sil</span>
          <button
            onClick={() => setMultiRectIds(new Set())}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/20 hover:bg-white/40 transition-colors cursor-pointer text-xs"
            title="Seçimi kaldır (Esc)"
          >✕</button>
        </div>
      )}
    </div>
  )
}

/** Ray-casting point-in-polygon */
function pointInPolygon(x: number, y: number, poly: Vertex[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y
    const xj = poly[j].x, yj = poly[j].y
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
    if (intersect) inside = !inside
  }
  return inside
}

/** Kalibrasyon dialog — küçük modal */
function CalibrationDialog({ onCancel, onApply }: {
  onCancel: () => void; onApply: (meters: number) => void
}) {
  const [val, setVal] = useState('1.00')
  return (
    <div className="absolute inset-0 z-[210] bg-black/30 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-5 w-80">
        <div className="text-sm font-semibold text-stone-800 mb-1">📐 Kroki ölçeği</div>
        <div className="text-xs text-stone-600 mb-3">
          Seçtiğin iki nokta arasındaki <b>gerçek mesafeyi metre</b> olarak gir.
        </div>
        <input
          type="number" step="0.01" min="0.01" value={val}
          onChange={e => setVal(e.target.value)}
          autoFocus
          className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm mb-3"
        />
        <div className="flex gap-2">
          <button
            onClick={() => { const m = Number(val); if (m > 0) onApply(m) }}
            className="flex-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded text-sm font-semibold cursor-pointer">
            Uygula
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded text-sm cursor-pointer">
            İptal
          </button>
        </div>
      </div>
    </div>
  )
}

import type { LayoutData, Room, FurnitureItem } from '../types'
import { MIN_DIM_CM, MAX_DIM_CM } from '../types'

const CURRENT_VERSION = 1

function clampDim(val: unknown, min = MIN_DIM_CM, max = MAX_DIM_CM): number {
  const n = typeof val === 'number' ? val : Number(val)
  if (isNaN(n)) return min
  return Math.max(min, Math.min(max, n))
}

function isValidRoom(r: unknown): r is Room {
  if (!r || typeof r !== 'object') return false
  const o = r as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.type === 'string' &&
    typeof o.widthCm === 'number' &&
    typeof o.lengthCm === 'number' &&
    Array.isArray(o.position) && o.position.length === 2 &&
    typeof o.rotation === 'number' &&
    typeof o.color === 'number'
  )
}

function isValidFurniture(f: unknown): f is FurnitureItem {
  if (!f || typeof f !== 'object') return false
  const o = f as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.type === 'string' &&
    o.dims !== null && typeof o.dims === 'object' &&
    Array.isArray(o.position) && o.position.length === 2 &&
    typeof o.rotation === 'number' &&
    typeof o.color === 'number'
  )
}

function sanitizeRoom(r: Room): Room {
  return {
    id: r.id,
    type: r.type,
    widthCm: clampDim(r.widthCm),
    lengthCm: clampDim(r.lengthCm),
    position: [Number(r.position[0]) || 0, Number(r.position[1]) || 0],
    rotation: Number(r.rotation) || 0,
    color: Number(r.color) || 0x4488ff,
  }
}

function sanitizeFurniture(f: FurnitureItem): FurnitureItem {
  const dims: Record<string, number> = {}
  if (f.dims && typeof f.dims === 'object') {
    for (const [k, v] of Object.entries(f.dims)) {
      dims[k] = clampDim(v, 10, 5000)
    }
  }
  return {
    id: f.id,
    type: f.type,
    dims,
    position: [Number(f.position[0]) || 0, Number(f.position[1]) || 0],
    rotation: Number(f.rotation) || 0,
    color: Number(f.color) || 0xffcc44,
    parentRoomId: typeof f.parentRoomId === 'string' ? f.parentRoomId : null,
  }
}

export function validateAndParse(json: string): LayoutData {
  const raw = JSON.parse(json)
  if (!raw || typeof raw !== 'object') throw new Error('Invalid layout data')

  const rooms: Room[] = []
  const furniture: FurnitureItem[] = []

  if (Array.isArray(raw.rooms)) {
    for (const r of raw.rooms) {
      if (isValidRoom(r)) rooms.push(sanitizeRoom(r))
    }
  }

  if (Array.isArray(raw.furniture)) {
    for (const f of raw.furniture) {
      if (isValidFurniture(f)) furniture.push(sanitizeFurniture(f))
    }
  }

  return { version: CURRENT_VERSION, rooms, furniture }
}

export function exportToJSON(data: LayoutData): string {
  return JSON.stringify({ ...data, version: CURRENT_VERSION }, null, 2)
}

export function downloadFile(json: string, filename = 'eviniyerlestir-plan.json') {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error('File read error'))
    reader.readAsText(file)
  })
}

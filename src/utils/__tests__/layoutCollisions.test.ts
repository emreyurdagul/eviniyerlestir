import { describe, it, expect } from 'vitest'
import type { FurnitureItem, LayoutData, Room } from '../../types'
import { findLayoutCollisions, furnitureFootprint, polygonPenetration } from '../layoutCollisions'

function room(o: Partial<Room> = {}): Room {
  return {
    id: 'r', type: 'salon', widthCm: 400, lengthCm: 400, position: [0, 0], rotation: 0,
    color: 0, wallColor: '#fff', wallColorOuter: '#fff', floorType: 'parke', openings: [], removedWalls: [], ...o,
  }
}
function furn(o: Partial<FurnitureItem>): FurnitureItem {
  return { id: 'f', type: 'wardrobe', dims: { width: 100, depth: 60 }, position: [0, 0], rotation: 0, color: 0, parentRoomId: 'r', ...o }
}
const layout = (rooms: Room[], furniture: FurnitureItem[]): LayoutData => ({ version: 1, rooms, furniture })
const kinds = (l: LayoutData) => findLayoutCollisions(l).map(i => i.kind)

describe('polygonPenetration', () => {
  it('ayrık kareler 0, iç içe olanlar derinlik döner', () => {
    const sq = (x: number): [number, number][] => [[x, 0], [x + 1, 0], [x + 1, 1], [x, 1]]
    expect(polygonPenetration(sq(0), sq(2))).toBe(0)
    expect(polygonPenetration(sq(0), sq(0.75))).toBeCloseTo(0.25, 6)
  })
})

describe('furnitureFootprint', () => {
  it('90° dönünce genişlik ve derinlik yer değiştirir', () => {
    const a = furnitureFootprint(furn({ rotation: 0 })).corners
    const b = furnitureFootprint(furn({ rotation: Math.PI / 2 })).corners
    const span = (c: [number, number][], i: 0 | 1) => Math.max(...c.map(p => p[i])) - Math.min(...c.map(p => p[i]))
    expect(span(b, 0)).toBeCloseTo(span(a, 1), 6)
    expect(span(b, 1)).toBeCloseTo(span(a, 0), 6)
  })
})

describe('findLayoutCollisions', () => {
  it('odanın ortasındaki tek mobilya temiz', () => {
    expect(kinds(layout([room()], [furn({})]))).toEqual([])
  })

  it('duvarın iç yüzünü geçen mobilya outside-room', () => {
    // 400 cm oda → iç yüz x = 2 - 0.05; dolap yarı genişliği ~0.56
    expect(kinds(layout([room()], [furn({ position: [1.6, 0] })]))).toContain('outside-room')
  })

  it('kaldırılmış duvar tarafında oda kenarına kadar izin verir', () => {
    const f = furn({ position: [1.43, 0] })
    expect(kinds(layout([room()], [f]))).toContain('outside-room')
    expect(kinds(layout([room({ removedWalls: ['right'] })], [f]))).toEqual([])
  })

  it('iç içe iki mobilya overlap', () => {
    expect(kinds(layout([room()], [furn({ id: 'a' }), furn({ id: 'b', position: [0.3, 0] })]))).toContain('overlap')
  })

  it('farklı yükseklikteki mobilyalar (tavan lambası) çakışmaz', () => {
    const lamp = furn({ id: 'l', type: 'ceilinglamp', dims: { diameter: 55 } })
    const table = furn({ id: 't', type: 'ctable', dims: { diameter: 100 } })
    expect(kinds(layout([room()], [lamp, table]))).toEqual([])
  })

  it('halı üstündeki mobilya çakışma sayılmaz', () => {
    const rug = furn({ id: 'rug', type: 'rug', dims: { length: 200, width: 150 } })
    expect(kinds(layout([room()], [rug, furn({ id: 'w' })]))).toEqual([])
  })

  it('kapı açılma alanındaki mobilya door', () => {
    const r = room({ openings: [{ id: 'd', type: 'door', wall: 'left', positionAlongWall: 0.5, widthCm: 90, heightCm: 210, bottomCm: 0 }] })
    expect(kinds(layout([r], [furn({ position: [-1.4, 0] })]))).toContain('door')
  })

  it('üst üste binen odalar room-overlap, bitişik odalar temiz', () => {
    const a = room({ id: 'a' })
    expect(kinds(layout([a, room({ id: 'b', position: [3.9, 0] })], []))).toContain('room-overlap')
    expect(kinds(layout([a, room({ id: 'b', position: [4, 0] })], []))).toEqual([])
  })
})

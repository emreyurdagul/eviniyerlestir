import { z } from 'zod'

// Herhangi bir değeri string'e çevirir — Claude bazen sayı veya null döner
const flexString = (fallback = '') =>
  z.union([z.string(), z.number(), z.null(), z.undefined()])
    .transform(v => (v == null ? fallback : String(v)))

// Oda tipi — bilinmeyen gelirse 'salon'a düşür
const roomType = z.enum(['salon', 'yatak', 'mutfak', 'banyo', 'koridor', 'cocuk']).catch('salon' as const)

// Koordinat çifti — bazen [x, z] gelir, bazen {"x":0,"z":0}
const coordPair = z.union([
  z.tuple([z.number(), z.number()]),
  z.object({ x: z.number(), z: z.number() }).transform(v => [v.x, v.z] as [number, number]),
]).catch([0, 0] as [number, number])

const AIRoomSchema = z.object({
  type: roomType,
  widthCm: z.number().min(20).max(5000).catch(300),
  lengthCm: z.number().min(20).max(5000).catch(400),
  position: coordPair,
  wallColor: z.string().optional().catch(undefined),
  wallColorOuter: z.string().optional().catch(undefined),
  floorType: z.enum(['parke', 'fayans', 'hali', 'laminat', 'mermer', 'beton']).catch('parke' as const).optional(),
})

const AIFurnitureSchema = z.object({
  type: z.string().catch('sofa'),
  position: coordPair,
  rotation: z.number().default(0).catch(0),
  dims: z.record(z.string(), z.number()).default({}).catch({}),
})

// ── Variant wrapper (ortak) ──
const variantBase = z.object({
  label: flexString('Varyant'),
  description: flexString('').optional(),
})

export const AIPlacementResponseSchema = z.object({
  variants: z.array(
    variantBase.extend({
      furniture: z.array(AIFurnitureSchema).catch([]),
    })
  ).min(1).max(4),
})

export const AIPlanResponseSchema = z.object({
  variants: z.array(
    variantBase.extend({
      rooms: z.array(AIRoomSchema).min(1).catch([]),
    })
  ).min(1).max(4),
})

export const AIStyleResponseSchema = z.object({
  variants: z.array(
    variantBase.extend({
      styleUpdates: z.array(z.object({
        roomId: z.string().catch(''),
        wallColor: z.string().optional().catch(undefined),
        wallColorOuter: z.string().optional().catch(undefined),
        floorType: z.enum(['parke', 'fayans', 'hali', 'laminat', 'mermer', 'beton']).catch('parke' as const).optional(),
      })).catch([]),
    })
  ).min(1).max(4),
})

export const AISuggestionResponseSchema = z.object({
  variants: z.array(
    variantBase.extend({
      furniture: z.array(AIFurnitureSchema).catch([]),
    })
  ).min(1).max(4),
})

export const AIPhotoResponseSchema = z.object({
  furniture: z.object({
    type: z.string().catch('custom'),
    label: flexString('Mobilya'),
    estimatedDimsCm: z.object({
      width:    z.number().optional().catch(undefined),
      length:   z.number().optional().catch(undefined),
      depth:    z.number().optional().catch(undefined),
      height:   z.number().optional().catch(undefined),
      diameter: z.number().optional().catch(undefined),
    }).catch({}),
    confidence: z.number().min(0).max(1).catch(0.5),
  }),
})

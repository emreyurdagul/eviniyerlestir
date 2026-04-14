import { z } from 'zod'

// AI'nin donduren minimal Room sema
export const AIRoomSchema = z.object({
  type: z.enum(['salon', 'yatak', 'mutfak', 'banyo', 'koridor', 'cocuk']),
  widthCm: z.number().min(20).max(5000),
  lengthCm: z.number().min(20).max(5000),
  position: z.tuple([z.number(), z.number()]),
  wallColor: z.string().optional(),
  wallColorOuter: z.string().optional(),
  floorType: z.enum(['parke', 'fayans', 'hali', 'laminat', 'mermer', 'beton']).optional(),
})

export const AIFurnitureSchema = z.object({
  type: z.string(),
  position: z.tuple([z.number(), z.number()]),
  rotation: z.number().default(0),
  dims: z.record(z.string(), z.number()).default({}),
})

export const AIPlacementResponseSchema = z.object({
  variants: z.array(z.object({
    label: z.string(),
    description: z.string().optional(),
    furniture: z.array(AIFurnitureSchema),
  })).min(1).max(4),
})

export const AIPlanResponseSchema = z.object({
  variants: z.array(z.object({
    label: z.string(),
    description: z.string().optional(),
    rooms: z.array(AIRoomSchema).min(1),
  })).min(1).max(4),
})

export const AIStyleResponseSchema = z.object({
  variants: z.array(z.object({
    label: z.string(),
    description: z.string().optional(),
    styleUpdates: z.array(z.object({
      roomId: z.string(),
      wallColor: z.string().optional(),
      wallColorOuter: z.string().optional(),
      floorType: z.enum(['parke', 'fayans', 'hali', 'laminat', 'mermer', 'beton']).optional(),
    })),
  })).min(1).max(4),
})

export const AISuggestionResponseSchema = z.object({
  variants: z.array(z.object({
    label: z.string(),
    description: z.string().optional(),
    furniture: z.array(AIFurnitureSchema),
  })).min(1).max(4),
})

export const AIPhotoResponseSchema = z.object({
  furniture: z.object({
    type: z.string(),
    label: z.string(),
    estimatedDimsCm: z.object({
      width: z.number().optional(),
      length: z.number().optional(),
      depth: z.number().optional(),
      height: z.number().optional(),
      diameter: z.number().optional(),
    }),
    confidence: z.number().min(0).max(1),
  }),
})

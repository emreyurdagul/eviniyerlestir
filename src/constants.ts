/**
 * Uygulama geneli sabitler — metre, cm, step'ler.
 *
 * Burada tutulan değerler birden fazla dosyada tekrar eden magic number'lardır.
 * Boyut clamp sabitleri (MIN_DIM_CM / MAX_DIM_CM) `types/index.ts` içinde tanımlı;
 * oradan gelen tanım tek kaynak olarak bırakılıyor.
 */

// ── Geometri ──

/** Duvar kalınlığı (metre) — iç ve dış cephe arası. */
export const WALL_T = 0.10

// ── Klavye / UI adımları ──

/** Mobilya taşıma adımı (metre) — ok tuşları için. */
export const MOVE_STEP = 0.1

/** Mobilya boyut ±± adımı (cm) — ok tuşları / context menu için. */
export const RESIZE_STEP = 5

/** Oda boyut ±± adımı (cm) — ok tuşları / context menu için. */
export const ROOM_RESIZE_STEP = 10

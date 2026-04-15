/**
 * Ambient globals — window'a iliştirilen uygulama-geneli küçük bayraklar.
 *
 * Three.js pointer event'leri doğrudan element üzerinden geldiği için native
 * DOM event'inin `clientX/Y`'sini "son bilinen koordinat" olarak window'a
 * not ediyoruz — özellikle sağ-tık menüsü için ekran koordinatı gerek.
 *
 * `__evPointerCaptured`: çoklu Three.js Mesh'lerinin aynı anda pointer alması
 * durumunda tekli capture için manuel mutex. RoomMesh + FurnitureItem +
 * ResizeHandles arasında race'i önler.
 *
 * `as any` yerine burası tanımlanarak type-safe erişim sağlandı.
 */

export {}

declare global {
  interface Window {
    __lastPointerX?: number
    __lastPointerY?: number
    __evPointerCaptured?: boolean
  }
}

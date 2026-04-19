/**
 * Paylaşılan kamera referansı — R3F canvas dışından erişim için.
 * SceneCanvas içindeki CameraCapture bileşeni bu ref'i doldurur.
 * Ground.tsx rubber-band seçiminde world → screen projeksiyon için kullanılır.
 */
import type * as THREE from 'three'

export const sharedCamera: { current: THREE.Camera | null } = { current: null }

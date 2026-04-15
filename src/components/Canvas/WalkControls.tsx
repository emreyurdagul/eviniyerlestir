/**
 * WalkControls — Birinci-şahıs yürüyüş modu (FPS tarzı).
 *
 * Mimari görselleştirmede "gerçekten içinde gez" deneyimi sağlar:
 *   - WASD / ok tuşları ile yürüme
 *   - Shift ile koşma (2x hız)
 *   - Fare ile bakış yönü (PointerLock)
 *   - Escape ile çıkış
 *
 * Kamera göz seviyesinde (1.65 m) kilitlenir; Y ekseninde hareket edemez
 * — sadece yatay düzlemde. Bu "insan gibi yürüme" hissini verir.
 *
 * Toggle store'daki `walkMode` üzerinden; kapandığında pointer lock
 * otomatik serbest bırakılır.
 */

import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import type { PointerLockControls as PLC } from 'three-stdlib'
import * as THREE from 'three'
import { useDesignStore } from '../../store/designStore'

const EYE_HEIGHT = 1.65        // metre — ortalama göz seviyesi
const WALK_SPEED = 3.5         // m/s
const RUN_SPEED  = 7.0         // m/s (Shift basılıyken)
const DAMPING    = 10          // ivme yumuşatma

export default function WalkControls() {
  const controlsRef = useRef<PLC>(null)
  const { camera } = useThree()
  const setWalkMode = useDesignStore(s => s.setWalkMode)

  // Tuş durumları (referans ile — React state değişikliği re-render tetiklemesin)
  const keys = useRef({ w: false, a: false, s: false, d: false, shift: false })
  // Hız vektörü (ivme yumuşatma için)
  const velocity = useRef(new THREE.Vector3())
  const direction = useRef(new THREE.Vector3())

  // Kamera'yı göz seviyesine yerleştir ve pointer'ı kilitle (otomatik).
  // Three.js'de camera.position.y mutate etmek standart imperative pattern;
  // react-hooks/immutability bunu flag'liyor — bilinçli suppress.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    camera.position.y = EYE_HEIGHT
    const t = setTimeout(() => controlsRef.current?.lock(), 50)
    return () => clearTimeout(t)
  }, [camera])

  // Pointer serbest bırakıldığında walk mode'dan çık (Escape + ESC veya
  // sekme değiştirme gibi durumları yakalar)
  useEffect(() => {
    const el = document
    const onPointerLockChange = () => {
      if (!document.pointerLockElement) setWalkMode(false)
    }
    el.addEventListener('pointerlockchange', onPointerLockChange)
    return () => el.removeEventListener('pointerlockchange', onPointerLockChange)
  }, [setWalkMode])

  // Klavye dinle
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp':    keys.current.w = true; break
        case 'KeyA': case 'ArrowLeft':  keys.current.a = true; break
        case 'KeyS': case 'ArrowDown':  keys.current.s = true; break
        case 'KeyD': case 'ArrowRight': keys.current.d = true; break
        case 'ShiftLeft': case 'ShiftRight': keys.current.shift = true; break
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp':    keys.current.w = false; break
        case 'KeyA': case 'ArrowLeft':  keys.current.a = false; break
        case 'KeyS': case 'ArrowDown':  keys.current.s = false; break
        case 'KeyD': case 'ArrowRight': keys.current.d = false; break
        case 'ShiftLeft': case 'ShiftRight': keys.current.shift = false; break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  // Her frame'de hız uygula. useFrame içinde camera.position mutasyonu
  // R3F standart yürüyüş/fizik pattern'idir; immutability kuralı burada
  // anlamsız — bilinçli suppress.
  useFrame((_, delta) => {
    const { w, a, s, d, shift } = keys.current
    const speed = shift ? RUN_SPEED : WALK_SPEED

    // Girdi vektörü (kamera yönüne göre)
    direction.current.set(
      Number(d) - Number(a),   // x: strafe
      0,
      Number(w) - Number(s),   // z: ileri/geri (kamera bakış yönü)
    )
    direction.current.normalize()

    // Kamera yaw'ına göre hareket vektörü — bakış yönünde ilerle
    const yaw = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ').y
    const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw))
    const right   = new THREE.Vector3( Math.cos(yaw), 0, -Math.sin(yaw))

    const targetVelocity = new THREE.Vector3()
    targetVelocity.addScaledVector(forward, direction.current.z * speed)
    targetVelocity.addScaledVector(right,   direction.current.x * speed)

    // İvme yumuşatma (eksponansiyel lerp)
    velocity.current.lerp(targetVelocity, Math.min(1, delta * DAMPING))

    // Pozisyonu güncelle — Y sabit (sadece yatay).
    // eslint-disable-next-line react-hooks/immutability
    camera.position.x += velocity.current.x * delta
    camera.position.z += velocity.current.z * delta
    camera.position.y = EYE_HEIGHT
  })

  return <PointerLockControls ref={controlsRef} />
}

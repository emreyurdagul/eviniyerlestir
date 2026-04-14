import { useDesignStore } from '../store/designStore'

/**
 * Ortak toast API — tüm UI bileşenlerinde kullanılır:
 *   const { success, error, info, warning } = useToast()
 *   success('Plan kaydedildi')
 *   error('Dosya okunamadı')
 */
export function useToast() {
  const showToast = useDesignStore(s => s.showToast)
  return {
    success: (msg: string, duration?: number) => showToast(msg, 'success', duration),
    error:   (msg: string, duration?: number) => showToast(msg, 'error', duration ?? 6000),
    info:    (msg: string, duration?: number) => showToast(msg, 'info', duration),
    warning: (msg: string, duration?: number) => showToast(msg, 'warning', duration),
  }
}

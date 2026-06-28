import { useEffect, useState } from 'react'

/**
 * Viewport genişliği bir kırılım noktasının altında mı (varsayılan 640px = Tailwind sm).
 * Birleşik kontrol çubuğunda mobil davranışı (tek-panel, ikon-öncelikli) için kullanılır.
 */
export function useIsMobile(breakpoint = 640): boolean {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < breakpoint,
  )
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [breakpoint])
  return isMobile
}

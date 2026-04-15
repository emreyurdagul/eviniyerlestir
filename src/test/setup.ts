/**
 * Vitest test kurulum dosyası.
 * Global mock'lar ve polyfill'ler burada tanımlanır.
 */

// window.matchMedia — bazı UI bileşenleri responsive için kullanıyor
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

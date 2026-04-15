import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import ErrorBoundary from './components/UI/ErrorBoundary'

// ── Upstream-library deprecation suppression ─────────────────────────────────
// @react-three/fiber (≤9.6) internally creates a `new THREE.Clock()`.
// Three.js r183 deprecated Clock in favour of Timer; until R3F migrates,
// this emits `THREE.THREE.Clock: This module has been deprecated` on every
// Canvas mount. We silence ONLY this one message and pass all others through.
// Track: https://github.com/pmndrs/react-three-fiber/issues/3550
const _consoleWarn = console.warn.bind(console)
console.warn = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].startsWith('THREE.THREE.Clock:')) return
  _consoleWarn(...args)
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
)

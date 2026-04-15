/**
 * ErrorBoundary — Uygulama içindeki React ağaç çöküşlerini yakalar.
 *
 * İki katmanda kullanılır:
 *   1) Kök (App): Beyaz ekran yerine kullanıcıya anlaşılır hata sayfası.
 *   2) Canvas: WebGL / three.js hatası tüm UI'ı götürmesin; sahne düşerse
 *      yan panel ve BottomBar hâlâ çalışsın.
 *
 * Not: Hook'larla Error Boundary yazılamaz — class component zorunlu.
 */

import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  /** Fallback UI. Verilmezse varsayılan kart gösterilir. */
  fallback?: (error: Error, reset: () => void) => ReactNode
  /** Kompakt mod: küçük alan içinde (ör. Canvas) daha sade görünüm. */
  compact?: boolean
  /** Hata oluşunca tetiklenir (telemetri vb. için). */
  onError?: (error: Error, info: ErrorInfo) => void
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Konsola yaz — geliştirici her zaman görebilsin
    console.error('[ErrorBoundary] Yakalanan hata:', error, info)
    this.props.onError?.(error, info)
  }

  reset = (): void => {
    this.setState({ error: null })
  }

  reload = (): void => {
    // Son çare — tüm state'i sıfırla
    window.location.reload()
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    if (this.props.fallback) {
      return this.props.fallback(error, this.reset)
    }

    if (this.props.compact) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-900/90 text-stone-100 p-6 gap-3 text-center">
          <div className="text-4xl">⚠️</div>
          <div className="text-sm font-semibold">3D sahne yüklenemedi</div>
          <div className="text-xs text-stone-400 max-w-xs">
            {error.message || 'Bilinmeyen bir grafik hatası oluştu.'}
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={this.reset}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs rounded"
            >
              Tekrar Dene
            </button>
            <button
              onClick={this.reload}
              className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 text-xs rounded"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      )
    }

    // Kök seviye fallback — tam sayfa
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-stone-100 p-6 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">⚠️</div>
            <div>
              <h1 className="text-lg font-semibold text-stone-800">
                Bir şeyler ters gitti
              </h1>
              <p className="text-xs text-stone-500">
                Uygulama beklenmedik şekilde durdu.
              </p>
            </div>
          </div>

          <div className="text-sm text-stone-700 bg-stone-50 rounded p-3 border border-stone-200">
            <div className="font-mono text-xs break-all">
              {error.message || 'Bilinmeyen hata'}
            </div>
          </div>

          <p className="text-xs text-stone-600">
            Çalışmanız tarayıcı belleğinde otomatik kaydedilmiş olabilir. Sayfayı
            yenilediğinizde geri yüklemeyi deneyebilirsiniz.
          </p>

          <div className="flex gap-2 pt-2">
            <button
              onClick={this.reset}
              className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm rounded font-medium"
            >
              Tekrar Dene
            </button>
            <button
              onClick={this.reload}
              className="flex-1 px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white text-sm rounded font-medium"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      </div>
    )
  }
}

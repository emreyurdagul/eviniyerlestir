/**
 * LoginGate — kullanıcı girişi ekranı.
 *
 * App'in render'ını engeller — kullanıcı doğru credential girene kadar
 * 3D sahne ve diğer hiçbir şey yüklenmez.
 *
 * NOT: Frontend-only. Gerçek koruma için backend auth gerek.
 */

import { useState, useRef, useEffect } from 'react'

interface Props {
  onLogin: (username: string, password: string) => { ok: true } | { ok: false; error: string }
}

export default function LoginGate({ onLogin }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const userRef = useRef<HTMLInputElement>(null)

  // Autofocus
  useEffect(() => { userRef.current?.focus() }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    // Kısa bir delay — "düşüncenin" hissi (ama network yok, hemen döner)
    setTimeout(() => {
      const res = onLogin(username, password)
      setLoading(false)
      if (!res.ok) {
        setError(res.error)
        setPassword('')
      }
    }, 220)
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center
                    bg-gradient-to-br from-stone-100 via-amber-50 to-stone-200
                    p-4">
      {/* Arkaplan dekoratif yumuşak şekil */}
      <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-amber-200/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-56 h-56 rounded-full bg-sky-200/30 blur-3xl pointer-events-none" />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm bg-white/90 backdrop-blur-md
                   rounded-2xl shadow-2xl border border-stone-200/60
                   p-6 sm:p-8 flex flex-col gap-4"
        autoComplete="off"
      >
        {/* Başlık */}
        <div className="text-center mb-1">
          <div className="text-4xl mb-2">🏠</div>
          <h1 className="text-xl font-bold text-stone-800">EviniYerleştir</h1>
          <p className="text-xs text-stone-500 mt-1">Devam etmek için giriş yap</p>
        </div>

        {/* Kullanıcı Adı */}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-stone-600">Kullanıcı Adı</span>
          <input
            ref={userRef}
            type="text"
            value={username}
            onChange={e => { setUsername(e.target.value); setError(null) }}
            placeholder="admin"
            autoComplete="username"
            className="px-3 py-2 rounded-lg border border-stone-300 bg-white
                       text-sm text-stone-800 outline-none transition-colors
                       focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
          />
        </label>

        {/* Şifre */}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-stone-600">Şifre</span>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(null) }}
            placeholder="••••••••"
            autoComplete="current-password"
            className="px-3 py-2 rounded-lg border border-stone-300 bg-white
                       text-sm text-stone-800 outline-none transition-colors
                       focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
          />
        </label>

        {/* Hata mesajı */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg
                          bg-red-50 border border-red-200 text-red-700 text-xs">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !username || !password}
          className="mt-2 w-full py-2.5 rounded-lg font-semibold text-sm text-white
                     bg-amber-500 hover:bg-amber-600 transition-colors
                     disabled:bg-stone-300 disabled:cursor-not-allowed
                     cursor-pointer shadow-sm"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="animate-spin">⏳</span> Giriş yapılıyor...
            </span>
          ) : 'Giriş Yap'}
        </button>

        {/* Demo ipucu */}
        <div className="mt-1 border-t border-stone-200 pt-3">
          <button
            type="button"
            onClick={() => setShowHint(v => !v)}
            className="w-full text-[11px] text-stone-500 hover:text-amber-600 cursor-pointer transition-colors"
          >
            {showHint ? '▲ Demo bilgilerini gizle' : '▼ Demo için giriş bilgileri'}
          </button>
          {showHint && (
            <div className="mt-2 bg-stone-50 rounded-lg p-3 text-xs text-stone-600 space-y-1 border border-stone-200">
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Kullanıcı:</span>
                <code className="font-mono bg-white px-2 py-0.5 rounded border border-stone-200">admin</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Şifre:</span>
                <code className="font-mono bg-white px-2 py-0.5 rounded border border-stone-200">admin123</code>
              </div>
              <button
                type="button"
                onClick={() => { setUsername('admin'); setPassword('admin123') }}
                className="w-full mt-1 text-[10px] text-amber-600 hover:text-amber-700 cursor-pointer"
              >
                Otomatik doldur →
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-stone-400 mt-1">
          Frontend-only demo · Gerçek güvenlik için backend auth gerek
        </p>
      </form>
    </div>
  )
}

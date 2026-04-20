/**
 * useAuth — basit frontend-only auth gate.
 *
 * Güvenlik notu: Bu SADECE UI engeli. Asıl güvenlik backend/edge seviyesinde
 * olmalı. localStorage'da sakladığımız şey yalnızca kullanıcının "giriş
 * yaptığını" işaretler — hassas veri içermez.
 *
 * İleride backend auth eklemek istersen bu hook'u TS interface'i aynen
 * korunarak fetch-tabanlı bir implementasyona çevirebilirsin — App.tsx
 * değişmez.
 */

import { useCallback, useEffect, useState } from 'react'

const AUTH_KEY = 'eviniyerlestir-auth-user'

// Kayıtlı kullanıcılar — frontend-only, bilerek sade.
// Gerçek projeye taşırken bu dizi .env'den veya backend'den gelmeli.
const VALID_CREDS: Array<{ username: string; password: string }> = [
  { username: 'admin', password: 'admin123' },
]

export interface UseAuth {
  user: string | null
  isAuthenticated: boolean
  login: (username: string, password: string) => { ok: true } | { ok: false; error: string }
  logout: () => void
}

function readStoredUser(): string | null {
  try {
    return localStorage.getItem(AUTH_KEY)
  } catch {
    return null
  }
}

export function useAuth(): UseAuth {
  const [user, setUser] = useState<string | null>(readStoredUser)

  // Başka sekmede login/logout olursa yansısın
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === AUTH_KEY) setUser(e.newValue)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const login = useCallback((username: string, password: string) => {
    const u = username.trim()
    const match = VALID_CREDS.find(c => c.username === u && c.password === password)
    if (!match) {
      return { ok: false as const, error: 'Kullanıcı adı veya şifre hatalı' }
    }
    try { localStorage.setItem(AUTH_KEY, u) } catch { /* quota full — ignore */ }
    setUser(u)
    return { ok: true as const }
  }, [])

  const logout = useCallback(() => {
    try { localStorage.removeItem(AUTH_KEY) } catch { /* ignore */ }
    setUser(null)
  }, [])

  return {
    user,
    isAuthenticated: user !== null,
    login,
    logout,
  }
}

import { useState, useRef } from 'react'
import { useDesignStore } from '../../store/designStore'
import type { FurnitureType } from '../../types'
import {
  suggestPlacement,
  suggestFurniture,
  suggestStyle,
  generatePlanFromText,
  analyzePhoto,
} from '../../services/ai/client'
import { useToast } from '../../hooks/useToast'

const TABS = ['Yerleşim', 'Mobilya', 'Stil', 'Plan', 'Fotoğraf'] as const
type Tab = typeof TABS[number]

interface AIPanelProps {
  onClose: () => void
}

export default function AIPanel({ onClose }: AIPanelProps) {
  const aiApiKey       = useDesignStore(s => s.aiApiKey)
  const setAiApiKey    = useDesignStore(s => s.setAiApiKey)
  const aiPreview      = useDesignStore(s => s.aiPreview)
  const setAiPreview   = useDesignStore(s => s.setAiPreview)
  const aiLoading      = useDesignStore(s => s.aiLoading)
  const applyAiPreview = useDesignStore(s => s.applyAiPreview)
  const selection      = useDesignStore(s => s.selection)
  const rooms          = useDesignStore(s => s.rooms)
  const addFurniture   = useDesignStore(s => s.addFurniture)
  const updateFurniture = useDesignStore(s => s.updateFurniture)

  const [tab, setTab] = useState<Tab>('Yerleşim')
  const [keyInput, setKeyInput] = useState('')
  const [planText, setPlanText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [variantCount, setVariantCount] = useState(2)
  // BUG-010: store photo analysis result so user can "Sahneye Ekle"
  const [photoResult, setPhotoResult] = useState<{
    type: string; label: string; dims: Record<string, number>; confidence: number
  } | null>(null)
  const photoRef = useRef<HTMLInputElement>(null)
  // BUG-011: synchronous guard to prevent double API calls before aiLoading
  // propagates through the store
  const isRunningRef = useRef(false)
  const toast = useToast()

  const selectedRoomId = selection.kind === 'room' ? selection.id
    : selection.kind === 'furniture' ? rooms.find(r => r.id === (useDesignStore.getState().furniture.find(f => f.id === selection.id)?.parentRoomId))?.id ?? null
    : null

  const selectedRoom = rooms.find(r => r.id === selectedRoomId) ?? rooms[0] ?? null

  const run = async (fn: () => Promise<typeof aiPreview>) => {
    // BUG-011: synchronous guard prevents double-click race before aiLoading
    // state reaches the button's disabled prop
    if (isRunningRef.current) return
    isRunningRef.current = true
    setError(null)
    try {
      const preview = await fn()
      if (preview) setAiPreview(preview)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      isRunningRef.current = false
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // BUG-011: synchronous guard for photo upload path
    if (isRunningRef.current) return
    isRunningRef.current = true
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      setError(null)
      try {
        const result = await analyzePhoto(dataUrl)
        // BUG-010: store result so user can add to scene with dims
        setPhotoResult(result)
        toast.success(
          `Tanındı: ${result.label} — güven %${Math.round(result.confidence * 100)}`,
          5000
        )
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        setError(msg)
        toast.error(`Fotoğraf analizi başarısız: ${msg}`)
      } finally {
        isRunningRef.current = false
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // BUG-010: add photo-recognized furniture to the scene
  const handleAddPhotoResultToScene = () => {
    if (!photoResult) return
    const id = addFurniture(photoResult.type as FurnitureType)
    if (id && Object.keys(photoResult.dims).length > 0) {
      updateFurniture(id, { dims: photoResult.dims })
    }
    toast.success(`${photoResult.label} sahneye eklendi!`)
    setPhotoResult(null)
  }

  // ── API Key Screen ──
  if (!aiApiKey) {
    return (
      <div className="absolute top-14 right-3 left-3 sm:left-auto z-30 w-auto sm:w-72 max-w-[92vw] sm:max-w-none bg-white/97 backdrop-blur-md rounded-2xl shadow-xl border border-stone-200/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-stone-800">✨ AI Asistan</span>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-lg cursor-pointer leading-none">✕</button>
        </div>

        <p className="text-xs text-stone-500 mb-3 leading-relaxed">
          AI özelliklerini kullanmak için Anthropic API anahtarınızı girin.
          <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className="text-amber-600 underline ml-1">
            Anahtar al →
          </a>
        </p>

        <input
          type="password"
          value={keyInput}
          onChange={e => setKeyInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && keyInput.startsWith('sk-') && setAiApiKey(keyInput.trim())}
          placeholder="sk-ant-..."
          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-xs font-mono mb-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />

        <button
          onClick={() => keyInput.startsWith('sk-') && setAiApiKey(keyInput.trim())}
          disabled={!keyInput.startsWith('sk-')}
          className="w-full py-2 rounded-lg bg-amber-500 text-white text-xs font-bold cursor-pointer disabled:opacity-40 hover:bg-amber-600 transition-colors"
        >
          Kaydet
        </button>

        <p className="text-[10px] text-stone-400 mt-2 leading-relaxed">
          🔒 Anahtarınız yalnızca bu tarayıcıda (localStorage) saklanır, sunucuya gönderilmez.
          Ortak bir cihazdaysanız işiniz bitince “Anahtarı sıfırla” ile silin.
        </p>
      </div>
    )
  }

  // ── Preview Screen ──
  if (aiPreview) {
    return (
      <div className="absolute top-14 right-3 left-3 sm:left-auto z-30 w-auto sm:w-80 max-w-[92vw] sm:max-w-none bg-white/97 backdrop-blur-md rounded-2xl shadow-xl border border-stone-200/60 p-4 max-h-[70vh] sm:max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-stone-800">✨ AI Önerileri</span>
          <button onClick={() => setAiPreview(null)} className="text-stone-400 hover:text-stone-600 text-lg cursor-pointer leading-none">✕</button>
        </div>

        <p className="text-xs text-stone-500 mb-3">
          {aiPreview.variants.length} varyant üretildi. Bir tanesini seçip uygulayın.
        </p>

        {aiPreview.variants.map((v, i) => (
          <button
            key={i}
            onClick={() => setAiPreview({ ...aiPreview, selectedIndex: i })}
            className={`w-full text-left p-3 rounded-xl border mb-2 transition-all cursor-pointer ${
              aiPreview.selectedIndex === i
                ? 'border-amber-400 bg-amber-50 shadow-md'
                : 'border-stone-200 bg-stone-50 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                aiPreview.selectedIndex === i ? 'border-amber-500 bg-amber-500' : 'border-stone-300'
              }`} />
              <span className="text-xs font-bold text-stone-800">{v.label}</span>
            </div>
            {v.description && (
              <p className="text-xs text-stone-500 ml-6 leading-relaxed">{v.description}</p>
            )}
            {v.furniture && v.furniture.length > 0 && (
              <p className="text-xs text-stone-400 ml-6 mt-1">
                {v.furniture.length} mobilya
                {v.rooms && v.rooms.length > 0 ? ` + ${v.rooms.length} oda` : ''}
              </p>
            )}
            {v.rooms && v.rooms.length > 0 && !v.furniture?.length && (
              <p className="text-xs text-stone-400 ml-6 mt-1">
                {v.rooms.length} oda
              </p>
            )}
            {v.styleUpdates && v.styleUpdates.length > 0 && (
              <p className="text-xs text-stone-400 ml-6 mt-1">
                {v.styleUpdates.length} oda stil güncellemesi
              </p>
            )}
          </button>
        ))}

        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setAiPreview(null)}
            className="flex-1 py-2 rounded-lg border border-stone-300 text-xs font-bold text-stone-600 cursor-pointer hover:bg-stone-50 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={applyAiPreview}
            className="flex-1 py-2 rounded-lg bg-amber-500 text-white text-xs font-bold cursor-pointer hover:bg-amber-600 transition-colors"
          >
            ✓ Uygula
          </button>
        </div>
      </div>
    )
  }

  // ── Main Panel ──
  return (
    <div className="absolute top-14 right-3 left-3 sm:left-auto z-30 w-auto sm:w-72 max-w-[92vw] sm:max-w-none bg-white/97 backdrop-blur-md rounded-2xl shadow-xl border border-stone-200/60 p-4 max-h-[70vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-stone-800">✨ AI Asistan</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAiApiKey(null)}
            title="API anahtarını sıfırla"
            className="text-stone-400 hover:text-red-500 text-xs cursor-pointer transition-colors"
          >
            🔑
          </button>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-lg cursor-pointer leading-none">✕</button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0.5 mb-3 bg-stone-100/60 rounded-xl p-0.5 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(null) }}
            className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg whitespace-nowrap transition-colors cursor-pointer px-1 ${
              tab === t ? 'bg-amber-100/80 text-amber-800' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Variant count */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-stone-500">Varyant:</span>
        {[1, 2, 3, 4].map(n => (
          <button
            key={n}
            onClick={() => setVariantCount(n)}
            className={`w-6 h-6 rounded-md text-xs font-bold cursor-pointer transition-colors ${
              variantCount === n ? 'bg-amber-400 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Context info */}
      {selectedRoom && (tab === 'Yerleşim' || tab === 'Mobilya' || tab === 'Stil') && (
        <div className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 mb-3 text-xs text-stone-500">
          Hedef: <span className="font-semibold text-stone-700">{selectedRoom.type}</span>{' '}
          ({selectedRoom.widthCm}×{selectedRoom.lengthCm} cm)
        </div>
      )}
      {!selectedRoom && (tab === 'Yerleşim' || tab === 'Mobilya' || tab === 'Stil') && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 mb-3 text-xs text-orange-600">
          ⚠️ Önce bir oda seçin veya sahneye ekleyin.
        </div>
      )}

      {/* Tab content */}

      {/* Yerleşim */}
      {tab === 'Yerleşim' && (
        <div>
          <p className="text-xs text-stone-500 mb-3 leading-relaxed">
            Seçili odaya uygun mobilya yerleşim planları önerir.
          </p>
          <button
            disabled={!selectedRoom || aiLoading}
            onClick={() => selectedRoom && run(() => suggestPlacement(selectedRoom.id, variantCount))}
            className="w-full py-2.5 rounded-xl bg-amber-500 text-white text-xs font-bold cursor-pointer disabled:opacity-40 hover:bg-amber-600 transition-colors"
          >
            {aiLoading ? '⏳ Üretiliyor...' : '🪑 Yerleşim Öner'}
          </button>
        </div>
      )}

      {/* Mobilya */}
      {tab === 'Mobilya' && (
        <div>
          <p className="text-xs text-stone-500 mb-3 leading-relaxed">
            Odada eksik olabilecek mobilyaları analiz eder ve önerir.
          </p>
          <button
            disabled={!selectedRoom || aiLoading}
            onClick={() => selectedRoom && run(() => suggestFurniture(selectedRoom.id, variantCount))}
            className="w-full py-2.5 rounded-xl bg-amber-500 text-white text-xs font-bold cursor-pointer disabled:opacity-40 hover:bg-amber-600 transition-colors"
          >
            {aiLoading ? '⏳ Analiz ediliyor...' : '🛋 Eksik Mobilya Öner'}
          </button>
        </div>
      )}

      {/* Stil */}
      {tab === 'Stil' && (
        <div>
          <p className="text-xs text-stone-500 mb-3 leading-relaxed">
            Odanın mobilya ve tipine göre renk ve zemin paleti önerir.
          </p>
          <button
            disabled={!selectedRoom || aiLoading}
            onClick={() => selectedRoom && run(() => suggestStyle(selectedRoom.id, variantCount))}
            className="w-full py-2.5 rounded-xl bg-amber-500 text-white text-xs font-bold cursor-pointer disabled:opacity-40 hover:bg-amber-600 transition-colors"
          >
            {aiLoading ? '⏳ Üretiliyor...' : '🎨 Stil Öner'}
          </button>
        </div>
      )}

      {/* Plan */}
      {tab === 'Plan' && (
        <div>
          <p className="text-xs text-stone-500 mb-2 leading-relaxed">
            Metinden kat planı üretir. Örn: "3+1 daire, mutfak açık"
          </p>
          <textarea
            value={planText}
            onChange={e => setPlanText(e.target.value)}
            placeholder="Planı tarif edin..."
            rows={3}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-xs mb-2 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
          />
          <button
            disabled={!planText.trim() || aiLoading}
            onClick={() => run(() => generatePlanFromText(planText.trim(), variantCount))}
            className="w-full py-2.5 rounded-xl bg-amber-500 text-white text-xs font-bold cursor-pointer disabled:opacity-40 hover:bg-amber-600 transition-colors"
          >
            {aiLoading ? '⏳ Oluşturuluyor...' : '🏗 Plan Oluştur'}
          </button>
          <p className="text-xs text-stone-400 mt-2 text-center">
            ⚠️ Yalnızca aktif kattaki plan silinip yenisi eklenir (diğer katlar korunur).
          </p>
        </div>
      )}

      {/* Fotoğraf */}
      {tab === 'Fotoğraf' && (
        <div>
          <p className="text-xs text-stone-500 mb-3 leading-relaxed">
            Mobilya fotoğrafını yükleyin; AI türünü ve tahmini boyutlarını tanısın.
          </p>
          <input
            ref={photoRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
          <button
            disabled={aiLoading}
            onClick={() => photoRef.current?.click()}
            className="w-full py-2.5 rounded-xl bg-amber-500 text-white text-xs font-bold cursor-pointer disabled:opacity-40 hover:bg-amber-600 transition-colors"
          >
            {aiLoading ? '⏳ Analiz ediliyor...' : '📷 Fotoğraf Seç & Analiz Et'}
          </button>

          {/* BUG-010: show result card so user can add to scene */}
          {photoResult && !aiLoading && (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs font-bold text-stone-800 mb-1">{photoResult.label}</p>
              <p className="text-xs text-stone-500 mb-1">
                Tür: <span className="font-mono">{photoResult.type}</span>
                {' · '}güven %{Math.round(photoResult.confidence * 100)}
              </p>
              {Object.keys(photoResult.dims).length > 0 && (
                <p className="text-xs text-stone-500 mb-2">
                  {Object.entries(photoResult.dims).map(([k, v]) => `${k}: ${v} cm`).join(' · ')}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setPhotoResult(null)}
                  className="flex-1 py-1.5 rounded-lg border border-stone-300 text-xs text-stone-500 cursor-pointer hover:bg-stone-50 transition-colors"
                >
                  Kapat
                </button>
                <button
                  onClick={handleAddPhotoResultToScene}
                  className="flex-1 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold cursor-pointer hover:bg-amber-600 transition-colors"
                >
                  ＋ Sahneye Ekle
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600 leading-relaxed">
          {error}
        </div>
      )}
    </div>
  )
}

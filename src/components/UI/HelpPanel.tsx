import { useState } from 'react'

interface HelpPanelProps {
  open: boolean
  onClose: () => void
  onStartTour?: () => void
}

type Tab = 'shortcuts' | 'touch' | 'ai' | 'tips'

interface ShortcutRow { keys: string[]; desc: string }

const SHORTCUTS: Record<string, ShortcutRow[]> = {
  'Genel': [
    { keys: ['Ctrl', 'Z'], desc: 'Son işlemi geri al' },
    { keys: ['Ctrl', 'Y'], desc: 'İleri al (geri alınanı tekrar uygula)' },
    { keys: ['M'], desc: 'Taşıma ↔ Boyutlandırma modu geçişi' },
    { keys: ['Esc'], desc: 'Seçimi kaldır / menüyü kapat' },
  ],
  'Seçili mobilya': [
    { keys: ['R'], desc: 'Saat yönünde 90° döndür' },
    { keys: ['Shift', 'R'], desc: 'Saat yönünün tersine 90° döndür' },
    { keys: ['Ctrl', 'D'], desc: 'Seçili mobilyayı çoğalt' },
    { keys: [']', '/', '='], desc: 'Boyutunu 5cm büyüt' },
    { keys: ['[', '/', '-'], desc: 'Boyutunu 5cm küçült' },
    { keys: ['Del'], desc: 'Sil' },
    { keys: ['←', '↑', '→', '↓'], desc: 'Taşı (Shift ile ince adım)' },
  ],
  'Seçili oda': [
    { keys: ['R'], desc: '90° döndür' },
    { keys: ['[', ']'], desc: 'Her iki kenarı 10cm küçült / büyüt' },
    { keys: ['Shift', '←/→'], desc: 'Genişliği değiştir' },
    { keys: ['Shift', '↑/↓'], desc: 'Boyunu değiştir' },
    { keys: ['Del'], desc: 'Odayı sil' },
  ],
}

function KeyCap({ k }: { k: string }) {
  if (k === '/') return <span className="text-stone-400 mx-0.5">veya</span>
  return (
    <kbd className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded border border-stone-300 bg-stone-50 text-[10px] font-mono font-semibold text-stone-700 shadow-[0_1px_0_rgba(0,0,0,0.1)]">
      {k}
    </kbd>
  )
}

export default function HelpPanel({ open, onClose, onStartTour }: HelpPanelProps) {
  const [tab, setTab] = useState<Tab>('shortcuts')
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
      data-testid="help-panel"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-stone-300/50 w-full max-w-2xl max-h-[min(85vh,calc(100dvh-2rem))] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200/60 bg-sky-50/60 gap-2">
          <div className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
            ❓ Yardım & Rehber
          </div>
          <div className="flex items-center gap-1.5">
            {onStartTour && (
              <button
                onClick={() => { onClose(); onStartTour() }}
                className="px-2.5 py-1 rounded-lg bg-sky-500 text-white text-[11px] font-bold cursor-pointer hover:bg-sky-600 transition-colors"
                data-testid="help-start-tour"
              >
                👋 Turu Başlat
              </button>
            )}
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-600 text-lg cursor-pointer w-8 h-8 flex items-center justify-center leading-none rounded hover:bg-stone-100"
              aria-label="Kapat"
            >✕</button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-0.5 px-2 pt-2 bg-stone-50/60 border-b border-stone-200/40">
          {([
            ['shortcuts', '⌨️ Klavye Kısayolları'],
            ['touch',     '👆 Dokunmatik'],
            ['ai',        '✨ AI Özellikleri'],
            ['tips',      '💡 İpuçları'],
          ] as [Tab, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 py-2 px-2 text-[11px] font-bold rounded-t-lg transition-colors cursor-pointer ${
                tab === id
                  ? 'bg-white text-sky-700 border-t-2 border-l border-r border-sky-300/60'
                  : 'text-stone-500 hover:text-stone-700 hover:bg-white/50'
              }`}
              data-testid={`help-tab-${id}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 flex-1">
          {tab === 'shortcuts' && (
            <div className="space-y-4">
              {Object.entries(SHORTCUTS).map(([group, rows]) => (
                <div key={group}>
                  <div className="text-xs font-bold text-stone-700 mb-2 border-b border-stone-200/60 pb-1">
                    {group}
                  </div>
                  <div className="space-y-1.5">
                    {rows.map((row, i) => (
                      <div key={i} className="flex items-center gap-2 text-[12px]">
                        <div className="flex items-center gap-1 flex-shrink-0 min-w-[140px]">
                          {row.keys.map((k, j) => (
                            <span key={j} className="flex items-center">
                              {j > 0 && row.keys[j - 1] !== '/' && k !== '/' && (
                                <span className="text-stone-400 mx-0.5">+</span>
                              )}
                              <KeyCap k={k} />
                            </span>
                          ))}
                        </div>
                        <span className="text-stone-600 flex-1">{row.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="text-[10px] text-stone-400 mt-3 italic">
                Not: macOS'ta <kbd className="px-1 border rounded text-[9px]">Ctrl</kbd> yerine <kbd className="px-1 border rounded text-[9px]">⌘</kbd> kullanın.
              </div>
            </div>
          )}

          {tab === 'touch' && (
            <div className="space-y-3 text-[12px] text-stone-700">
              <div className="flex items-start gap-3 p-2 rounded-lg bg-stone-50 border border-stone-200/60">
                <span className="text-2xl">👆</span>
                <div><b>Tek parmakla dokunup sürükle</b>: Mobilya veya odayı taşı (taşıma modunda)</div>
              </div>
              <div className="flex items-start gap-3 p-2 rounded-lg bg-stone-50 border border-stone-200/60">
                <span className="text-2xl">👆👆</span>
                <div><b>İki parmakla uzaklaştır / yaklaştır</b>: Kamera yakınlaştırma (pinch zoom)</div>
              </div>
              <div className="flex items-start gap-3 p-2 rounded-lg bg-stone-50 border border-stone-200/60">
                <span className="text-2xl">🔄</span>
                <div><b>İki parmakla döndür</b>: Kamera açısını değiştir</div>
              </div>
              <div className="flex items-start gap-3 p-2 rounded-lg bg-stone-50 border border-stone-200/60">
                <span className="text-2xl">⏳</span>
                <div><b>Uzun basış (~0.6 sn)</b>: Bağlam menüsünü aç (mobilya/oda/duvar üzerinde)</div>
              </div>
              <div className="flex items-start gap-3 p-2 rounded-lg bg-stone-50 border border-stone-200/60">
                <span className="text-2xl">🎯</span>
                <div><b>Duvara uzun basış</b>: Kapı/pencere ekle, duvarı kaldır menüsü</div>
              </div>
            </div>
          )}

          {tab === 'ai' && (
            <div className="space-y-3 text-[12px] text-stone-700">
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] leading-relaxed">
                <b className="text-amber-800">✨ API Anahtarı Gerekli</b>
                <div className="mt-1 text-stone-600">
                  AI özelliklerini kullanmak için ücretsiz Anthropic hesabı açıp API anahtarı alın:
                  <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className="text-amber-700 underline ml-1">
                    console.anthropic.com
                  </a>. Anahtarınız yalnızca tarayıcınızda saklanır.
                </div>
              </div>
              <div className="grid gap-2">
                <div className="flex gap-2 p-2 rounded-lg bg-stone-50 border border-stone-200/60">
                  <div className="text-lg">🪑</div>
                  <div>
                    <b>Yerleşim Öner</b>
                    <div className="text-stone-500 text-[11px]">Seçili odanın ölçülerine göre mobilya yerleşim planları üretir. 1-4 varyant.</div>
                  </div>
                </div>
                <div className="flex gap-2 p-2 rounded-lg bg-stone-50 border border-stone-200/60">
                  <div className="text-lg">🛋</div>
                  <div>
                    <b>Eksik Mobilya Öner</b>
                    <div className="text-stone-500 text-[11px]">Oda tipine göre eksik olan temel mobilyaları ekler.</div>
                  </div>
                </div>
                <div className="flex gap-2 p-2 rounded-lg bg-stone-50 border border-stone-200/60">
                  <div className="text-lg">🎨</div>
                  <div>
                    <b>Stil Öner</b>
                    <div className="text-stone-500 text-[11px]">Mevcut mobilyalarla uyumlu duvar rengi ve zemin paletleri önerir.</div>
                  </div>
                </div>
                <div className="flex gap-2 p-2 rounded-lg bg-stone-50 border border-stone-200/60">
                  <div className="text-lg">🏗</div>
                  <div>
                    <b>Plan Oluştur</b>
                    <div className="text-stone-500 text-[11px]">"3+1 daire, mutfak açık" gibi metinden kat planı üretir.</div>
                  </div>
                </div>
                <div className="flex gap-2 p-2 rounded-lg bg-stone-50 border border-stone-200/60">
                  <div className="text-lg">📷</div>
                  <div>
                    <b>Fotoğraf Analizi</b>
                    <div className="text-stone-500 text-[11px]">Mobilya fotoğrafını yükleyin; tipini ve yaklaşık boyutunu tanır.</div>
                  </div>
                </div>
                <div className="flex gap-2 p-2 rounded-lg bg-stone-50 border border-stone-200/60">
                  <div className="text-lg">🤖</div>
                  <div>
                    <b>Kroki Analiz</b>
                    <div className="text-stone-500 text-[11px]">Kat planı çizimini yükleyip AI Analiz ile otomatik oda listesine çevirin.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'tips' && (
            <div className="space-y-2.5 text-[12px] text-stone-700">
              <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/60">
                <b>🏁 Nasıl başlarım?</b>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  En kolay yol: Dosya menüsünden <b>📋 Hazır Şablonlardan Seç</b>. Sonra odaları ve eşyaları kendinize uyarlayın.
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/60">
                <b>🪑 Mobilya çeşitleri</b>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  Solda <b>🛋 Mobilya</b> sekmesinde her eşyanın yanında <b>▾</b> ok tuşu var — oraya tıklayın, koltuk/yatak/sehpa varyantları görünür. Birini varsayılan yapabilirsiniz.
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/60">
                <b>💡 Aydınlatma</b>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  Tavan lambası, duvar aydınlatması ve lambader ekleyin. Sağ panelde seçili lambanın <b>açık/kapalı</b> ve <b>şiddet</b> ayarı vardır. <b>Ayarlar</b>'dan ortam ışığını kısıp geceye çevirin.
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/60">
                <b>🚪 Kapı / pencere ekleme</b>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  Sahnede doğrudan duvara <b>sağ tıklayın</b> — Kapı Ekle, Pencere Ekle, Duvarı Kaldır menüsü çıkar. Veya sağ panelden oda seçip kapı simgelerine basın.
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/60">
                <b>🗺 Gerçek kroki yükleme</b>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  Dosya menüsünden <b>Kroki / PDF Yükle</b>. Ölçeği ve saydamlığı ayarlayın. AI anahtarınız varsa <b>🤖 AI Analiz</b> ile odaları otomatik çıkarır.
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/60">
                <b>📐 Hassas boyut girme</b>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  Sağdaki ▲▼ tuşlarına <b>basılı tutun</b> — hızlanarak değişir. Üzerinde <b>yukarı/aşağı sürüklerseniz</b> kaydırarak ayarlarsınız.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

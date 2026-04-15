/**
 * useFileOperations — BottomBar ve benzeri yerlerde kullanılan dosya işlemleri.
 *
 * İçerik:
 *   - Planı .json olarak kaydet / yükle
 *   - PNG dışa aktar (canvas snapshot)
 *   - Paylaşılabilir link (base64-encoded plan URL)
 *   - AI kroki analizi (opsiyonel — sadece blueprint yüklüyse)
 *
 * Tüm hata/başarı mesajları toast üzerinden bildirilir (native alert yok).
 *
 * BottomBar.tsx içindeki 7 handler + 2 input ref burada toplanarak bileşen
 * yükü azaltıldı ve bu mantık ileride başka menülerden de çağrılabilir hale
 * geldi (örn. komut paleti, sağ tık menüsü).
 */

import { useRef } from 'react'
import { useDesignStore } from '../store/designStore'
import {
  exportToJSON,
  downloadFile,
  readFile,
  validateAndParse,
} from '../services/serialization'
import { parseBlueprint } from '../services/ai/client'
import { useToast } from './useToast'

export function useFileOperations() {
  const exportLayout = useDesignStore(s => s.exportLayout)
  const importLayout = useDesignStore(s => s.importLayout)
  const blueprintUrl = useDesignStore(s => s.blueprintUrl)
  const setAiPreview = useDesignStore(s => s.setAiPreview)

  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSave = () => {
    const data = exportLayout()
    const json = exportToJSON(data)
    downloadFile(json)
    toast.success('Plan kaydedildi (.json)')
  }

  const handleLoad = () => fileInputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await readFile(file)
      const data = validateAndParse(text)
      importLayout(data)
      toast.success('Plan yüklendi')
    } catch {
      toast.error('Geçersiz dosya formatı — bozuk veya uyumsuz JSON')
    }
    e.target.value = ''
  }

  const handleExportPng = () => {
    const canvas = document.querySelector('canvas')
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = 'eviniyerlestir-plan.png'
    a.click()
  }

  const handleShareLink = () => {
    const data = exportLayout()
    const json = exportToJSON(data)
    const encoded = btoa(unescape(encodeURIComponent(json)))
    const url = `${window.location.origin}${window.location.pathname}#plan=${encoded}`
    navigator.clipboard.writeText(url)
      .then(() => toast.success('Paylaşılabilir link panoya kopyalandı'))
      .catch(() => {
        prompt('Linki kopyalayın:', url)
      })
  }

  const handleAiBlueprint = async () => {
    if (!blueprintUrl) return
    try {
      let dataUrl: string
      if (blueprintUrl.startsWith('data:')) {
        dataUrl = blueprintUrl
      } else {
        const blob = await fetch(blueprintUrl).then(r => r.blob())
        dataUrl = await new Promise<string>((res, rej) => {
          const reader = new FileReader()
          reader.onload = () => res(reader.result as string)
          reader.onerror = rej
          reader.readAsDataURL(blob)
        })
      }
      const preview = await parseBlueprint(dataUrl, 1)
      setAiPreview(preview)
      toast.info('Kroki analiz edildi — öneriyi görmek için AI panelini açın')
    } catch (err) {
      toast.error('AI analizi başarısız: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  return {
    fileInputRef,
    handleSave,
    handleLoad,
    handleFileChange,
    handleExportPng,
    handleShareLink,
    handleAiBlueprint,
  }
}

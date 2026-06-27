/**
 * useFileOperations — dosya kaydetme / yükleme / dışa aktarma işlemleri.
 *
 * Birincil format: .tsrm (sıkıştırılmış + checksum'lı özel format)
 * Geriye uyumluluk: .json dosyaları da okunabilir (import sırasında
 * otomatik algılama — TSRM/ magic header varsa tsrm, yoksa json parse).
 *
 * Pipeline (kaydet): JSON → gzip → base64 → TSRM header + CRC32
 * Pipeline (yükle): CRC32 doğrula → base64 → gunzip → JSON → validate
 */

import { useRef } from 'react'
import { useDesignStore } from '../store/designStore'
import {
  exportToJSON,
  exportToTSRM,
  downloadTSRM,
  downloadFile,
  readAndParseFile,
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

  /** Planı .tsrm olarak kaydet (birincil format) */
  const handleSave = async () => {
    try {
      const data = exportLayout()
      const tsrm = await exportToTSRM(data)
      downloadTSRM(tsrm)
      toast.success('Plan kaydedildi (.tsrm)')
    } catch {
      toast.error('Plan kaydedilemedi')
    }
  }

  /** Planı .json olarak kaydet (geriye uyumluluk / paylaşım) */
  const handleSaveJSON = () => {
    const data = exportLayout()
    const json = exportToJSON(data)
    downloadFile(json)
    toast.success('Plan kaydedildi (.json)')
  }

  const handleLoad = () => fileInputRef.current?.click()

  /** Dosya yükle — .tsrm veya .json otomatik algılanır */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const data = await readAndParseFile(file)
      // 1.4: Mevcut tasarım boş değilse üzerine yazmadan önce onay iste.
      const cur = useDesignStore.getState()
      if ((cur.rooms.length > 0 || cur.furniture.length > 0) &&
          !confirm('Mevcut tasarımın üzerine yüklenecek ve kaydedilmemiş değişiklikler kaybolacak. Devam edilsin mi?')) {
        e.target.value = ''
        return
      }
      importLayout(data)
      const ext = file.name.endsWith('.tsrm') ? '.tsrm' : '.json'
      toast.success(`Plan yüklendi (${ext})`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Geçersiz dosya formatı')
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
    handleSaveJSON,
    handleLoad,
    handleFileChange,
    handleExportPng,
    handleShareLink,
    handleAiBlueprint,
  }
}

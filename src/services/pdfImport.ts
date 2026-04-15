/**
 * PDF import — yalnızca kullanıcı gerçekten PDF yüklediğinde çağrılır.
 *
 * #4 Bundle: pdfjs-dist ~1.4 MB (gzipped ~400 KB). Eskiden bu dosya
 * BottomBar üzerinden her zaman import ediliyordu; pdfjs tüm kullanıcılara
 * baştan iniyordu. Şimdi `pdfToImageUrl` ÇAĞRILDIĞINDA dinamik import ile
 * paket kendini indirir. Kullanıcı PDF yüklemezse pdfjs hiç bundle'a
 * dahil olmaz.
 */

let pdfjsModule: typeof import('pdfjs-dist') | null = null

async function loadPdfjs(): Promise<typeof import('pdfjs-dist')> {
  if (pdfjsModule) return pdfjsModule
  const [pdfjsLib, workerModule] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ])
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default
  pdfjsModule = pdfjsLib
  return pdfjsLib
}

/**
 * PDF'in ilk sayfasini canvas'a render edip data URL olarak dondurur.
 */
export async function pdfToImageUrl(file: File, scale = 2): Promise<string> {
  const pdfjsLib = await loadPdfjs()
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise
  const page = await pdf.getPage(1)

  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height

  const ctx = canvas.getContext('2d')!
  await page.render({ canvasContext: ctx, viewport }).promise

  return canvas.toDataURL('image/png')
}

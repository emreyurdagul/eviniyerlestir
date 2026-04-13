import * as pdfjsLib from 'pdfjs-dist'

// Disable worker - run on main thread (simpler, works in all environments)
pdfjsLib.GlobalWorkerOptions.workerSrc = ''

/**
 * PDF'in ilk sayfasini canvas'a render edip data URL olarak dondurur.
 */
export async function pdfToImageUrl(file: File, scale = 2): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise
  const page = await pdf.getPage(1)

  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height

  const ctx = canvas.getContext('2d')!
  await page.render({ canvasContext: ctx, viewport }).promise

  return canvas.toDataURL('image/png')
}

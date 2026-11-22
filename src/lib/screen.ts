// Vórtex Screen - grabadora de pantalla y cámara con MediaRecorder.
// PC: getDisplayMedia (pantalla, ventana o pestaña, con audio opcional).
// Android: modo cámara (la API de pantalla del sistema no existe en el
// navegador Android; se ofrece grabación con cámara + guía nativa).
// Todo se procesa y guarda localmente: nada sale del navegador.

export const VIDEO_SIZES = [
  { value: 720, label: '720p (HD)' },
  { value: 1080, label: '1080p (Full HD)' },
  { value: 1440, label: '1440p (QHD)' },
  { value: 0, label: 'Máxima disponible' },
]

// Negocia el mimeType real soportado por MediaRecorder según el contenedor elegido.
export function pickMimeType(container: 'webm' | 'mp4'): { mime: string; ext: string } | null {
  const mp4s = ['video/mp4;codecs=avc1.42E01E', 'video/mp4;codecs=avc1', 'video/mp4']
  const webms = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9', 'video/webm']
  const list = container === 'mp4' ? [...mp4s, ...webms] : [...webms, ...mp4s]
  for (const m of list) {
    try {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) {
        const real = m.startsWith('video/mp4') ? 'mp4' : 'webm'
        return { mime: m, ext: real }
      }
    } catch {
      // siguiente
    }
  }
  return null
}

export function fmtBytes(n: number): string {
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  return (n / (1024 * 1024)).toFixed(1) + ' MB'
}

export function fmtTime(total: number): string {
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = Math.floor(total % 60)
  const p = (v: number) => String(v).padStart(2, '0')
  return h > 0 ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`
}

export function recFileName(ext: string): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `vortex-screen-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.${ext}`
}

export function downloadBlob(blob: Blob, filename: string): void {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 8000)
}

export function displaySupported(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getDisplayMedia
}

export function stopStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((t) => t.stop())
}

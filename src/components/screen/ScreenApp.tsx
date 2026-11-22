'use client'

// Vortex Screen - Grabadora de pantalla para tutoriales (PC) y grabadora
// de camara (Android, donde el navegador no expone la API de pantalla).
// Exporta .webm o .mp4 segun soporte del navegador. 100% local.

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  MonitorPlay,
  Circle,
  Square,
  Pause,
  Play,
  Camera,
  Download,
  Video,
  Info,
  Smartphone,
  CameraOff,
} from 'lucide-react'
import {
  VIDEO_SIZES,
  pickMimeType,
  fmtBytes,
  fmtTime,
  recFileName,
  downloadBlob,
  displaySupported,
  stopStream,
} from '@/lib/screen'

const SUPPORT_EMAIL = 'vortexmusic.soporte.app@gmail.com'

function VortexLogo({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect width="48" height="48" rx="10" fill="#161616" />
      <circle cx="24" cy="24" r="17" fill="none" stroke="#f43f5e" strokeWidth="3.5" />
      <path d="M24 10a14 14 0 1 1-9.9 4.1" fill="none" stroke="#fb7185" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M24 17a7 7 0 1 0 7 7" fill="none" stroke="#fb7185" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="24" cy="24" r="3" fill="#fb7185" />
    </svg>
  )
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-[#2b2b31] bg-[#141416] px-6 py-4">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-1 text-center">
        <p className="text-[11px] text-[#9b9ba4]">
          Vórtex Screen · Derechos Reservados © 2026 Vortex Company ·{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#fb7185] hover:underline">
            {SUPPORT_EMAIL}
          </a>
        </p>
        <p className="text-[11px] text-[#9b9ba4]">Gratis · Sin anuncios · 100% local en tu navegador</p>
      </div>
    </footer>
  )
}

const btn =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#2b2b31] bg-[#1e1e22] px-3 py-2 text-xs font-medium text-[#ececf1] hover:bg-[#26262b] disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
const recBtn =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[#f43f5e] px-6 py-3 text-sm font-semibold text-white hover:bg-[#fb7185] disabled:opacity-40 disabled:cursor-not-allowed transition-colors'

type Mode = 'pantalla' | 'camara'
type State = 'idle' | 'rec' | 'pausa'

export default function ScreenApp() {
  const [mode, setMode] = useState<Mode>('pantalla')
  const [state, setState] = useState<State>('idle')
  const [seconds, setSeconds] = useState(0)
  const [withAudio, setWithAudio] = useState(true)
  const [quality, setQuality] = useState(1080)
  const [container, setContainer] = useState<'webm' | 'mp4'>('webm')
  const [extReal, setExtReal] = useState<string>('webm')
  const [error, setError] = useState<string | null>(null)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [blobSize, setBlobSize] = useState(0)
  const [camOn, setCamOn] = useState(false)
  const [facing, setFacing] = useState<'user' | 'environment'>('user')

  const dispSupported = displaySupported()
  const streamRef = useRef<MediaStream | null>(null)
  const recRef = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const previewRef = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<number | null>(null)

  // cronometro
  useEffect(() => {
    if (state === 'rec') {
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    }
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [state])

  // limpieza total
  useEffect(
    () => () => {
      if (recRef.current && recRef.current.state !== 'inactive') {
        try {
          recRef.current.stop()
        } catch {}
      }
      stopStream(streamRef.current)
    },
    []
  )

  const cleanup = useCallback(() => {
    stopStream(streamRef.current)
    streamRef.current = null
    if (previewRef.current) previewRef.current.srcObject = null
    setCamOn(false)
    if (recRef.current && recRef.current.state !== 'inactive') {
      try {
        recRef.current.stop()
      } catch {}
    }
  }, [])

  const startDisplay = useCallback(async () => {
    setError(null)
    if (!dispSupported) {
      setError('Tu navegador no permite grabar la pantalla. En PC usa Chrome, Edge, Brave o Firefox.')
      return
    }
    const picked = pickMimeType(container)
    if (!picked) {
      setError('Ningún formato de video está disponible en este navegador.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: quality > 0 ? { width: { ideal: quality * 1.7777 }, height: { ideal: quality }, frameRate: { ideal: 30 } } : true,
        audio: withAudio,
      })
      streamRef.current = stream
      setExtReal(picked.ext)
      if (previewRef.current) previewRef.current.srcObject = stream

      chunks.current = []
      const rec = new MediaRecorder(stream, { mimeType: picked.mime, videoBitsPerSecond: quality >= 1080 ? 8_000_000 : 5_000_000 })
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.current.push(e.data)
      }
      rec.onstop = () => {
        const blob = new Blob(chunks.current, { type: picked.mime })
        if (blobUrl) URL.revokeObjectURL(blobUrl)
        setBlobUrl(URL.createObjectURL(blob))
        setBlobSize(blob.size)
        cleanup()
        setState('idle')
      }
      // si el usuario corta la comparticion desde el navegador, se detiene
      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop()
        else {
          cleanup()
          setState('idle')
        }
      })
      rec.start(1000)
      recRef.current = rec
      setSeconds(0)
      setState('rec')
    } catch (e: any) {
      if (e?.name === 'NotAllowedError') setError('Selección cancelada.')
      else setError('No se pudo iniciar la grabación de pantalla: ' + (e?.message || 'error desconocido'))
    }
  }, [dispSupported, container, quality, withAudio, blobUrl, cleanup])

  const startCamera = useCallback(async () => {
    setError(null)
    const picked = pickMimeType(container)
    if (!picked) {
      setError('Ningún formato de video está disponible en este navegador.')
      return
    }
    try {
      stopStream(streamRef.current)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: withAudio,
      })
      streamRef.current = stream
      setExtReal(picked.ext)
      if (previewRef.current) previewRef.current.srcObject = stream
      setCamOn(true)

      chunks.current = []
      const rec = new MediaRecorder(stream, { mimeType: picked.mime })
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.current.push(e.data)
      }
      rec.onstop = () => {
        const blob = new Blob(chunks.current, { type: picked.mime })
        if (blobUrl) URL.revokeObjectURL(blobUrl)
        setBlobUrl(URL.createObjectURL(blob))
        setBlobSize(blob.size)
        cleanup()
        setState('idle')
      }
      rec.start(1000)
      recRef.current = rec
      setSeconds(0)
      setState('rec')
    } catch (e: any) {
      if (e?.name === 'NotAllowedError') setError('Permiso de cámara/micrófono denegado.')
      else setError('No se pudo iniciar la cámara: ' + (e?.message || 'error desconocido'))
    }
  }, [container, facing, withAudio, blobUrl, cleanup])

  const pause = () => {
    if (recRef.current?.state === 'recording') {
      recRef.current.pause()
      setState('pausa')
    }
  }
  const resume = () => {
    if (recRef.current?.state === 'paused') {
      recRef.current.resume()
      setState('rec')
    }
  }
  const stop = () => {
    if (recRef.current && recRef.current.state !== 'inactive') recRef.current.requestData()
    // detener dispara onstop que genera el blob
    if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop()
    else {
      cleanup()
      setState('idle')
    }
  }

  const download = () => {
    if (!blobUrl) return
    // re-descarga desde el blob URL
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = recFileName(extReal)
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const discard = () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl)
    setBlobUrl(null)
    setBlobSize(0)
  }

  const switchFacing = async () => {
    const f = facing === 'user' ? 'environment' : 'user'
    setFacing(f)
    if (state !== 'idle') return
    try {
      stopStream(streamRef.current)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: f },
        audio: false,
      })
      streamRef.current = stream
      if (previewRef.current) previewRef.current.srcObject = stream
    } catch {}
  }

  // previsualizar camara al entrar al modo camara
  useEffect(() => {
    if (mode !== 'camara' || state !== 'idle') return
    let alive = true
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: facing }, audio: false })
      .then((stream) => {
        if (!alive) {
          stopStream(stream)
          return
        }
        stopStream(streamRef.current)
        streamRef.current = stream
        if (previewRef.current) previewRef.current.srcObject = stream
        setCamOn(true)
      })
      .catch(() => setCamOn(false))
    return () => {
      alive = false
    }
  }, [mode, facing, state])

  // cortar preview al volver a pantalla
  useEffect(() => {
    if (mode === 'pantalla' && state === 'idle' && !blobUrl) {
      stopStream(streamRef.current)
      if (previewRef.current) previewRef.current.srcObject = null
      setCamOn(false)
    }
  }, [mode, state, blobUrl])

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#0f0f10] text-[#ececf1]">
      <header className="border-b border-[#2b2b31] bg-[#141416] px-4 sm:px-6 h-12 flex items-center gap-2.5 shrink-0">
        <VortexLogo className="w-6 h-6" />
        <span className="text-sm font-semibold tracking-wide">
          <span className="text-[#fb7185]">Vórtex</span> Screen
        </span>
        <span className="text-[11px] text-[#9b9ba4] hidden sm:inline">· Grabadora de pantalla y cámara</span>
        <span className="ml-auto text-[11px] text-[#9b9ba4] hidden md:inline">Gratis · Sin anuncios · 100% local</span>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">
        {/* modos */}
        <div className="flex gap-2">
          <button className={mode === 'pantalla' ? recBtn : btn} onClick={() => setMode('pantalla')} disabled={state !== 'idle'}>
            <MonitorPlay className="w-4 h-4" aria-hidden /> Pantalla (PC)
          </button>
          <button className={mode === 'camara' ? recBtn : btn} onClick={() => setMode('camara')} disabled={state !== 'idle'}>
            <Camera className="w-4 h-4" aria-hidden /> Cámara (móvil y PC)
          </button>
        </div>

        {/* ajustes */}
        <section className="rounded-xl border border-[#2b2b31] bg-[#17171a] p-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <label className="flex items-center gap-1.5 text-[#9b9ba4]">
              Formato:
              <select
                className="rounded-lg border border-[#2b2b31] bg-[#1e1e22] px-2.5 py-1.5 text-xs text-[#ececf1] disabled:opacity-50"
                value={container}
                disabled={state !== 'idle'}
                onChange={(e) => setContainer(e.target.value as 'webm' | 'mp4')}
              >
                <option value="webm">WebM (recomendado)</option>
                <option value="mp4">MP4 (si el navegador lo permite)</option>
              </select>
            </label>
            <label className="flex items-center gap-1.5 text-[#9b9ba4]">
              Calidad:
              <select
                className="rounded-lg border border-[#2b2b31] bg-[#1e1e22] px-2.5 py-1.5 text-xs text-[#ececf1] disabled:opacity-50"
                value={quality}
                disabled={state !== 'idle'}
                onChange={(e) => setQuality(Number(e.target.value))}
              >
                {VIDEO_SIZES.map((q) => (
                  <option key={q.value} value={q.value}>
                    {q.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1.5 text-[#9b9ba4] cursor-pointer">
              <input type="checkbox" className="accent-[#f43f5e]" checked={withAudio} disabled={state !== 'idle'} onChange={(e) => setWithAudio(e.target.checked)} />
              Incluir audio
            </label>
            {extReal !== container && state !== 'idle' && (
              <span className="text-[10px] text-amber-400">MP4 no soportado aquí: grabando WebM.</span>
            )}
          </div>
          <p className="text-[11px] text-[#9b9ba4]">
            {container === 'mp4'
              ? 'Si este navegador no puede grabar MP4, se usará WebM automáticamente (convierte el archivo con cualquier herramienta si lo necesitas).'
              : 'WebM es el formato nativo de grabación en Chrome, Edge y Firefox: máxima compatibilidad y menor peso.'}
          </p>
        </section>

        {/* errores */}
        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">{error}</div>
        )}

        {/* aviso Android */}
        {mode === 'pantalla' && !dispSupported && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 flex gap-3">
            <Smartphone className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" aria-hidden />
            <div className="text-sm text-amber-200 flex flex-col gap-1">
              <p>
                Este navegador (típico en Android) no expone la API de captura de pantalla. Dos opciones:
              </p>
              <ol className="list-decimal ml-4 text-xs flex flex-col gap-0.5">
                <li>Usa la pestaña «Cámara» para grabar vídeo con la cámara del móvil.</li>
                <li>
                  Para grabar la pantalla del móvil usa el grabador nativo de Android (Ajustes → Pantalla → Grabar
                  pantalla, o el acceso rápido de notificaciones) y luego guarda el archivo.
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* controles + preview */}
        <section className="rounded-xl border border-[#2b2b31] bg-[#17171a] p-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {state === 'idle' ? (
              <button className={recBtn} onClick={mode === 'pantalla' ? startDisplay : startCamera}>
                <Circle className="w-5 h-5 fill-white" aria-hidden /> {mode === 'pantalla' ? 'Grabar pantalla' : 'Grabar cámara'}
              </button>
            ) : (
              <>
                {state === 'rec' ? (
                  <button className={recBtn + ' animate-pulse'} onClick={pause}>
                    <Pause className="w-5 h-5" aria-hidden /> Pausar
                  </button>
                ) : (
                  <button className={recBtn} onClick={resume}>
                    <Play className="w-5 h-5" aria-hidden /> Continuar
                  </button>
                )}
                <button className="inline-flex items-center gap-2 rounded-full border border-[#2b2b31] bg-[#1e1e22] px-5 py-3 text-sm font-semibold text-[#ececf1] hover:bg-[#26262b] transition-colors" onClick={stop}>
                  <Square className="w-4 h-4" aria-hidden /> Detener
                </button>
              </>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <Circle className={'w-3 h-3 ' + (state === 'rec' ? 'text-red-500 animate-pulse fill-red-500' : 'text-[#9b9ba4]')} aria-hidden />
              <span className="text-sm font-mono">{fmtTime(seconds)}</span>
            </div>
            {mode === 'camara' && (
              <button className={btn} onClick={switchFacing} disabled={state !== 'idle'}>
                <CameraOff className="w-4 h-4 rotate-180" aria-hidden /> {facing === 'user' ? 'Frontal' : 'Trasera'}
              </button>
            )}
          </div>

          <div className="rounded-lg overflow-hidden border border-[#2b2b31] bg-black min-h-[200px]">
            <video ref={previewRef} playsInline autoPlay muted className="w-full max-h-[420px] object-contain" />
          </div>

          {(state === 'rec' || state === 'pausa') && mode === 'pantalla' && (
            <p className="text-[11px] text-[#9b9ba4] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" aria-hidden /> El audio del sistema se comparte eligiendo «una pestaña» y
              activando «Compartir audio de la pestaña» en el selector del navegador.
            </p>
          )}
        </section>

        {/* resultado */}
        {blobUrl && (
          <section className="rounded-xl border border-[#2b2b31] bg-[#17171a] p-4 flex flex-col gap-3">
            <h2 className="text-xs font-semibold text-[#9b9ba4] uppercase tracking-wider flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5" aria-hidden /> Grabación lista · {fmtBytes(blobSize)} · .{extReal}
            </h2>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video src={blobUrl} controls className="w-full max-h-[420px] rounded-lg bg-black" />
            <div className="flex flex-wrap gap-2">
              <button className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#f43f5e] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#fb7185] transition-colors" onClick={download}>
                <Download className="w-4 h-4" aria-hidden /> Descargar .{extReal}
              </button>
              <button className={btn} onClick={discard}>
                Descartar
              </button>
            </div>
            <p className="text-[11px] text-[#9b9ba4]">
              El vídeo solo existe en tu navegador hasta que lo descargues. No se sube a ningún servidor.
            </p>
          </section>
        )}
      </main>
      <Footer />
    </div>
  )
}

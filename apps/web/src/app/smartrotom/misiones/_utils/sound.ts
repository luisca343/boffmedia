/**
 * Generates a short paper-rustle sound effect using the Web Audio API.
 * No-ops outside browser, or if the user has disabled sound effects.
 */
export function playPaperRustle(): void {
  if (typeof window === "undefined") return
  if ((window as any).__paperSoundEnabled === false) return
  try {
    const win = window as any
    const ctx: AudioContext =
      win.__audioCtx ||
      (win.__audioCtx = new (window.AudioContext || (win as any).webkitAudioContext)())
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.18, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2) * 0.18
    }
    const src = ctx.createBufferSource()
    src.buffer = buf
    const filter = ctx.createBiquadFilter()
    filter.type = "highpass"
    filter.frequency.value = 1200
    const g = ctx.createGain()
    g.gain.value = 0.6
    src.connect(filter).connect(g).connect(ctx.destination)
    src.start()
  } catch (_) {}
}

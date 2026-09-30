// Ringtone / ringback generated with Web Audio — no audio files needed
let ctx = null
let timer = null

function beep(freq, delay, dur, vol) {
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  const t = ctx.currentTime + delay
  o.type = 'sine'
  o.frequency.value = freq
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(vol, t + 0.03)
  g.gain.linearRampToValueAtTime(0, t + dur)
  o.connect(g).connect(ctx.destination)
  o.start(t)
  o.stop(t + dur + 0.05)
}

export function startTone(kind = 'ring') {
  stopTone()
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)()
    ctx.resume?.()
  } catch { return }
  const play = () => {
    if (kind === 'ring') { beep(880, 0, 0.32, 0.16); beep(660, 0.38, 0.32, 0.16); beep(880, 0.76, 0.32, 0.16) }
    else beep(425, 0, 1.1, 0.07)
  }
  play()
  timer = setInterval(play, kind === 'ring' ? 2200 : 3200)
  if (kind === 'ring') navigator.vibrate?.([500, 250, 500])
}

export function stopTone() {
  clearInterval(timer)
  timer = null
  try { navigator.vibrate?.(0) } catch { /* not supported */ }
}
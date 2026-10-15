/**
 * Audio Alert Utility for POS & PS Rental System
 * Uses Web Audio API oscillator synthesis - no external audio files required.
 * Reliable across all modern browsers.
 */

let audioCtx: AudioContext | null = null;
let activeAlarmTimer: any = null;
let isAudioUnlocked = false;

// Initialize or get the AudioContext singleton
function getAudioContext(): AudioContext | null {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

// Unlock audio on first user gesture
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    if (isAudioUnlocked) return;
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => {
        isAudioUnlocked = true;
      }).catch(() => {});
    } else {
      isAudioUnlocked = true;
    }
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };

  window.addEventListener('click', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
}

/**
 * Play a single beep at specific frequency and duration
 */
function playTone(freq: number, type: OscillatorType, durationMs: number, gainVal: number = 0.3) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch (err) {
    console.warn('Web Audio tone error:', err);
  }
}

/**
 * Play pleasant completion chime (for sessions finished automatically upon package expiry)
 */
export function playSuccessChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, idx) => {
    setTimeout(() => {
      playTone(freq, 'sine', 350, 0.25);
    }, idx * 110);
  });
}

/**
 * Play urgent alarm sound for PS package time expired but NOT yet paid
 * Emits pulsating warning beeps.
 */
export function playAlarmSound() {
  stopAlarmSound();
  const ctx = getAudioContext();
  if (!ctx) return;

  // Pulse sequence: 3 sets of double-beeps
  const pulse = () => {
    // Beep 1
    playTone(880, 'square', 120, 0.28); // A5
    setTimeout(() => {
      playTone(880, 'square', 120, 0.28);
    }, 160);
    // Beep 2 (lower tone)
    setTimeout(() => {
      playTone(698.46, 'square', 150, 0.3); // F5
    }, 360);
  };

  pulse();
  let count = 0;
  activeAlarmTimer = setInterval(() => {
    count++;
    pulse();
    // Auto-stop after 8 pulses (~16 seconds) if not acknowledged
    if (count >= 7) {
      stopAlarmSound();
    }
  }, 2200);
}

/**
 * Stop any ongoing alarm sound
 */
export function stopAlarmSound() {
  if (activeAlarmTimer) {
    clearInterval(activeAlarmTimer);
    activeAlarmTimer = null;
  }
}

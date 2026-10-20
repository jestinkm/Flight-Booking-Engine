/**
 * SKYNEXA AIRLINES — SOUND & HAPTIC VIBRATION UTILITY
 * 
 * Synthesizes a soft, elegant two-tone airline success chime using the browser's
 * native Web Audio API and triggers haptic vibration on supported devices.
 * 
 * Zero external asset dependencies, zero network latency, 100% offline capable.
 */

let lastChimeTimestamp = 0;

/**
 * Plays a soft, elegant two-tone airline cabin chime.
 * Tone 1: G5 (783.99 Hz) -> Tone 2: C6 (1046.50 Hz)
 * Gentle envelope, harmonic warmth, non-irritating, modern payment/airline style.
 * 
 * @param {boolean} force - If true, bypasses the single-play throttle (e.g. for user replay click)
 */
export const playTwoToneSuccessChime = (force = false) => {
  const nowMs = Date.now();
  // Ensure the sound plays only once after confirmation unless explicitly replayed
  if (!force && nowMs - lastChimeTimestamp < 3500) {
    return false;
  }
  lastChimeTimestamp = nowMs;

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;

    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const startTime = ctx.currentTime + 0.03;

    // Master Volume Limiter (soft, pleasant, non-piercing)
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.24, startTime);
    masterGain.connect(ctx.destination);

    // Two-Tone Success Chime Configuration
    // Tone 1: G5 (783.99 Hz) for 0.20s
    // Tone 2: C6 (1046.50 Hz) ascending resolution for 1.1s
    const tones = [
      { freq: 783.99, start: 0, duration: 0.35, decay: 0.32, gain: 0.7 },
      { freq: 1046.50, start: 0.16, duration: 1.25, decay: 1.20, gain: 0.85 }
    ];

    tones.forEach(({ freq, start, duration, decay, gain }) => {
      const toneTime = startTime + start;

      // Primary Pure Sine Tone
      const osc = ctx.createOscillator();
      const toneGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, toneTime);

      // Smooth attack and soft exponential release (eliminates clicks)
      toneGain.gain.setValueAtTime(0.0001, toneTime);
      toneGain.gain.linearRampToValueAtTime(gain, toneTime + 0.018);
      toneGain.gain.exponentialRampToValueAtTime(0.0001, toneTime + decay);

      osc.connect(toneGain);
      toneGain.connect(masterGain);

      osc.start(toneTime);
      osc.stop(toneTime + duration);

      // Subtle warm overtone for crystal acoustic bell quality
      const overtoneOsc = ctx.createOscillator();
      const overtoneGain = ctx.createGain();

      overtoneOsc.type = 'sine';
      overtoneOsc.frequency.setValueAtTime(freq * 2, toneTime);

      overtoneGain.gain.setValueAtTime(0.0001, toneTime);
      overtoneGain.gain.linearRampToValueAtTime(gain * 0.12, toneTime + 0.015);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, toneTime + (decay * 0.6));

      overtoneOsc.connect(overtoneGain);
      overtoneGain.connect(masterGain);

      overtoneOsc.start(toneTime);
      overtoneOsc.stop(toneTime + duration);
    });

    // Soft sub-acoustic body warmth (C4 261.63 Hz)
    const bodyOsc = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(261.63, startTime + 0.16);

    bodyGain.gain.setValueAtTime(0.0001, startTime + 0.16);
    bodyGain.gain.linearRampToValueAtTime(0.08, startTime + 0.18);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.9);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(masterGain);

    bodyOsc.start(startTime + 0.16);
    bodyOsc.stop(startTime + 0.9);

    return true;
  } catch (err) {
    console.debug('Web Audio API chime notice:', err);
    return false;
  }
};

/**
 * Triggers a soft tactile celebration vibration pattern on supported mobile devices.
 */
export const triggerBookingSuccessVibration = () => {
  try {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      // Pleasant two-pulse tactile feedback matching the two-tone chime
      navigator.vibrate([70, 60, 160]);
      return true;
    }
  } catch (err) {
    console.debug('Vibration API notice:', err);
  }
  return false;
};

/**
 * Plays the soft two-tone chime and triggers subtle haptic vibration.
 */
export const celebrateBookingSuccess = (force = false) => {
  const vibrationTriggered = triggerBookingSuccessVibration();
  const soundPlayed = playTwoToneSuccessChime(force);
  return { vibrationTriggered, soundPlayed };
};

// Aliased for backwards compatibility
export const playBookingSuccessSound = playTwoToneSuccessChime;

export default {
  playTwoToneSuccessChime,
  playBookingSuccessSound,
  triggerBookingSuccessVibration,
  celebrateBookingSuccess
};

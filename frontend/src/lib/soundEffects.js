/**
 * SKYNEXA AIRLINES — SOUND & HAPTIC VIBRATION UTILITY
 * 
 * Synthesizes a luxury airline cabin chime using the browser's native Web Audio API
 * and triggers haptic vibration on supported devices.
 * Zero external asset dependencies, zero network latency, 100% offline capable.
 */

export const playBookingSuccessSound = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;

    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime + 0.05;

    // Harmonic Airline Chime:
    // C5 (523.25Hz) -> E5 (659.25Hz) -> G5 (783.99Hz) -> C6 (1046.5Hz)
    const chimeNotes = [
      { freq: 523.25, time: 0, duration: 0.9, gain: 0.28 },
      { freq: 659.25, time: 0.14, duration: 1.1, gain: 0.32 },
      { freq: 783.99, time: 0.28, duration: 1.3, gain: 0.36 },
      { freq: 1046.5, time: 0.44, duration: 1.8, gain: 0.42 }
    ];

    chimeNotes.forEach(({ freq, time, duration, gain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);

      gainNode.gain.setValueAtTime(0.0001, now + time);
      gainNode.gain.linearRampToValueAtTime(gain, now + time + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + duration);
    });

    // Warm sub-harmonic body resonance
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(261.63, now); // C4
    subGain.gain.setValueAtTime(0.0001, now);
    subGain.gain.linearRampToValueAtTime(0.12, now + 0.04);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 1.2);

    return true;
  } catch (err) {
    console.debug('Web Audio API notice:', err);
    return false;
  }
};

export const triggerBookingSuccessVibration = () => {
  try {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      // Tactile celebration haptic pattern: 120ms buzz, 60ms pause, 180ms buzz, 60ms pause, 280ms celebratory finish
      navigator.vibrate([120, 60, 180, 60, 280]);
      return true;
    }
  } catch (err) {
    console.debug('Vibration API notice:', err);
  }
  return false;
};

export const celebrateBookingSuccess = () => {
  const vibrationTriggered = triggerBookingSuccessVibration();
  const soundPlayed = playBookingSuccessSound();
  return { vibrationTriggered, soundPlayed };
};

export default {
  playBookingSuccessSound,
  triggerBookingSuccessVibration,
  celebrateBookingSuccess
};

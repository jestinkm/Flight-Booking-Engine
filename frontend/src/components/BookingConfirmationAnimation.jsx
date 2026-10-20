import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { playTwoToneSuccessChime, triggerBookingSuccessVibration } from '../lib/soundEffects';

/**
 * Premium Flipkart-Inspired Green Tick Order Success Animation
 * 
 * Animation Sequence:
 * 0.0s – 0.5s: White overlay fades in
 * 0.5s – 1.0s: Green circle expands at the center with a smooth spring bounce
 * 1.0s – 1.5s: White tick draws smoothly inside the green circle
 * 1.5s – 2.0s: Pleasant two-tone success sound + subtle confetti burst + green ripple effect
 * 2.0s – 3.0s: "Booking Confirmed!" text appears smoothly
 * 3.0s – 3.8s: Smooth transition to the booking details confirmation screen
 */
const BookingConfirmationAnimation = ({ onComplete }) => {
  const shouldReduceMotion = useReducedMotion();
  const [phase, setPhase] = useState('initial'); // 'initial' -> 'expand' -> 'tick' -> 'celebrate' -> 'text' -> 'complete'
  const [showConfetti, setShowConfetti] = useState(false);
  const soundPlayedRef = useRef(false);

  useEffect(() => {
    // If reduced motion is preferred by user, complete quickly without heavy spring motions
    if (shouldReduceMotion) {
      if (!soundPlayedRef.current) {
        soundPlayedRef.current = true;
        playTwoToneSuccessChime(true);
        triggerBookingSuccessVibration();
      }
      const quickTimer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 1200);
      return () => clearTimeout(quickTimer);
    }

    // 0.5s: Green circle expands
    const expandTimer = setTimeout(() => {
      setPhase('expand');
    }, 500);

    // 1.0s: White tick draws
    const tickTimer = setTimeout(() => {
      setPhase('tick');
    }, 1000);

    // 1.5s: Sound + Confetti burst + Ripple
    const celebrateTimer = setTimeout(() => {
      setPhase('celebrate');
      setShowConfetti(true);
      if (!soundPlayedRef.current) {
        soundPlayedRef.current = true;
        playTwoToneSuccessChime(true);
        triggerBookingSuccessVibration();
      }
    }, 1500);

    // 2.0s: Booking Confirmed text appears
    const textTimer = setTimeout(() => {
      setPhase('text');
    }, 2000);

    // 3.2s: Begin smooth fadeout to reveal booking details
    const completeTimer = setTimeout(() => {
      setPhase('complete');
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 400);
    }, 3200);

    return () => {
      clearTimeout(expandTimer);
      clearTimeout(tickTimer);
      clearTimeout(celebrateTimer);
      clearTimeout(textTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete, shouldReduceMotion]);

  const handleSkip = () => {
    setPhase('complete');
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 150);
  };

  // 24 Confetti particles with radial trajectories
  const confettiParticles = Array.from({ length: 24 }).map((_, i) => {
    const angle = (i * 15) * (Math.PI / 180);
    const distance = 80 + (i % 4) * 35;
    const colors = ['#10B981', '#007BFF', '#F59E0B', '#EC4899', '#3B82F6', '#14B8A6', '#8B5CF6'];
    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance - 20,
      color: colors[i % colors.length],
      size: 6 + (i % 3) * 2,
      rotation: (i * 45) % 360
    };
  });

  return (
    <AnimatePresence>
      {phase !== 'complete' && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Booking Confirmed Successfully"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-md select-none overflow-hidden"
        >
          {/* Subtle Clean Radial Highlight */}
          <div className="absolute w-[500px] h-[500px] rounded-full bg-emerald-50/60 blur-3xl pointer-events-none -z-10" />

          {/* Central Success Badge Container */}
          <div className="relative flex flex-col items-center justify-center text-center px-6">
            {/* Green Ripple Ring 1 (Triggers at 1.5s) */}
            {showConfetti && (
              <>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.7 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-emerald-400 pointer-events-none"
                />
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ scale: 2.6, opacity: 0 }}
                  transition={{ duration: 1.1, ease: 'easeOut', delay: 0.15 }}
                  className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-emerald-300 pointer-events-none"
                />
              </>
            )}

            {/* Confetti Burst Particles */}
            {showConfetti && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {confettiParticles.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
                    animate={{
                      x: p.x,
                      y: p.y + 60,
                      opacity: [1, 1, 0],
                      scale: [0.4, 1.2, 0.8],
                      rotate: p.rotation + 180
                    }}
                    transition={{
                      duration: 1.4,
                      ease: [0.22, 1, 0.36, 1]
                    }}
                    style={{
                      width: `${p.size}px`,
                      height: `${p.size * 1.5}px`,
                      backgroundColor: p.color
                    }}
                    className="absolute rounded-xs shadow-xs"
                  />
                ))}
              </div>
            )}

            {/* Expanding Green Circle & Animated White Tick */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={
                phase !== 'initial'
                  ? { scale: 1, opacity: 1 }
                  : { scale: 0, opacity: 0 }
              }
              transition={{
                type: 'spring',
                stiffness: 280,
                damping: 20,
                duration: 0.6
              }}
              className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-500 shadow-xl shadow-emerald-500/25 flex items-center justify-center ring-8 ring-emerald-100"
            >
              <svg
                viewBox="0 0 100 100"
                className="w-14 h-14 sm:w-16 sm:h-16 text-white drop-shadow-sm"
              >
                {/* Animated White Tick Stroke */}
                <motion.path
                  d="M 28 50 L 43 65 L 72 35"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={
                    phase === 'tick' || phase === 'celebrate' || phase === 'text'
                      ? { pathLength: 1, opacity: 1 }
                      : { pathLength: 0, opacity: 0 }
                  }
                  transition={{
                    duration: 0.45,
                    ease: 'easeOut'
                  }}
                />
              </svg>
            </motion.div>

            {/* "Booking Confirmed!" Typography (Fades in at 2.0s) */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={
                phase === 'text'
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: 16 }
              }
              transition={{
                duration: 0.45,
                ease: 'easeOut'
              }}
              className="mt-6 space-y-2"
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Order Verified</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Booking Confirmed!
              </h1>

              <p className="text-sm sm:text-base text-slate-500 font-medium max-w-sm mx-auto">
                Your journey is officially booked with SKYNEXA.
              </p>
            </motion.div>
          </div>

          {/* Quick Skip Button at Bottom */}
          <div className="absolute bottom-8 z-20">
            <button
              type="button"
              onClick={handleSkip}
              className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all duration-200 flex items-center gap-1.5 shadow-xs cursor-pointer hover:scale-105 active:scale-95"
            >
              <span>View Booking Details</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BookingConfirmationAnimation;

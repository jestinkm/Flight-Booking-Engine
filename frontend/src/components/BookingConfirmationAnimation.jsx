import React, { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, CheckCircle2, Loader2, Plane } from 'lucide-react';
import { celebrateBookingSuccess } from '../lib/soundEffects';

/**
 * Premium Airline Flight Booking Confirmation Animation
 * 
 * Sequence:
 * 1. (0.0s - 0.7s) Smooth loading state: "Confirming Your Booking..."
 * 2. (0.7s - 2.2s) Beautiful blue aircraft flies across the screen with glowing blue contrails
 * 3. (2.2s - 3.4s) Animated green checkmark drawing, subtle confetti, and "Booking Confirmed!" zoom-in
 * 4. (3.4s+) Smooth fade-out transition to the boarding pass confirmation screen
 */
const BookingConfirmationAnimation = ({ onComplete }) => {
  // Phases: 'confirming' -> 'flight' -> 'success' -> 'fadeout'
  const [phase, setPhase] = useState('confirming');

  useEffect(() => {
    // 1. (0.0s - 0.7s): "Confirming Your Booking..."
    const flightTimer = setTimeout(() => {
      setPhase('flight');
      // Play the soft, elegant two-tone chime and trigger haptic as the jet takes off
      celebrateBookingSuccess();
    }, 700);

    // 2. (0.7s - 2.2s): Aircraft traverses across the screen; transition to green checkmark & confetti
    const successTimer = setTimeout(() => {
      setPhase('success');
    }, 2150);

    // 3. (2.2s - 3.4s): Celebrate with "Booking Confirmed!" zoom-in, then smooth fadeout
    const fadeoutTimer = setTimeout(() => {
      setPhase('fadeout');
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 300);
    }, 3450);

    return () => {
      clearTimeout(flightTimer);
      clearTimeout(successTimer);
      clearTimeout(fadeoutTimer);
    };
  }, [onComplete]);

  const handleSkip = () => {
    setPhase('fadeout');
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 150);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Confirming Your Flight Booking"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden transition-opacity duration-300 select-none ${
        phase === 'fadeout' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <style>{`
        /* Smooth sky-blue aviation gradient background */
        @keyframes skyCanvasGrad {
          0% {
            background: linear-gradient(135deg, #02132b 0%, #062b59 50%, #0a4585 100%);
          }
          100% {
            background: linear-gradient(135deg, #041c3d 0%, #083870 50%, #0d569f 100%);
          }
        }

        /* Aircraft flying across the screen from lower-left to top-right */
        @keyframes flyAcrossScreen {
          0% {
            transform: translate3d(-35vw, 45vh, 0) rotate(16deg) scale(0.65);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          55% {
            transform: translate3d(5vw, 0vh, 0) rotate(22deg) scale(1.05);
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            transform: translate3d(55vw, -55vh, 0) rotate(26deg) scale(1.2);
            opacity: 0;
          }
        }

        /* Glowing blue contrail streaming behind aircraft */
        @keyframes contrailGlowPulse {
          0%, 100% {
            opacity: 0.75;
            width: 280px;
          }
          50% {
            opacity: 0.95;
            width: 380px;
          }
        }

        /* SVG green checkmark drawing keyframe */
        @keyframes drawGreenTick {
          0% {
            stroke-dashoffset: 80;
            opacity: 0;
          }
          25% {
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }

        /* Green checkmark circle pulse */
        @keyframes greenRingGlow {
          0% {
            transform: scale(0.82);
            box-shadow: 0 0 25px rgba(16, 185, 129, 0.4);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 60px rgba(52, 211, 153, 0.8), 0 0 90px rgba(16, 185, 129, 0.4);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 45px rgba(16, 185, 129, 0.6);
          }
        }

        /* Zoom-in text effect */
        @keyframes zoomInTitle {
          0% {
            opacity: 0;
            transform: scale(0.82);
          }
          60% {
            opacity: 1;
            transform: scale(1.03);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* Clouds drift across the screen */
        @keyframes cloudsDrift {
          0% { transform: translate3d(10%, -10%, 0); }
          100% { transform: translate3d(-60%, 40%, 0); }
        }

        /* Confetti particle shimmer */
        @keyframes confettiFall {
          0% {
            transform: translateY(-20vh) rotate(0deg) scale(0.6);
            opacity: 0;
          }
          20% {
            opacity: 0.95;
          }
          80% {
            opacity: 0.95;
          }
          100% {
            transform: translateY(110vh) rotate(380deg) scale(1);
            opacity: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .will-change-transform, .animate-fly {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>

      {/* 1. Background Aviation Sky Canvas */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ animation: 'skyCanvasGrad 2.5s ease-out forwards' }}
      >
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-sky-400/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[550px] h-[350px] bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. Clouds Passing to Create Atmospheric Depth */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div
          className="absolute -top-20 -left-20 w-[550px] h-44 bg-white/20 rounded-full blur-3xl"
          style={{ animation: 'cloudsDrift 8s linear infinite' }}
        />
        <div
          className="absolute top-1/3 -right-20 w-[480px] h-40 bg-sky-200/20 rounded-full blur-3xl"
          style={{ animation: 'cloudsDrift 9s linear infinite 1.5s' }}
        />
      </div>

      {/* 3. Subtle Celebration Confetti (Visible in 'success' phase) */}
      {phase === 'success' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          {[...Array(28)].map((_, i) => {
            const colors = ['#10B981', '#38BDF8', '#007BFF', '#FBBF24', '#34D399', '#60A5FA'];
            const color = colors[i % colors.length];
            const leftPercent = (i * 3.7) % 100;
            const duration = 2.2 + (i % 3) * 0.4;
            const delay = (i * 0.08) % 0.8;
            const width = 6 + (i % 4);
            const height = width * 1.5;
            return (
              <div
                key={i}
                className="absolute rounded-xs shadow-xs"
                style={{
                  left: `${leftPercent}%`,
                  width: `${width}px`,
                  height: `${height}px`,
                  backgroundColor: color,
                  boxShadow: `0 0 8px ${color}`,
                  animation: `confettiFall ${duration}s ease-in-out infinite ${delay}s`
                }}
              />
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STAGE 1: (0.0s - 0.7s) "Confirming Your Booking..."
          ───────────────────────────────────────────────────────────── */}
      {phase === 'confirming' && (
        <div className="relative z-30 flex flex-col items-center max-w-md w-full px-6 text-center animate-fadeIn space-y-4">
          <div className="relative flex items-center justify-center">
            {/* Spinning radar ring */}
            <div className="w-20 h-20 rounded-full border-4 border-sky-400/30 border-t-sky-400 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Plane className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
              Confirming Your Booking...
            </h2>
            <p className="text-xs sm:text-sm text-sky-200 font-medium">
              Verifying passenger details and locking your seat allocation
            </p>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STAGE 2: (0.7s - 2.2s) Blue Aircraft Flying Across Screen
          ───────────────────────────────────────────────────────────── */}
      {phase === 'flight' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-25 flex items-center justify-center">
          <div
            className="absolute will-change-transform"
            style={{
              animation: 'flyAcrossScreen 1.55s cubic-bezier(0.22, 1, 0.36, 1) forwards'
            }}
          >
            {/* High-Fidelity Blue Aircraft SVG */}
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 drop-shadow-[0_15px_30px_rgba(0,123,255,0.7)]">
              {/* Glowing Blue Flight Contrails streaming backwards */}
              <div
                className="absolute right-[88%] top-[54%] h-2.5 rounded-full pointer-events-none origin-right z-0"
                style={{
                  background: 'linear-gradient(to left, rgba(56, 189, 248, 0.95), rgba(0, 123, 255, 0.6), transparent)',
                  boxShadow: '0 0 20px rgba(56, 189, 248, 0.9), 0 0 35px rgba(0, 123, 255, 0.6)',
                  animation: 'contrailGlowPulse 1.2s ease-in-out infinite'
                }}
              />
              <div
                className="absolute right-[88%] top-[42%] h-2 rounded-full pointer-events-none origin-right z-0"
                style={{
                  background: 'linear-gradient(to left, rgba(56, 189, 248, 0.95), rgba(0, 123, 255, 0.6), transparent)',
                  boxShadow: '0 0 16px rgba(56, 189, 248, 0.9)',
                  animation: 'contrailGlowPulse 1.2s ease-in-out infinite 0.1s'
                }}
              />

              <svg
                viewBox="0 0 160 160"
                className="w-full h-full relative z-10"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="planeBodyBlue" x1="0" y1="80" x2="160" y2="80" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#0B3B70" />
                    <stop offset="40%" stopColor="#007BFF" />
                    <stop offset="75%" stopColor="#38BDF8" />
                    <stop offset="100%" stopColor="#FFFFFF" />
                  </linearGradient>

                  <linearGradient id="planeWingsBlue" x1="80" y1="10" x2="80" y2="150" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#0284C7" />
                    <stop offset="50%" stopColor="#38BDF8" />
                    <stop offset="100%" stopColor="#007BFF" />
                  </linearGradient>

                  <radialGradient id="jetEngineGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="40%" stopColor="#38BDF8" />
                    <stop offset="100%" stopColor="#007BFF" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Swept Main Wings */}
                <path
                  d="M75 80 L35 140 L45 142 L95 86 L115 84 L145 142 L150 138 Z"
                  fill="url(#planeWingsBlue)"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="1"
                />

                {/* Horizontal Stabilizers / Tailplanes */}
                <path
                  d="M20 78 L5 94 L9 96 L32 82 Z"
                  fill="#0369A1"
                />
                <path
                  d="M20 82 L5 66 L9 64 L32 78 Z"
                  fill="#0369A1"
                />

                {/* Fuselage (Airframe Body) */}
                <path
                  d="M12 76 C12 76 45 74 100 74 C140 74 156 78 156 80 C156 82 140 86 100 86 C45 86 12 84 12 84 C8 84 6 80 12 76 Z"
                  fill="url(#planeBodyBlue)"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth="1.2"
                />

                {/* Cockpit Windshield */}
                <polygon points="144,78 152,80 144,82 140,80" fill="#082F49" />

                {/* Twin Jet Engines Under Wings with Blue Reheat Flame */}
                <rect x="62" y="94" width="22" height="7" rx="3.5" fill="#0C4A6E" />
                <circle cx="62" cy="97.5" r="4.5" fill="url(#jetEngineGlow)" />

                <rect x="88" y="58" width="22" height="7" rx="3.5" fill="#0C4A6E" />
                <circle cx="88" cy="61.5" r="4.5" fill="url(#jetEngineGlow)" />

                {/* Wingtip Navigation Lights */}
                <circle cx="36" cy="141" r="2.5" fill="#10B981" className="drop-shadow-[0_0_8px_#10B981]" />
                <circle cx="148" cy="140" r="2.5" fill="#EF4444" className="drop-shadow-[0_0_8px_#EF4444]" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STAGE 3: (2.2s - 3.4s) Green Checkmark & "Booking Confirmed!" Zoom-In
          ───────────────────────────────────────────────────────────── */}
      {phase === 'success' && (
        <div
          className="relative z-30 flex flex-col items-center max-w-lg w-full px-6 text-center"
          style={{ animation: 'zoomInTitle 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
        >
          {/* Animated Green Checkmark Badge */}
          <div className="relative flex items-center justify-center my-5">
            {/* Emerald Backlight Ripple */}
            <div className="absolute w-40 h-40 rounded-full bg-emerald-400/20 animate-ping" />
            <div className="absolute w-32 h-32 rounded-full bg-emerald-500/25 animate-pulse" />

            <div
              className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center ring-8 ring-emerald-300/30"
              style={{ animation: 'greenRingGlow 1.2s ease-out forwards' }}
            >
              <svg className="w-14 h-14 sm:w-16 sm:h-16 text-white drop-shadow-md" viewBox="0 0 52 52">
                <circle
                  cx="26"
                  cy="26"
                  r="23"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.35)"
                  strokeWidth="3.5"
                />
                <path
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="80"
                  strokeDashoffset="0"
                  d="M14 27l8 8 16-16"
                  style={{ animation: 'drawGreenTick 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards' }}
                />
              </svg>
            </div>
          </div>

          {/* Zoom-In Typography */}
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-400/15 border border-emerald-300/30 text-emerald-200 text-[11px] font-black uppercase tracking-widest shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Official Reservation Confirmed</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">
              Booking Confirmed!
            </h1>

            <p className="text-sm sm:text-base text-sky-100 font-semibold max-w-md mx-auto leading-relaxed">
              Your Journey Begins with SKYNEXA.
            </p>
          </div>
        </div>
      )}

      {/* 4. Quick Skip / Direct View Button at Bottom */}
      <div className="absolute bottom-8 z-40 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSkip}
          className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/25 text-white text-xs font-bold transition-all duration-200 flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
        >
          <span>View Boarding Pass &amp; Ticket</span>
          <ArrowRight className="w-3.5 h-3.5 text-sky-300" />
        </button>
      </div>
    </div>
  );
};

export default BookingConfirmationAnimation;

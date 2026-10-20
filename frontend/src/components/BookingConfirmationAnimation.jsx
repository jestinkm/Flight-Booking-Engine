import React, { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, Volume2, BellRing } from 'lucide-react';
import { celebrateBookingSuccess, playBookingSuccessSound, triggerBookingSuccessVibration } from '../lib/soundEffects';

const BookingConfirmationAnimation = ({ onComplete }) => {
  const [phase, setPhase] = useState('tick'); // 'tick' -> 'flight' -> 'fadeout'
  const [soundActive, setSoundActive] = useState(true);

  useEffect(() => {
    // Immediately fire luxury airline cabin chime and haptic vibration pattern
    try {
      celebrateBookingSuccess();
    } catch (e) {
      console.debug('Audio/Haptic celebration auto-trigger:', e);
    }

    // 0.9s: Rapid smooth transition from central blue tick to climbing airplane takeoff
    const flightTimer = setTimeout(() => {
      setPhase('flight');
    }, 900);

    // 2.3s: Trigger fadeout and reveal the confirmation card instantly
    const completeTimer = setTimeout(() => {
      setPhase('fadeout');
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 250);
    }, 2300);

    return () => {
      clearTimeout(flightTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const handleSkip = () => {
    setPhase('fadeout');
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 150);
  };

  const handleReplayChime = (e) => {
    e.stopPropagation();
    setSoundActive(true);
    celebrateBookingSuccess();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Flight Booking Confirmed"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden transition-opacity duration-300 select-none ${
        phase === 'fadeout' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <style>{`
        /* Soft sky-blue gradient transition */
        @keyframes skyGradientShift {
          0% {
            background: linear-gradient(180deg, #031024 0%, #062349 50%, #093b70 100%);
          }
          100% {
            background: linear-gradient(180deg, #071f3f 0%, #0a3d75 45%, #0f62b0 100%);
          }
        }

        /* SVG checkmark drawing keyframe */
        @keyframes drawBlueTick {
          0% {
            stroke-dashoffset: 100;
            opacity: 0;
          }
          30% {
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }

        /* Blue tick circle pulse and glow */
        @keyframes tickCircleGlow {
          0% {
            transform: scale(0.85);
            box-shadow: 0 0 25px rgba(0, 123, 255, 0.4);
          }
          50% {
            transform: scale(1.04);
            box-shadow: 0 0 65px rgba(56, 189, 248, 0.85), 0 0 100px rgba(0, 123, 255, 0.5);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 45px rgba(0, 123, 255, 0.65);
          }
        }

        /* Airplane enters from bottom center and accelerates towards top */
        @keyframes airplaneAscent {
          0% {
            transform: translate3d(-50%, 120vh, 0) scale(0.75);
            opacity: 0;
          }
          15% {
            transform: translate3d(-50%, 75vh, 0) scale(0.9);
            opacity: 1;
          }
          50% {
            transform: translate3d(-50%, 35vh, 0) scale(1.05);
            opacity: 1;
          }
          85% {
            transform: translate3d(-50%, -40vh, 0) scale(1.15);
            opacity: 1;
          }
          100% {
            transform: translate3d(-50%, -120vh, 0) scale(1.25);
            opacity: 0;
          }
        }

        /* Continuous glowing contrail streaming downwards */
        @keyframes contrailStream {
          0% {
            height: 120px;
            opacity: 0.6;
          }
          50% {
            height: 320px;
            opacity: 0.95;
          }
          100% {
            height: 120px;
            opacity: 0.6;
          }
        }

        /* Clouds moving downward to simulate aircraft climbing */
        @keyframes cloudsDescend {
          0% { transform: translateY(-20%); }
          100% { transform: translateY(120%); }
        }

        /* Floating celebratory sparkle particles */
        @keyframes sparkleFloat {
          0% {
            transform: translateY(100vh) scale(0.6);
            opacity: 0;
          }
          20% {
            opacity: 0.9;
          }
          80% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(-20vh) scale(1.2);
            opacity: 0;
          }
        }
      `}</style>

      {/* 1. Background Sky-Blue Transition Canvas */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ animation: 'skyGradientShift 1.5s ease-out forwards' }}
      >
        {/* Soft Radial Sky-Blue Glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-sky-400/20 rounded-full blur-3xl pointer-events-none animate-pulseSubtle" />
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[550px] h-[350px] bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. Clouds Passing Downwards to Sensation of Climb */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-25">
        <div
          className="absolute -top-40 left-10 w-96 h-36 bg-white/20 rounded-full blur-2xl"
          style={{ animation: 'cloudsDescend 4s linear infinite' }}
        />
        <div
          className="absolute -top-32 right-12 w-[420px] h-40 bg-sky-200/20 rounded-full blur-3xl"
          style={{ animation: 'cloudsDescend 3.5s linear infinite 0.8s' }}
        />
        <div
          className="absolute -top-60 left-1/3 w-[500px] h-48 bg-white/15 rounded-full blur-3xl"
          style={{ animation: 'cloudsDescend 4.5s linear infinite 1.5s' }}
        />
      </div>

      {/* 3. Celebration Particle Shimmer Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        {[...Array(24)].map((_, i) => {
          const colors = ['#38BDF8', '#007BFF', '#BAE6FD', '#FDE047', '#60A5FA'];
          const color = colors[i % colors.length];
          const leftPercent = (i * 4.2) % 100;
          const duration = 2.4 + (i % 2);
          const delay = (i * 0.1) % 1.2;
          const size = 6 + (i % 5);
          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${leftPercent}%`,
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: color,
                boxShadow: `0 0 10px ${color}`,
                animation: `sparkleFloat ${duration}s ease-in-out infinite ${delay}s`
              }}
            />
          );
        })}
      </div>

      {/* Sound & Haptic Indicator Pill */}
      <div className="absolute top-6 right-6 z-40">
        <button
          type="button"
          onClick={handleReplayChime}
          title="Replay Cabin Chime & Haptic Vibration"
          className="px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/25 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg cursor-pointer hover:scale-105 active:scale-95"
        >
          <Volume2 className="w-3.5 h-3.5 text-sky-300 animate-pulse" />
          <span>Cabin Chime Active</span>
        </button>
      </div>

      {/* 4. Sequence Part 1: Large Blue Tick (✓) & Confirmation Typography */}
      <div
        className={`relative z-20 flex flex-col items-center max-w-lg w-full px-6 text-center transition-all duration-500 ${
          phase === 'tick'
            ? 'opacity-100 scale-100'
            : 'opacity-40 scale-95 pointer-events-none'
        }`}
      >
        {/* Large Blue Tick Circle */}
        <div className="relative flex items-center justify-center my-6">
          {/* Pulsing Backlight Wave */}
          <div className="absolute w-44 h-44 rounded-full bg-sky-400/20 animate-ping" />
          <div className="absolute w-32 h-32 rounded-full bg-blue-500/25 animate-pulse" />

          {/* Glowing Center Badge */}
          <div
            className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-[#0062cc] via-[#007BFF] to-[#38BDF8] flex items-center justify-center ring-8 ring-sky-300/30"
            style={{ animation: 'tickCircleGlow 1.5s ease-out forwards' }}
          >
            <svg className="w-18 h-18 sm:w-20 sm:h-20 text-white drop-shadow-lg" viewBox="0 0 52 52">
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
                strokeDasharray="100"
                strokeDashoffset="0"
                d="M14 27l8 8 16-16"
                style={{ animation: 'drawBlueTick 0.7s cubic-bezier(0.65, 0, 0.45, 1) forwards' }}
              />
            </svg>
          </div>
        </div>

        {/* Text Sequence */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-400/15 border border-sky-300/30 text-sky-200 text-xs font-black uppercase tracking-widest shadow-inner">
            <Sparkles className="w-4 h-4 text-sky-300" />
            <span>Official Booking &amp; Seat Allocation Confirmed</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">
            Booking Confirmed!
          </h1>

          <p className="text-base sm:text-lg text-sky-100 font-semibold max-w-md mx-auto leading-relaxed">
            Your Journey Begins with SKYNEXA.
          </p>
        </div>
      </div>

      {/* 5. Sequence Part 2: Modern Blue Airplane Ascending towards Top */}
      {phase !== 'tick' && (
        <div
          className="absolute left-1/2 bottom-0 z-30 pointer-events-none will-change-transform"
          style={{
            animation: 'airplaneAscent 1.6s cubic-bezier(0.22, 1, 0.36, 1) forwards'
          }}
        >
          {/* Dual Luminous Blue Flight Contrails (Behind Jet Engines) */}
          <div className="absolute left-1/2 -translate-x-1/2 top-[120px] flex gap-12 pointer-events-none z-0">
            {/* Left Engine Contrail */}
            <div
              className="w-2 rounded-full blur-[1.5px] bg-gradient-to-b from-sky-300 via-sky-400/70 to-transparent shadow-[0_0_15px_rgba(56,189,248,0.9)]"
              style={{ animation: 'contrailStream 1.2s ease-in-out infinite' }}
            />
            {/* Right Engine Contrail */}
            <div
              className="w-2 rounded-full blur-[1.5px] bg-gradient-to-b from-sky-300 via-sky-400/70 to-transparent shadow-[0_0_15px_rgba(56,189,248,0.9)]"
              style={{ animation: 'contrailStream 1.2s ease-in-out infinite 0.1s' }}
            />
          </div>

          {/* High-Fidelity Jet Airliner Pointed Upward */}
          <div className="relative z-10 w-44 h-44 sm:w-52 sm:h-52 drop-shadow-[0_20px_35px_rgba(0,123,255,0.7)]">
            <svg
              viewBox="0 0 160 160"
              className="w-full h-full"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="planeAscentBody" x1="80" y1="10" x2="80" y2="150" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="35%" stopColor="#E0F2FE" />
                  <stop offset="70%" stopColor="#007BFF" />
                  <stop offset="100%" stopColor="#082F49" />
                </linearGradient>

                <linearGradient id="planeAscentWings" x1="10" y1="80" x2="150" y2="80" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#0284C7" />
                  <stop offset="50%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#0284C7" />
                </linearGradient>

                <radialGradient id="jetBurner" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="40%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#007BFF" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Swept Main Wings */}
              <path
                d="M80 62 L10 105 L26 112 L80 84 L134 112 L150 105 Z"
                fill="url(#planeAscentWings)"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="1"
              />

              {/* Horizontal Stabilizers / Tailplanes */}
              <path
                d="M80 134 L52 152 L60 156 L80 144 L100 156 L108 152 Z"
                fill="#0369A1"
              />

              {/* Fuselage / Aerodynamic Body */}
              <path
                d="M80 12 C74 12 70 30 70 65 L70 128 C70 138 74 146 80 146 C86 146 90 138 90 128 L90 65 C90 30 86 12 80 12 Z"
                fill="url(#planeAscentBody)"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="1.2"
              />

              {/* Cockpit Windshield */}
              <ellipse cx="80" cy="28" rx="5.5" ry="8" fill="#082F49" />

              {/* Twin Jet Engines Under Wings with Active Reheat Afterburner */}
              <rect x="52" y="86" width="9" height="20" rx="4.5" fill="#0C4A6E" />
              <circle cx="56.5" cy="106" r="4.5" fill="url(#jetBurner)" />

              <rect x="99" y="86" width="9" height="20" rx="4.5" fill="#0C4A6E" />
              <circle cx="103.5" cy="106" r="4.5" fill="url(#jetBurner)" />

              {/* Wingtip Navigation Lights */}
              <circle cx="12" cy="106" r="2.5" fill="#EF4444" className="drop-shadow-[0_0_8px_#EF4444]" />
              <circle cx="148" cy="106" r="2.5" fill="#10B981" className="drop-shadow-[0_0_8px_#10B981]" />
            </svg>
          </div>
        </div>
      )}

      {/* 6. Quick Skip / Direct View Button at Bottom */}
      <div className="absolute bottom-8 z-30 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSkip}
          className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/25 text-white text-xs font-bold transition-all duration-200 flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
        >
          <span>View Ticket &amp; Booking Details</span>
          <ArrowRight className="w-3.5 h-3.5 text-sky-300" />
        </button>
      </div>
    </div>
  );
};

export default BookingConfirmationAnimation;

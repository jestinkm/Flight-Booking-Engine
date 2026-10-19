import React, { useEffect, useState } from 'react';
import { useLoading } from '../context/LoadingContext';

const NetworkLoadingOverlay = () => {
  const { isLoading, loadingMessage } = useLoading();
  const [dots, setDots] = useState('');

  // Subtle animated ellipsis
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 450);
    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading content"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#020b18]/85 backdrop-blur-md transition-all duration-300 ease-in-out select-none ${
        isLoading
          ? 'opacity-100 pointer-events-auto visible'
          : 'opacity-0 pointer-events-none invisible'
      }`}
    >
      <style>{`
        @keyframes cloudDriftSlow {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(250%); }
        }
        @keyframes cloudDriftFast {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(220%); }
        }
        @keyframes airplaneHover {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(-1.5deg); }
        }
        @keyframes pulseGlowRing {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.08); opacity: 0.95; }
        }
        @keyframes radarTrackSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes radarTrackReverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>

      {/* 1. Atmospheric Moving Clouds Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        {/* Cloud 1 (Top-Left to Right, Slow) */}
        <div
          className="absolute top-16 left-0 w-80 h-28 bg-gradient-to-r from-sky-400/20 via-white/20 to-transparent rounded-full blur-2xl"
          style={{ animation: 'cloudDriftSlow 24s linear infinite' }}
        />
        {/* Cloud 2 (Mid-Sky, Faster) */}
        <div
          className="absolute top-1/2 -mt-20 left-0 w-96 h-36 bg-gradient-to-r from-transparent via-sky-300/15 to-transparent rounded-full blur-3xl"
          style={{ animation: 'cloudDriftFast 16s linear infinite 3s' }}
        />
        {/* Cloud 3 (Lower Atmosphere) */}
        <div
          className="absolute bottom-24 left-0 w-88 h-32 bg-gradient-to-r from-sky-500/15 via-white/10 to-transparent rounded-full blur-2xl"
          style={{ animation: 'cloudDriftSlow 20s linear infinite 7s' }}
        />
      </div>

      {/* 2. Central Elevated Airline Loader Card */}
      <div className="relative z-10 flex flex-col items-center max-w-sm mx-4 p-8 rounded-3xl bg-gradient-to-b from-[#091f3d]/90 to-[#051429]/95 border border-sky-400/20 shadow-2xl shadow-sky-950/60 text-center">
        {/* Outer Glowing Atmospheric Aura */}
        <div
          className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-sky-500/20 via-blue-500/10 to-sky-400/20 blur-xl pointer-events-none"
          style={{ animation: 'pulseGlowRing 3s infinite ease-in-out' }}
        />

        {/* 3. Rotating Circular Radar & Animated Blue Airplane */}
        <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center my-2">
          {/* Subtle Outer Radar Halo */}
          <div className="absolute inset-0 rounded-full border border-sky-500/20 bg-sky-500/5" />

          {/* Clockwise Outer Circular Loading Indicator */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            style={{ animation: 'radarTrackSpin 2s linear infinite' }}
          >
            <defs>
              <linearGradient id="skynexaRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#007BFF" stopOpacity="1" />
                <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#007BFF" stopOpacity="0" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="url(#skynexaRingGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="180 90"
            />
          </svg>

          {/* Counter-Clockwise Inner Dashed Radar Ring */}
          <svg
            className="absolute inset-3 w-[calc(100%-24px)] h-[calc(100%-24px)] opacity-50"
            viewBox="0 0 100 100"
            style={{ animation: 'radarTrackReverse 4s linear infinite' }}
          >
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="1.5"
              strokeDasharray="6 8"
            />
          </svg>

          {/* Central Blue Airplane Vessel */}
          <div
            className="relative z-10 w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center text-sky-400 drop-shadow-[0_0_15px_rgba(0,123,255,0.7)]"
            style={{ animation: 'airplaneHover 2.6s ease-in-out infinite' }}
          >
            <svg
              viewBox="0 0 64 64"
              className="w-full h-full"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Airplane Body / Fuselage */}
              <path
                d="M32 6 C30 6 28.5 12 28.5 22 L28.5 36 L6 42 L6 46 L28.5 41 L28.5 52 L22 55 L22 58 L32 56 L42 58 L42 55 L35.5 52 L35.5 41 L58 46 L58 42 L35.5 36 L35.5 22 C35.5 12 34 6 32 6 Z"
                fill="url(#planeBodyGrad)"
                stroke="#38BDF8"
                strokeWidth="1"
              />
              {/* Cockpit Window Glint */}
              <ellipse cx="32" cy="14" rx="2.2" ry="4" fill="#E0F2FE" />
              {/* Jet Engine Glow Pods */}
              <rect x="20" y="38" width="3" height="6" rx="1.5" fill="#38BDF8" className="animate-pulse" />
              <rect x="41" y="38" width="3" height="6" rx="1.5" fill="#38BDF8" className="animate-pulse" />

              <defs>
                <linearGradient id="planeBodyGrad" x1="16" y1="6" x2="48" y2="58" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#38BDF8" />
                  <stop offset="0.45" stopColor="#007BFF" />
                  <stop offset="1" stopColor="#0C4A6E" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* 4. Dynamic Journey Message */}
        <div className="mt-4 space-y-1.5">
          <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
            {loadingMessage || 'Preparing Your Journey'}
            <span className="inline-block w-4 text-left text-sky-400 font-mono">{dots}</span>
          </h3>
          <p className="text-xs text-slate-300 font-medium">
            Connecting to SKYNEXA Global Flight Network
          </p>
        </div>

        {/* 5. Minimal Aviation Telemetry Line */}
        <div className="mt-4 pt-3 border-t border-white/10 w-full flex items-center justify-center gap-3 text-[10px] font-mono text-sky-300/80">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            LIVE TELEMETRY
          </span>
          <span className="text-slate-500">•</span>
          <span>EST 60 FPS</span>
        </div>
      </div>
    </div>
  );
};

export default NetworkLoadingOverlay;

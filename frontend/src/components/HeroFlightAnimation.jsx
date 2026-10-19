import React from 'react';

const HeroFlightAnimation = () => {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0"
      aria-hidden="true"
    >
      <style>{`
        /* Realistic continuous flight across the hero sky */
        @keyframes flightTrajectory {
          0% {
            transform: translate3d(-240px, 140px, 0) rotate(16deg) scale(0.85);
            opacity: 0;
          }
          4% {
            opacity: 1;
          }
          30% {
            transform: translate3d(25vw, 60px, 0) rotate(13deg) scale(0.92);
          }
          55% {
            transform: translate3d(55vw, 20px, 0) rotate(9deg) scale(1);
          }
          75% {
            transform: translate3d(80vw, -10px, 0) rotate(6deg) scale(0.95);
          }
          96% {
            opacity: 0.9;
          }
          100% {
            transform: translate3d(115vw, -60px, 0) rotate(4deg) scale(0.88);
            opacity: 0;
          }
        }

        /* Subtle aerodynamic lift and banking micro-float */
        @keyframes aeroFloat {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-5px) rotate(-1.5deg);
          }
        }

        /* Contrail jet engine exhaust shimmer */
        @keyframes contrailFlow {
          0% {
            opacity: 0.55;
            width: 180px;
          }
          50% {
            opacity: 0.85;
            width: 230px;
          }
          100% {
            opacity: 0.55;
            width: 180px;
          }
        }

        /* Wingtip strobe light beacon */
        @keyframes strobeFlash {
          0%, 90%, 100% {
            opacity: 0.2;
            transform: scale(0.8);
          }
          95% {
            opacity: 1;
            transform: scale(1.6);
          }
        }

        /* Parallax cloud movements */
        @keyframes cloudDriftLayer1 {
          0% { transform: translate3d(-100%, 0, 0); }
          100% { transform: translate3d(180vw, 0, 0); }
        }
        @keyframes cloudDriftLayer2 {
          0% { transform: translate3d(-80%, 0, 0); }
          100% { transform: translate3d(160vw, 0, 0); }
        }
        @keyframes cloudDriftLayer3 {
          0% { transform: translate3d(-120%, 0, 0); }
          100% { transform: translate3d(200vw, 0, 0); }
        }
      `}</style>

      {/* 1. Atmospheric Moving Cloud Layers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35">
        {/* Cloud 1 (High Altitude Cirrus Layer) */}
        <div
          className="absolute top-10 left-0 w-[500px] h-28 bg-gradient-to-r from-transparent via-sky-400/20 to-transparent rounded-full blur-3xl"
          style={{ animation: 'cloudDriftLayer1 32s linear infinite' }}
        />
        {/* Cloud 2 (Mid-Sky Stratocumulus Layer) */}
        <div
          className="absolute top-36 left-0 w-[650px] h-36 bg-gradient-to-r from-transparent via-white/15 to-transparent rounded-full blur-3xl"
          style={{ animation: 'cloudDriftLayer2 24s linear infinite 5s' }}
        />
        {/* Cloud 3 (Lower Horizon Layer) */}
        <div
          className="absolute top-64 left-0 w-[450px] h-32 bg-gradient-to-r from-transparent via-sky-300/15 to-transparent rounded-full blur-2xl"
          style={{ animation: 'cloudDriftLayer3 28s linear infinite 12s' }}
        />
      </div>

      {/* 2. Primary Flying Airplane Assembly */}
      <div
        className="absolute top-12 left-0 will-change-transform pointer-events-none"
        style={{
          animation: 'flightTrajectory 22s cubic-bezier(0.25, 0.1, 0.25, 1) infinite',
          animationDelay: '1s'
        }}
      >
        {/* Aerodynamic Micro-Float Container */}
        <div
          className="relative flex items-center"
          style={{ animation: 'aeroFloat 3s ease-in-out infinite' }}
        >
          {/* Luminous Glowing Jet Engine Contrail (Emitted behind aircraft) */}
          <div className="absolute right-[92px] top-[24px] pointer-events-none flex flex-col gap-[14px] z-0">
            {/* Top Engine Contrail */}
            <div
              className="h-[3.5px] rounded-full blur-[1px] bg-gradient-to-l from-sky-400 via-sky-300/60 to-transparent shadow-[0_0_12px_rgba(56,189,248,0.8)]"
              style={{ animation: 'contrailFlow 2.5s ease-in-out infinite' }}
            />
            {/* Bottom Engine Contrail */}
            <div
              className="h-[3.5px] rounded-full blur-[1px] bg-gradient-to-l from-sky-400 via-sky-300/60 to-transparent shadow-[0_0_12px_rgba(56,189,248,0.8)]"
              style={{ animation: 'contrailFlow 2.5s ease-in-out infinite 0.2s' }}
            />
          </div>

          {/* Precision High-Fidelity Jet Airliner SVG */}
          <div className="relative z-10 w-44 h-24 sm:w-52 sm:h-28 drop-shadow-[0_12px_28px_rgba(0,123,255,0.45)]">
            <svg
              viewBox="0 0 240 120"
              className="w-full h-full"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Fuselage Metallic Pearl Gradient */}
                <linearGradient id="fuselageGrad" x1="0" y1="50" x2="220" y2="70" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#0B2545" />
                  <stop offset="25%" stopColor="#007BFF" />
                  <stop offset="55%" stopColor="#FFFFFF" />
                  <stop offset="85%" stopColor="#E0F2FE" />
                  <stop offset="100%" stopColor="#BAE6FD" />
                </linearGradient>

                {/* Swept Wing Gradient */}
                <linearGradient id="wingGrad" x1="50" y1="20" x2="160" y2="90" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#0284C7" />
                  <stop offset="50%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#FFFFFF" />
                </linearGradient>

                {/* Jet Engine Glow */}
                <radialGradient id="engineGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity="1" />
                  <stop offset="100%" stopColor="#007BFF" stopOpacity="0.1" />
                </radialGradient>
              </defs>

              {/* Far Swept Wing (Port Wing) */}
              <path
                d="M110 52 L60 12 L78 12 L146 54 Z"
                fill="#0369A1"
                opacity="0.9"
              />
              {/* Far Engine Pod */}
              <ellipse cx="88" cy="24" rx="14" ry="4.5" fill="#0C4A6E" />
              <ellipse cx="78" cy="24" rx="4" ry="4" fill="url(#engineGlow)" />

              {/* Vertical Tail Stabilizer with SKYNEXA Blue Accent */}
              <path
                d="M32 54 L12 18 L28 18 L62 56 Z"
                fill="url(#wingGrad)"
              />
              {/* Tail Fin Stripe */}
              <path
                d="M16 22 L24 22 L45 54 L38 54 Z"
                fill="#007BFF"
              />

              {/* Horizontal Stabilizer (Tailplane) */}
              <path
                d="M24 58 L8 68 L16 69 L38 60 Z"
                fill="#0284C7"
              />

              {/* Main Fuselage Body (Aerodynamic Streamlined Shape) */}
              <path
                d="M222 62 C210 54 180 50 130 50 C70 50 24 54 18 58 C14 61 14 65 18 68 C24 72 70 76 130 76 C180 76 210 72 222 64 C225 63 225 63 222 62 Z"
                fill="url(#fuselageGrad)"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="0.8"
              />

              {/* Cockpit Windshield (Dark Glint) */}
              <path
                d="M206 58 C202 56 195 56 190 57 L192 61 C198 61 204 60 206 58 Z"
                fill="#082F49"
              />

              {/* Passenger Cabin Window Row (Warm Interior Illumination) */}
              {[70, 82, 94, 106, 118, 130, 142, 154, 166, 178].map((x) => (
                <rect
                  key={x}
                  x={x}
                  y={59}
                  width="4"
                  height="2.5"
                  rx="1.2"
                  fill="#FEF08A"
                  opacity="0.9"
                />
              ))}

              {/* Near Swept Wing (Starboard Main Wing with Winglet) */}
              <path
                d="M125 66 L82 108 L100 108 L165 67 Z"
                fill="url(#wingGrad)"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="0.5"
              />
              {/* Starboard Winglet */}
              <path
                d="M82 108 L84 100 L88 102 L85 108 Z"
                fill="#007BFF"
              />

              {/* Near Engine Pod (Mounted Below Main Wing) */}
              <ellipse cx="112" cy="88" rx="16" ry="5.5" fill="#0C4A6E" />
              <ellipse cx="124" cy="88" rx="4" ry="4.5" fill="#E0F2FE" />
              <ellipse cx="100" cy="88" rx="4" ry="4.5" fill="url(#engineGlow)" />

              {/* Authentic Navigation Lights & Strobe Beacons */}
              {/* Starboard Wingtip Green Nav Light */}
              <circle
                cx="83"
                cy="104"
                r="2"
                fill="#10B981"
                className="drop-shadow-[0_0_6px_#10B981]"
              />
              {/* Port Wingtip Red Nav Light */}
              <circle
                cx="61"
                cy="13"
                r="2"
                fill="#EF4444"
                className="drop-shadow-[0_0_6px_#EF4444]"
              />
              {/* Anti-Collision White Strobe Light on Tail Fin */}
              <circle
                cx="12"
                cy="18"
                r="2.5"
                fill="#FFFFFF"
                style={{ animation: 'strobeFlash 1.2s infinite' }}
              />
              {/* Belly Strobe Light */}
              <circle
                cx="130"
                cy="76"
                r="2.2"
                fill="#FFFFFF"
                style={{ animation: 'strobeFlash 1.2s infinite 0.6s' }}
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroFlightAnimation;

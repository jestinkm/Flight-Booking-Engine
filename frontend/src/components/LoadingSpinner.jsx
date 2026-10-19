import React from 'react';
import { Plane } from 'lucide-react';

const LoadingSpinner = ({ message = 'Connecting to SKYNEXA...', size = 'md', className = '' }) => {
  const containerSizes = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-9 h-9'
  };

  return (
    <div className={`flex flex-col items-center justify-center py-10 px-4 ${className}`}>
      {/* Animated Blue Airplane with Rotating Circular Radar Track */}
      <div className={`relative ${containerSizes[size] || containerSizes.md} flex items-center justify-center mb-4`}>
        {/* Rotating Circular Indicator */}
        <svg
          className="absolute inset-0 w-full h-full animate-spin"
          style={{ animationDuration: '2s' }}
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="rgba(0, 123, 255, 0.15)"
            strokeWidth="5"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#007BFF"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="160 100"
          />
        </svg>

        {/* Center Floating Airplane */}
        <div className="relative text-skyblue animate-pulseSubtle">
          <Plane className={`${iconSizes[size] || iconSizes.md} transform rotate-45 text-skyblue`} />
        </div>
      </div>

      {message && (
        <p className="text-slate-600 text-xs sm:text-sm font-bold tracking-wide animate-pulse text-center">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;

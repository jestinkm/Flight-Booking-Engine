import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ message = 'Loading...', size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <Loader2 className={`${sizeClasses[size] || sizeClasses.md} text-skyblue animate-spin mb-3`} />
      {message && <p className="text-slate-500 text-sm font-medium animate-pulse">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;

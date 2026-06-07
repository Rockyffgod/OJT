import React from 'react';

interface SuccessAnimationProps {
  message: string;
}

export default function SuccessAnimation({ message }: SuccessAnimationProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-xl border border-slate-100 dark:border-slate-700/80 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-200">
        
        {/* Animated Checkmark SVG */}
        <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
          {/* Outer Ring Glow - matching the checkmark circle size exactly */}
          <div className="absolute w-[53.3px] h-[53.3px] rounded-full bg-emerald-500/15 dark:bg-emerald-500/25 animate-ping" style={{ animationDuration: '1.5s' }} />
          
          <svg
            className="w-16 h-16 text-emerald-500 relative z-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Circle around the check */}
            <circle
              cx="12"
              cy="12"
              r="10"
              strokeDasharray="63"
              strokeDashoffset="63"
              style={{
                animation: 'drawCircle 0.6s ease-out forwards',
              }}
            />
            {/* The checkmark itself */}
            <path
              d="M7.5 12.5l3 3l6.5 -6.5"
              strokeDasharray="20"
              strokeDashoffset="20"
              style={{
                animation: 'drawCheck 0.4s ease-out 0.4s forwards',
              }}
            />
          </svg>
        </div>

        {/* Text Details */}
        <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-slate-100 mb-1 animate-slide-up-fade">
          {message}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 animate-slide-up-fade-delayed">
          Redirecting you shortly...
        </p>

        {/* CSS Animation definitions injected dynamically */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes drawCircle {
            to { stroke-dashoffset: 0; }
          }
          @keyframes drawCheck {
            to { stroke-dashoffset: 0; }
          }
          .animate-slide-up-fade {
            animation: slideUpFade 0.5s ease-out 0.5s forwards;
            opacity: 0;
            transform: translateY(10px);
          }
          .animate-slide-up-fade-delayed {
            animation: slideUpFade 0.5s ease-out 0.8s forwards;
            opacity: 0;
            transform: translateY(10px);
          }
          @keyframes slideUpFade {
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}} />
      </div>
    </div>
  );
}

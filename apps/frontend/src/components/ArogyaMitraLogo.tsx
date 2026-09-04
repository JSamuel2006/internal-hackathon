import React from 'react';

export interface LogoIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

/**
 * ArogyaMitra Canonical Healthcare Logo Icon
 * Features:
 * - Rounded square teal gradient background
 * - Two person figures uniting into a heart outline
 * - Central medical cross symbol
 * - Bottom supporting care leaves
 */
export const ArogyaMitraIcon: React.FC<LogoIconProps> = ({
  size = 32,
  className = '',
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="ArogyaMitra Healthcare Icon"
      {...props}
    >
      <defs>
        <linearGradient id="arogyaTealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00C4A7" />
          <stop offset="50%" stopColor="#00B2B2" />
          <stop offset="100%" stop-color="#009688" />
        </linearGradient>
        <linearGradient id="arogyaLeafGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E0F7FA" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#B2EBF2" stopOpacity="0.8" />
        </linearGradient>
      </defs>

      {/* Main Rounded Square Container */}
      <rect width="100" height="100" rx="24" fill="url(#arogyaTealGrad)" />

      {/* Human Figures + Heart Shape */}
      {/* Left Person Head */}
      <circle cx="36" cy="22" r="5.5" fill="#FFFFFF" />
      {/* Left Person Body & Left Heart Arch */}
      <path
        d="M 36 29 C 30 29 24 32.5 21 38.5 C 17.5 45.5 17.5 53 23 60 C 29 67.5 39 74.5 50 81 C 39.5 70 31.5 61.5 29.5 51.5 C 28.5 44 32.5 37.5 37.5 35 C 41.5 33 46 34.5 50 39 C 45.5 32.5 41 29 36 29 Z"
        fill="#FFFFFF"
      />

      {/* Right Person Head */}
      <circle cx="64" cy="22" r="5.5" fill="#FFFFFF" />
      {/* Right Person Body & Right Heart Arch */}
      <path
        d="M 64 29 C 70 29 76 32.5 79 38.5 C 82.5 45.5 82.5 53 77 60 C 71 67.5 61 74.5 50 81 C 60.5 70 68.5 61.5 70.5 51.5 C 71.5 44 67.5 37.5 62.5 35 C 58.5 33 54 34.5 50 39 C 54.5 32.5 59 29 64 29 Z"
        fill="#FFFFFF"
      />

      {/* Center White Medical Cross */}
      <path
        d="M 45 44 H 55 V 48 H 59 V 54 H 55 V 58 H 45 V 54 H 41 V 48 H 45 Z"
        fill="#FFFFFF"
      />

      {/* Bottom Supporting Care Leaves */}
      <path
        d="M 50 78 C 39 73 28 65 23 53.5 C 22.5 60.5 25 68.5 30.5 74.5 C 36.5 81 44.5 84 50 85 C 55.5 84 63.5 81 69.5 74.5 C 75 68.5 77.5 60.5 77 53.5 C 72 65 61 73 50 78 Z"
        fill="url(#arogyaLeafGrad)"
      />
    </svg>
  );
};

export interface ArogyaMitraBrandProps {
  size?: number | string;
  className?: string;
  textClassName?: string;
  subtitle?: string;
  portalTag?: string;
}

export const ArogyaMitraBrand: React.FC<ArogyaMitraBrandProps> = ({
  size = 36,
  className = '',
  textClassName = '',
  subtitle = 'Digital Healthcare Platform',
  portalTag,
}) => {
  return (
    <div className={`flex items-center gap-3 group ${className}`}>
      <div className="group-hover:scale-105 transition-transform duration-200">
        <ArogyaMitraIcon size={size} />
      </div>
      <div>
        <span className={`font-extrabold tracking-tight text-slate-900 group-hover:text-teal-600 transition-colors ${textClassName || 'text-xl sm:text-2xl'}`}>
          Arogya<span className="text-teal-600">Mitra</span>
        </span>
        {portalTag ? (
          <span className="text-[10px] block text-teal-700 font-bold uppercase tracking-wider font-sans -mt-1">
            {portalTag}
          </span>
        ) : subtitle ? (
          <span className="text-[10px] block text-slate-500 font-semibold tracking-wider uppercase font-sans -mt-1">
            {subtitle}
          </span>
        ) : null}
      </div>
    </div>
  );
};

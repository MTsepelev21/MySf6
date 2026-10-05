import React from 'react';
import type { RankTier } from '../types/sf6';

interface RankEmblemProps {
  tier: RankTier;
  size?: 'sm' | 'md' | 'lg';
}

export const RankEmblem: React.FC<RankEmblemProps> = ({ tier, size = 'md' }) => {
  const dimensions =
    size === 'lg'
      ? 'w-16 h-16 sm:w-20 sm:h-20'
      : size === 'md'
      ? 'w-10 h-10 sm:w-13 sm:h-13'
      : 'w-7 h-7 sm:w-9 sm:h-9';

  let primaryStop = '#64748B';
  let secondaryStop = '#334155';

  if (tier === 'Legend') {
    primaryStop = '#F59E0B';
    secondaryStop = '#DC2626';
  } else if (tier === 'Master') {
    primaryStop = '#EC4899';
    secondaryStop = '#8B5CF6';
  } else if (tier.startsWith('Diamond')) {
    primaryStop = '#38BDF8';
    secondaryStop = '#1D4ED8';
  } else if (tier.startsWith('Platinum')) {
    primaryStop = '#2DD4BF';
    secondaryStop = '#0369A1';
  } else if (tier.startsWith('Gold')) {
    primaryStop = '#FBBF24';
    secondaryStop = '#B45309';
  } else if (tier.startsWith('Silver')) {
    primaryStop = '#E2E8F0';
    secondaryStop = '#64748B';
  } else if (tier.startsWith('Bronze')) {
    primaryStop = '#F59E0B';
    secondaryStop = '#78350F';
  } else if (tier.startsWith('Iron')) {
    primaryStop = '#94A3B8';
    secondaryStop = '#475569';
  }

  const gradientId = `rank-grad-${tier.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${size}`;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${dimensions}`}
      aria-label={`Эмблема ранга ${tier}`}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        <defs>
          <linearGradient id={gradientId} x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={primaryStop} />
            <stop offset="100%" stopColor={secondaryStop} />
          </linearGradient>
        </defs>

        {/* Outer Crest */}
        <polygon
          points="32,4 58,18 58,46 32,60 6,46 6,18"
          fill="#0B0F17"
          stroke={`url(#${gradientId})`}
          strokeWidth="3.2"
        />

        {/* Inner Wing / Shield Geometry */}
        <polygon
          points="32,10 51,21 51,43 32,54 13,43 13,21"
          fill={`url(#${gradientId})`}
          fillOpacity="0.22"
          stroke={`url(#${gradientId})`}
          strokeWidth="1.2"
        />

        {/* Center Chevron */}
        <path
          d="M19 37L32 19L45 37L39 41L32 31L25 41L19 37Z"
          fill={`url(#${gradientId})`}
        />
        <circle cx="32" cy="44" r="3" fill="#F8FAFC" />
      </svg>
    </div>
  );
};

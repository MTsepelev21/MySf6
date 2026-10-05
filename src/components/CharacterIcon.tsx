import React from 'react';

interface CharacterIconProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
}

const CHAR_COLORS: Record<string, { bg: string; text: string; initial: string; border: string }> = {
  alex: { bg: 'from-amber-600 via-amber-700 to-red-900', text: 'text-amber-100', initial: 'AL', border: 'border-amber-500/60' },
  sagat: { bg: 'from-orange-600 via-amber-700 to-amber-950', text: 'text-orange-100', initial: 'SG', border: 'border-orange-500/60' },
  ed: { bg: 'from-blue-600 via-indigo-700 to-slate-900', text: 'text-blue-100', initial: 'ED', border: 'border-blue-400/60' },
  jamie: { bg: 'from-yellow-600 via-amber-600 to-amber-950', text: 'text-yellow-100', initial: 'JM', border: 'border-yellow-400/60' },
  cammy: { bg: 'from-teal-600 via-emerald-700 to-teal-950', text: 'text-teal-100', initial: 'CM', border: 'border-teal-400/60' },
  terry: { bg: 'from-red-600 via-rose-700 to-red-950', text: 'text-red-100', initial: 'TR', border: 'border-red-400/60' },
  akuma: { bg: 'from-rose-700 via-red-800 to-black', text: 'text-rose-100', initial: 'AK', border: 'border-rose-500/60' },
  mbison: { bg: 'from-purple-700 via-indigo-800 to-black', text: 'text-purple-100', initial: 'BS', border: 'border-purple-400/60' },
  zangief: { bg: 'from-red-700 via-amber-900 to-stone-950', text: 'text-red-100', initial: 'ZG', border: 'border-red-500/60' },
  ken: { bg: 'from-amber-500 via-orange-600 to-red-900', text: 'text-amber-100', initial: 'KN', border: 'border-amber-400/60' },
  ryu: { bg: 'from-slate-600 via-slate-700 to-slate-950', text: 'text-slate-100', initial: 'RY', border: 'border-slate-400/60' },
  juri: { bg: 'from-pink-600 via-purple-700 to-purple-950', text: 'text-pink-100', initial: 'JR', border: 'border-pink-400/60' },
  luke: { bg: 'from-blue-500 via-indigo-600 to-indigo-950', text: 'text-blue-100', initial: 'LK', border: 'border-blue-400/60' },
  chunli: { bg: 'from-cyan-600 via-blue-700 to-blue-950', text: 'text-cyan-100', initial: 'CH', border: 'border-cyan-400/60' },
  guile: { bg: 'from-emerald-600 via-teal-700 to-stone-950', text: 'text-emerald-100', initial: 'GL', border: 'border-emerald-400/60' },
  deejay: { bg: 'from-lime-600 via-emerald-600 to-teal-950', text: 'text-lime-100', initial: 'DJ', border: 'border-lime-400/60' },
  rashid: { bg: 'from-amber-500 via-yellow-600 to-stone-900', text: 'text-amber-100', initial: 'RS', border: 'border-amber-400/60' },
  aki: { bg: 'from-fuchsia-700 via-purple-800 to-black', text: 'text-fuchsia-100', initial: 'AK', border: 'border-fuchsia-400/60' },
  marisa: { bg: 'from-amber-700 via-yellow-800 to-stone-950', text: 'text-amber-100', initial: 'MR', border: 'border-amber-500/60' },
  kimberly: { bg: 'from-violet-600 via-fuchsia-700 to-purple-950', text: 'text-violet-100', initial: 'KM', border: 'border-violet-400/60' },
  manon: { bg: 'from-indigo-600 via-slate-700 to-slate-950', text: 'text-indigo-100', initial: 'MN', border: 'border-indigo-400/60' },
  lily: { bg: 'from-emerald-500 via-teal-600 to-teal-950', text: 'text-emerald-100', initial: 'LY', border: 'border-emerald-400/60' },
  blanka: { bg: 'from-green-600 via-emerald-700 to-black', text: 'text-green-100', initial: 'BL', border: 'border-green-400/60' },
  dhalsim: { bg: 'from-orange-700 via-amber-800 to-stone-950', text: 'text-orange-100', initial: 'DH', border: 'border-orange-500/60' },
  ehonda: { bg: 'from-blue-700 via-sky-800 to-slate-950', text: 'text-blue-100', initial: 'EH', border: 'border-blue-500/60' },
  mai: { bg: 'from-red-600 via-amber-700 to-red-950', text: 'text-red-100', initial: 'MA', border: 'border-red-400/60' },
};

export const CharacterIcon: React.FC<CharacterIconProps> = ({
  name,
  size = 'md',
  className = '',
  showBorder = true,
}) => {
  const normKey = (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const config =
    CHAR_COLORS[normKey] || {
      bg: 'from-slate-700 via-slate-800 to-slate-950',
      text: 'text-slate-100',
      initial: (name || 'SF').slice(0, 2).toUpperCase(),
      border: 'border-slate-500/50',
    };

  // Increased dimensions for PC/Desktop comfort and readability
  const dimensions =
    size === 'xl'
      ? 'w-20 h-20 sm:w-24 sm:h-24 text-2xl sm:text-3xl rounded-xl shadow-lg'
      : size === 'lg'
      ? 'w-14 h-14 sm:w-16 sm:h-16 text-lg sm:text-xl rounded-lg shadow-md'
      : size === 'md'
      ? 'w-10 h-10 sm:w-12 sm:h-12 text-sm sm:text-base rounded-md shadow'
      : 'w-8 h-8 sm:w-9 sm:h-9 text-xs sm:text-sm rounded-md shadow-sm';

  return (
    <div
      className={`relative inline-flex items-center justify-center font-display font-extrabold select-none shrink-0 bg-gradient-to-br ${config.bg} ${config.text} ${dimensions} ${
        showBorder ? `border ${config.border}` : ''
      } ${className}`}
    >
      <span className="tracking-tight drop-shadow-md">{config.initial}</span>
    </div>
  );
};

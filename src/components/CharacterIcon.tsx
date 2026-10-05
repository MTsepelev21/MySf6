import React from 'react';

interface CharacterIconProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
}

const CHAR_COLORS: Record<string, { bg: string; text: string; initial: string; badge: string }> = {
  alex: { bg: 'from-amber-600 to-red-800', text: 'text-amber-200', initial: 'AL', badge: 'bg-amber-500' },
  sagat: { bg: 'from-orange-600 to-amber-900', text: 'text-orange-200', initial: 'SG', badge: 'bg-orange-500' },
  ed: { bg: 'from-blue-600 to-indigo-900', text: 'text-blue-200', initial: 'ED', badge: 'bg-blue-500' },
  jamie: { bg: 'from-yellow-600 to-amber-800', text: 'text-yellow-200', initial: 'JM', badge: 'bg-yellow-500' },
  cammy: { bg: 'from-teal-600 to-emerald-900', text: 'text-teal-200', initial: 'CM', badge: 'bg-teal-500' },
  terry: { bg: 'from-red-600 to-rose-900', text: 'text-red-200', initial: 'TR', badge: 'bg-red-500' },
  akuma: { bg: 'from-rose-700 to-red-950', text: 'text-rose-200', initial: 'AK', badge: 'bg-rose-600' },
  mbison: { bg: 'from-purple-700 to-indigo-950', text: 'text-purple-200', initial: 'BS', badge: 'bg-purple-600' },
  zangief: { bg: 'from-red-700 to-stone-900', text: 'text-red-200', initial: 'ZG', badge: 'bg-red-600' },
  ken: { bg: 'from-amber-500 to-red-800', text: 'text-amber-200', initial: 'KN', badge: 'bg-red-500' },
  ryu: { bg: 'from-slate-600 to-slate-900', text: 'text-slate-200', initial: 'RY', badge: 'bg-slate-500' },
  juri: { bg: 'from-pink-600 to-purple-900', text: 'text-pink-200', initial: 'JR', badge: 'bg-pink-500' },
  luke: { bg: 'from-blue-500 to-indigo-800', text: 'text-blue-200', initial: 'LK', badge: 'bg-blue-500' },
  chunli: { bg: 'from-cyan-600 to-blue-900', text: 'text-cyan-200', initial: 'CH', badge: 'bg-cyan-500' },
  guile: { bg: 'from-emerald-600 to-stone-900', text: 'text-emerald-200', initial: 'GL', badge: 'bg-emerald-500' },
  deejay: { bg: 'from-lime-600 to-emerald-900', text: 'text-lime-200', initial: 'DJ', badge: 'bg-lime-500' },
  rashid: { bg: 'from-amber-500 to-yellow-800', text: 'text-amber-200', initial: 'RS', badge: 'bg-amber-500' },
  aki: { bg: 'from-fuchsia-700 to-purple-950', text: 'text-fuchsia-200', initial: 'AK', badge: 'bg-fuchsia-600' },
  marisa: { bg: 'from-amber-700 to-yellow-950', text: 'text-amber-200', initial: 'MR', badge: 'bg-amber-600' },
  kimberly: { bg: 'from-violet-600 to-fuchsia-900', text: 'text-violet-200', initial: 'KM', badge: 'bg-violet-500' },
  manon: { bg: 'from-indigo-600 to-slate-900', text: 'text-indigo-200', initial: 'MN', badge: 'bg-indigo-500' },
  lily: { bg: 'from-emerald-500 to-teal-800', text: 'text-emerald-200', initial: 'LY', badge: 'bg-emerald-500' },
  blanka: { bg: 'from-green-600 to-emerald-950', text: 'text-green-200', initial: 'BL', badge: 'bg-green-500' },
  dhalsim: { bg: 'from-orange-700 to-amber-950', text: 'text-orange-200', initial: 'DH', badge: 'bg-orange-600' },
  ehonda: { bg: 'from-blue-700 to-slate-900', text: 'text-blue-200', initial: 'EH', badge: 'bg-blue-600' },
  mai: { bg: 'from-red-600 to-amber-900', text: 'text-red-200', initial: 'MA', badge: 'bg-red-500' },
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
      bg: 'from-slate-700 to-slate-900',
      text: 'text-slate-200',
      initial: (name || 'SF').slice(0, 2).toUpperCase(),
      badge: 'bg-slate-500',
    };

  const dimensions =
    size === 'xl'
      ? 'w-16 h-16 text-lg'
      : size === 'lg'
      ? 'w-12 h-12 text-sm'
      : size === 'md'
      ? 'w-8 h-8 text-xs'
      : 'w-6 h-6 text-[10px]';

  return (
    <div
      className={`relative inline-flex items-center justify-center font-display font-bold select-none shrink-0 bg-gradient-to-br ${config.bg} ${config.text} ${dimensions} ${
        showBorder ? 'border border-slate-700/60 shadow-inner' : ''
      } ${className}`}
    >
      <span className="tracking-tighter drop-shadow">{config.initial}</span>
    </div>
  );
};

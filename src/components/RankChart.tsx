import React, { useState, useMemo } from 'react';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';
import type { CharacterStats, RankHistoryPoint } from '../types/sf6';

interface RankChartProps {
  character: CharacterStats;
  selectedPointId: string | null;
  onSelectPoint: (point: RankHistoryPoint) => void;
}

export const RankChart: React.FC<RankChartProps> = ({
  character,
  selectedPointId,
  onSelectPoint,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<RankHistoryPoint | null>(null);

  const isMaster = character.currentMr > 0 || character.rankTier === 'Master' || character.rankTier === 'Legend';
  const points = character.rankHistory || [];

  const dataValues = useMemo(() => {
    return points.map((p) => (isMaster ? p.mr : p.lp));
  }, [points, isMaster]);

  const minVal = useMemo(() => {
    if (dataValues.length === 0) return isMaster ? 1400 : 3000;
    const min = Math.min(...dataValues);
    return Math.floor(min * 0.96);
  }, [dataValues, isMaster]);

  const maxVal = useMemo(() => {
    if (dataValues.length === 0) return isMaster ? 1600 : 5000;
    const max = Math.max(...dataValues);
    return Math.ceil(max * 1.04);
  }, [dataValues, isMaster]);

  const range = Math.max(1, maxVal - minVal);

  const chartWidth = 920;
  const chartHeight = 280;
  const padX = 50;
  const padY = 32;
  const plotW = chartWidth - padX * 2;
  const plotH = chartHeight - padY * 2;

  const coords = useMemo(() => {
    if (points.length === 0) return [];
    if (points.length === 1) {
      return [
        {
          x: padX + plotW / 2,
          y: padY + plotH / 2,
          point: points[0],
          value: isMaster ? points[0].mr : points[0].lp,
        },
      ];
    }
    return points.map((p, idx) => {
      const val = isMaster ? p.mr : p.lp;
      const x = padX + (idx / (points.length - 1)) * plotW;
      const y = padY + plotH - ((val - minVal) / range) * plotH;
      return { x, y, point: p, value: val };
    });
  }, [points, isMaster, minVal, range, padX, padY, plotW, plotH]);

  const pathD = useMemo(() => {
    if (coords.length < 2) return '';
    return coords.reduce((acc, c, idx) => {
      return `${acc} ${idx === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`;
    }, '');
  }, [coords]);

  const areaD = useMemo(() => {
    if (coords.length < 2) return '';
    const first = coords[0];
    const last = coords[coords.length - 1];
    const bottom = padY + plotH;
    return `${pathD} L ${last.x.toFixed(1)} ${bottom} L ${first.x.toFixed(1)} ${bottom} Z`;
  }, [coords, pathD, padY, plotH]);

  const activePoint = hoveredPoint || points.find((p) => p.id === selectedPointId) || points[points.length - 1];

  return (
    <section id="rank-trajectory" className="bg-[#0D121B] border border-slate-800/80 rounded-xl p-5 sm:p-7 space-y-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/70">
        <div>
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg sm:text-xl font-bold text-white font-display">
              Динамика ранга и LP ({character.charName})
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            История изменения {isMaster ? 'Master Rating (MR)' : 'League Points (LP)'} в официальных рейтинговых боях
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs sm:text-sm font-mono bg-[#090D14] border border-slate-800/80 px-3.5 py-1.5 rounded-lg">
          <span className="text-slate-400">
            Матчей в выборке: <strong className="text-slate-200">{points.length}</strong>
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-amber-400 font-bold">
            Текущий: {character.currentLp.toLocaleString('ru-RU')} LP
          </span>
        </div>
      </div>

      {/* SVG Chart Frame */}
      <div className="relative w-full overflow-hidden bg-[#080C14] border border-slate-800/90 rounded-lg p-3">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto select-none"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padY + plotH * (1 - ratio);
            const val = Math.round(minVal + ratio * range);
            return (
              <g key={ratio}>
                <line
                  x1={padX}
                  y1={y}
                  x2={chartWidth - padX}
                  y2={y}
                  stroke="#1E293B"
                  strokeDasharray="4 4"
                  strokeWidth="1.2"
                />
                <text
                  x={padX - 10}
                  y={y + 4}
                  fill="#94A3B8"
                  fontSize="12"
                  textAnchor="end"
                  className="font-mono font-medium"
                >
                  {val.toLocaleString('ru-RU')}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          {areaD && <path d={areaD} fill="url(#areaGradient)" />}

          {/* Line Path */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#F59E0B"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points */}
          {coords.map((c) => {
            const isSel = activePoint?.id === c.point.id;
            const isWin = c.point.result === 'WIN';
            return (
              <g
                key={c.point.id}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(c.point)}
                onClick={() => onSelectPoint(c.point)}
              >
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isSel ? 7 : 4.5}
                  fill={isWin ? '#10B981' : '#F43F5E'}
                  stroke="#080C14"
                  strokeWidth="2.5"
                />
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {activePoint && (
          <div className="mt-3 p-3.5 sm:p-4 bg-[#0D121B] border border-slate-700/80 rounded-lg text-xs sm:text-sm flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5">
              <span
                className={`font-bold font-mono text-sm sm:text-base ${
                  activePoint.result === 'WIN' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {activePoint.result === 'WIN' ? (
                  <TrendingUp className="inline w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="inline w-4 h-4 mr-1" />
                )}
                {activePoint.result}
              </span>
              <span className="text-slate-200 font-medium text-sm sm:text-base">vs {activePoint.opponentCharName}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400 font-mono text-xs sm:text-sm">
                {activePoint.dateLabel} {activePoint.timeLabel}
              </span>
              {activePoint.replayId && (
                <span className="text-xs font-mono text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded">
                  Replay: {activePoint.replayId}
                </span>
              )}
            </div>

            <div className="font-mono flex items-center gap-4">
              <span className="text-slate-300 text-xs sm:text-sm">
                Ранг:{' '}
                <strong className="text-white font-semibold">{activePoint.rankTier}</strong>
              </span>
              <span className="text-amber-400 font-bold text-sm sm:text-base">
                {activePoint.lp.toLocaleString('ru-RU')} LP
              </span>
              <span
                className={`text-xs sm:text-sm font-bold px-2 py-0.5 rounded ${
                  activePoint.deltaLp >= 0 ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50' : 'bg-rose-950/60 text-rose-400 border border-rose-800/50'
                }`}
              >
                {activePoint.deltaLp >= 0 ? `+${activePoint.deltaLp}` : activePoint.deltaLp} LP
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

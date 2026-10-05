import React, { useState, useMemo } from 'react';
import { Activity, Play, Pause, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import type { CharacterStats, RankHistoryPoint } from '../types/sf6';

interface RankChartProps {
  character: CharacterStats;
  selectedPointId: string | null;
  onSelectPoint: (point: RankHistoryPoint) => void;
  liveIntervalSec: number | null;
  onChangeLiveInterval: (interval: number | null) => void;
  onTriggerLiveMatch: (forcedResult?: 'WIN' | 'LOSS') => void;
  isSimulating: boolean;
  countdownSec: number;
}

export const RankChart: React.FC<RankChartProps> = ({
  character,
  selectedPointId,
  onSelectPoint,
  liveIntervalSec,
  onChangeLiveInterval,
  onTriggerLiveMatch,
  isSimulating,
  countdownSec,
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

  const chartWidth = 900;
  const chartHeight = 260;
  const padX = 40;
  const padY = 30;
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
    <section id="rank-trajectory" className="bg-[#0D121B] border border-slate-800/70 p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-semibold text-white">
              График динамики ранга ({character.charName})
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Соотношение ранговых очков {isMaster ? 'Master Rating (MR)' : 'League Points (LP)'} и времени
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Polling Interval Controls */}
          <div className="flex items-center bg-[#090D14] border border-slate-800 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => onChangeLiveInterval(liveIntervalSec ? null : 6)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 transition-colors cursor-pointer ${
                liveIntervalSec
                  ? 'bg-amber-500/20 text-amber-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Переключить автообновление в реальном времени"
            >
              {liveIntervalSec ? (
                <>
                  <Pause className="w-3 h-3 text-amber-400" />
                  <span>Live ({countdownSec}s)</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 text-slate-400" />
                  <span>Пауза</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Simulation trigger */}
          <button
            type="button"
            onClick={() => onTriggerLiveMatch('WIN')}
            disabled={isSimulating}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/50 transition-colors cursor-pointer disabled:opacity-50"
            title="Записать победный бой в CFN лог"
          >
            <Plus className="w-3 h-3 text-emerald-400" />
            <span>+Бой (Win)</span>
          </button>
        </div>
      </div>

      {/* SVG Chart Frame */}
      <div className="relative w-full overflow-hidden bg-[#080C14] border border-slate-800/90 p-2">
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
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={padX - 8}
                  y={y + 4}
                  fill="#64748B"
                  fontSize="10"
                  textAnchor="end"
                  className="font-mono"
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
              strokeWidth="2.5"
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
                  r={isSel ? 6 : 3}
                  fill={isWin ? '#10B981' : '#F43F5E'}
                  stroke="#080C14"
                  strokeWidth="2"
                />
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {activePoint && (
          <div className="mt-2 p-2.5 bg-[#0D121B] border border-slate-700/80 text-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`font-semibold font-mono ${
                  activePoint.result === 'WIN' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {activePoint.result === 'WIN' ? (
                  <TrendingUp className="inline w-3.5 h-3.5 mr-1" />
                ) : (
                  <TrendingDown className="inline w-3.5 h-3.5 mr-1" />
                )}
                {activePoint.result}
              </span>
              <span className="text-slate-300">vs {activePoint.opponentCharName}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400 font-mono">
                {activePoint.dateLabel} {activePoint.timeLabel}
              </span>
              {activePoint.replayId && (
                <span className="text-[11px] font-mono text-slate-500">
                  Replay: {activePoint.replayId}
                </span>
              )}
            </div>

            <div className="font-mono flex items-center gap-3">
              <span className="text-slate-400">
                Ранг:{' '}
                <strong className="text-white">{activePoint.rankTier}</strong>
              </span>
              <span className="text-amber-400 font-semibold">
                {activePoint.lp.toLocaleString('ru-RU')} LP
              </span>
              <span
                className={`text-[11px] font-semibold ${
                  activePoint.deltaLp >= 0 ? 'text-emerald-400' : 'text-rose-400'
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

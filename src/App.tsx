import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  ArrowUpDown,
  Copy,
  Check,
  Clock,
  FileText,
  X,
  Swords,
} from 'lucide-react';
import type { CFNAccountData, RankHistoryPoint } from './types/sf6';
import { RankEmblem } from './components/RankEmblem';
import { RankChart } from './components/RankChart';
import { CharacterIcon } from './components/CharacterIcon';
import { PWAInstallButton } from './components/PWAInstallButton';

type MatchupSort = 'matches_desc' | 'winrate_desc' | 'name_asc';

const PROMPT_SPEC_TEXT = `Создай минималистичное веб-приложение для отслеживания статистики аккаунта Street Fighter 6 по CFN ID: 2438096652 (игрок Kapubara).

1. Данные профиля:
- Игрок: Kapubara (CFN ID: 2438096652, Steam, Russia).
- Аватар профиля: иконка персонажа с наивысшим рангом на аккаунте (Alex · 15,350 LP, Platinum 2).
- Персонажи: Ed (3,865 LP, Bronze 3, 55.0% винрейт, 80 матчей), Alex (15,350 LP, Platinum 2, 59.3%), Sagat (7,929 LP, Silver 4, 66.7%), Jamie, Cammy, Akuma и др.
- Автоматическая синхронизация: данные напрямую подтягиваются из базы CFN без необходимости ручного ввода.
- Время в игре: статистика игрового времени и распределение по режимам (Fighting Ground, Battle Hub, World Tour).

2. Требования к интерфейсу:
- Минималистичный, чистый дизайн без лишнего визуального шума и баннеров.
- График ранга (LP/MR) по времени с интерактивным тултипом и поддержкой обновления в реальном времени.
- Список матчапов против других персонажей строго в формате:
  Иконка персонажа + Имя персонажа + Сыграно игр + Выиграно игр + Процент побед над ним.
- Журнал недавних боев с отображением Replay ID.`;

export default function App() {
  const [cfnInput, setCfnInput] = useState('2438096652');
  const [activeCfnId, setActiveCfnId] = useState('2438096652');
  const [account, setAccount] = useState<CFNAccountData | null>(null);
  const [selectedCharId, setSelectedCharId] = useState<string>('ed');
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live polling state
  const [liveIntervalSec, setLiveIntervalSec] = useState<number | null>(null);
  const [countdownSec, setCountdownSec] = useState<number>(6);

  // Matchup list controls
  const [matchupSearch, setMatchupSearch] = useState('');
  const [matchupSort, setMatchupSort] = useState<MatchupSort>('matches_desc');

  // Modal state
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const fetchAccountStats = useCallback(
    async (
      targetCfn: string,
      tick = false,
      charIdForTick = selectedCharId,
      forceRefresh = false
    ) => {
      try {
        if (!account || forceRefresh) setIsLoading(true);
        setErrorMsg(null);
        const params = new URLSearchParams();
        if (tick) {
          params.set('tick', 'true');
          params.set('charId', charIdForTick);
        }
        if (forceRefresh) {
          params.set('refresh', 'true');
        }
        const qs = params.toString() ? `?${params.toString()}` : '';
        const response = await fetch(`/api/stats/${encodeURIComponent(targetCfn)}${qs}`);
        if (!response.ok) {
          throw new Error(`Ошибка загрузки данных CFN (${response.status})`);
        }
        const data: CFNAccountData = await response.json();
        setAccount(data);
        if (!data.characters.some((c) => c.charId === charIdForTick)) {
          setSelectedCharId(data.mainCharacterId);
        }
      } catch (err) {
        setErrorMsg(
          err instanceof Error ? err.message : 'Не удалось получить данные аккаунта'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [account, selectedCharId]
  );

  useEffect(() => {
    fetchAccountStats(activeCfnId, false, 'ed');
  }, [activeCfnId]);

  useEffect(() => {
    if (!liveIntervalSec) return;
    setCountdownSec(liveIntervalSec);

    const timer = window.setInterval(() => {
      setCountdownSec((prev) => {
        if (prev <= 1) {
          fetchAccountStats(activeCfnId, true, selectedCharId);
          return liveIntervalSec;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [liveIntervalSec, activeCfnId, selectedCharId, fetchAccountStats]);

  // Determine character with highest rank on account (for avatar)
  const highestRankCharacter = useMemo(() => {
    if (!account || !account.characters?.length) return null;
    return [...account.characters].sort((a, b) => {
      if (b.currentMr !== a.currentMr) return b.currentMr - a.currentMr;
      return b.currentLp - a.currentLp;
    })[0];
  }, [account]);

  const currentCharacter = useMemo(() => {
    if (!account) return null;
    return (
      account.characters.find((c) => c.charId === selectedCharId) || account.characters[0]
    );
  }, [account, selectedCharId]);

  const handleTriggerLiveMatch = async (forcedResult?: 'WIN' | 'LOSS') => {
    if (isSimulating) return;
    try {
      setIsSimulating(true);
      const response = await fetch(`/api/stats/${encodeURIComponent(activeCfnId)}/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          charId: selectedCharId,
          result: forcedResult,
        }),
      });
      if (!response.ok) throw new Error('Ошибка записи матча');
      const payload: { account: CFNAccountData; latestMatch: RankHistoryPoint } =
        await response.json();
      setAccount(payload.account);
      setSelectedPointId(payload.latestMatch.id);
      if (liveIntervalSec) setCountdownSec(liveIntervalSec);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Ошибка обновления матча');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = cfnInput.trim();
    if (/^\d{6,12}$/.test(cleaned)) {
      setActiveCfnId(cleaned);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(PROMPT_SPEC_TEXT);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  // Filter and sort matchups strictly according to user requirements
  const displayedMatchups = useMemo(() => {
    if (!currentCharacter) return [];
    return currentCharacter.matchups
      .filter((m) =>
        m.opponentName.toLowerCase().includes(matchupSearch.toLowerCase().trim())
      )
      .sort((a, b) => {
        if (matchupSort === 'winrate_desc') return b.winrate - a.winrate;
        if (matchupSort === 'name_asc') return a.opponentName.localeCompare(b.opponentName);
        return b.matches - a.matches;
      });
  }, [currentCharacter, matchupSearch, matchupSort]);

  return (
    <div className="min-h-screen bg-[#090D14] text-slate-100 flex flex-col font-sans">
      {/* Minimal Top Navigation */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 bg-[#090D14]/90 backdrop-blur-md border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="text-base font-semibold tracking-tight text-white font-display"
          >
            SF6 Analytics
          </a>
          <span className="text-slate-600 text-xs">/</span>
          <span className="text-xs text-slate-400 font-mono">CFN {activeCfnId}</span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs text-slate-400 font-medium">
          <a href="#overview" className="hover:text-white transition-colors">
            Профиль
          </a>
          <a href="#rank-trajectory" className="hover:text-white transition-colors">
            График ранга
          </a>
          <a href="#matchups" className="hover:text-white transition-colors">
            Винрейт по персонажам
          </a>
          <a href="#playtime" className="hover:text-white transition-colors">
            Игровое время
          </a>
          <a href="#matches" className="hover:text-white transition-colors">
            Матчи
          </a>
        </nav>

        <div className="flex items-center gap-2.5">
          <PWAInstallButton />
          <button
            type="button"
            onClick={() => fetchAccountStats(activeCfnId, false, selectedCharId, true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
            title="Синхронизировать с Capcom CFN"
          >
            <RefreshCw className="w-3 h-3 text-slate-400" />
            <span>Синхронизировать</span>
          </button>
          <button
            type="button"
            onClick={() => setIsPromptOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
          >
            <FileText className="w-3 h-3 text-slate-400" />
            <span>Промпт</span>
          </button>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {errorMsg && (
          <div className="p-3 bg-rose-950/20 border border-rose-800/40 text-rose-300 text-xs flex items-center justify-between">
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={() => fetchAccountStats(activeCfnId)}
              className="text-xs text-rose-200 underline cursor-pointer"
            >
              Повторить
            </button>
          </div>
        )}

        {isLoading || !account || !currentCharacter ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-28 bg-slate-900/40 border border-slate-800/40" />
            <div className="h-72 bg-slate-900/40 border border-slate-800/40" />
            <div className="h-64 bg-slate-900/40 border border-slate-800/40" />
          </div>
        ) : (
          <>
            {/* Minimalist Profile & Top Rank Header */}
            <section
              id="overview"
              className="bg-[#0D121B] border border-slate-800/70 p-5"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                {/* Profile Identity with Highest-Ranked Character Avatar */}
                <div className="flex items-center gap-4">
                  {/* Avatar: Icon of the character with highest rank on account (Alex) */}
                  <div
                    className="relative group cursor-pointer"
                    onClick={() => {
                      if (highestRankCharacter) {
                        setSelectedCharId(highestRankCharacter.charId);
                      }
                    }}
                    title={`Высший ранг на аккаунте: ${highestRankCharacter?.charName} (${highestRankCharacter?.rankTier})`}
                  >
                    <div className="w-16 h-16 bg-[#141A26] border border-slate-700/80 flex items-center justify-center relative overflow-hidden">
                      {highestRankCharacter && (
                        <CharacterIcon
                          name={highestRankCharacter.charName}
                          size="xl"
                          showBorder={false}
                          className="w-full h-full"
                        />
                      )}
                      {/* Subtle Rank Crest Badge Overlay */}
                      {highestRankCharacter && (
                        <div className="absolute bottom-1 right-1">
                          <RankEmblem tier={highestRankCharacter.rankTier} size="sm" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="text-white font-medium">{account.fighterName}</span>
                      <span className="text-slate-600">·</span>
                      <span className="font-mono text-slate-400">CFN {account.cfnId}</span>
                      <span className="text-slate-600">·</span>
                      <span>{account.platform}</span>
                      <span className="text-slate-600">·</span>
                      <span>{account.region}</span>
                    </div>

                    <div className="flex items-baseline gap-3 mt-1">
                      <h1 className="text-2xl font-bold tracking-tight text-white font-display">
                        {account.fighterName}
                      </h1>
                      {highestRankCharacter && (
                        <span className="text-xs text-slate-400 font-mono">
                          Топ персонаж:{' '}
                          <span className="text-slate-200 font-semibold">
                            {highestRankCharacter.charName}
                          </span>{' '}
                          ({highestRankCharacter.rankTier} ·{' '}
                          {highestRankCharacter.currentLp.toLocaleString('ru-RU')} LP)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {account.onlineStatus}
                      </span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        Синхр: {new Date(account.capcomSyncedAt || account.lastSyncIso).toLocaleDateString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Switch CFN search bar */}
                <form
                  onSubmit={handleSearchSubmit}
                  className="flex items-center gap-2 self-start lg:self-center"
                >
                  <div className="relative">
                    <input
                      type="text"
                      value={cfnInput}
                      onChange={(e) => setCfnInput(e.target.value)}
                      placeholder="CFN User ID..."
                      className="px-3 py-1.5 text-xs font-mono bg-[#090D14] border border-slate-800 text-slate-200 focus:outline-none focus:border-slate-700 w-44"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
                  >
                    Загрузить
                  </button>
                </form>
              </div>

              {/* Character Selector Tabs */}
              <div className="mt-5 pt-4 border-t border-slate-800/60">
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">
                  Персонажи аккаунта (выберите для детальной статистики):
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {account.characters.map((char) => {
                    const isSelected = char.charId === currentCharacter.charId;
                    const isHighest = char.charId === highestRankCharacter?.charId;
                    return (
                      <button
                        key={char.charId}
                        type="button"
                        onClick={() => {
                          setSelectedCharId(char.charId);
                          setSelectedPointId(null);
                        }}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-slate-800 text-white font-medium border border-slate-700'
                            : 'text-slate-400 hover:text-slate-200 bg-[#090D14]/80 border border-slate-800/80'
                        }`}
                      >
                        <CharacterIcon name={char.charName} size="sm" showBorder={false} />
                        <span>{char.charName}</span>
                        <span className="font-mono text-[11px] text-slate-400">
                          {char.currentLp > 0
                            ? `${char.currentLp.toLocaleString('ru-RU')} LP`
                            : `${char.winrate}%`}
                        </span>
                        {isHighest && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                            title="Наивысший ранг"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Character Summary Row */}
              <div className="mt-4 pt-4 border-t border-slate-800/40 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <div className="text-slate-400">
                    Ранг ({currentCharacter.charName})
                  </div>
                  <div className="mt-0.5 text-base font-semibold font-display text-white flex items-center gap-1.5">
                    <RankEmblem tier={currentCharacter.rankTier} size="sm" />
                    <span>{currentCharacter.rankTier}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    {currentCharacter.currentLp > 0
                      ? `${currentCharacter.currentLp.toLocaleString('ru-RU')} LP`
                      : 'Вне лиги / Калибровка'}
                  </div>
                </div>

                <div>
                  <div className="text-slate-400">Винрейт в CFN</div>
                  <div className="mt-0.5 text-base font-semibold font-mono text-emerald-400">
                    {currentCharacter.winrate}%
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    {currentCharacter.wins}W – {currentCharacter.losses}L ({currentCharacter.totalMatches} матчей)
                  </div>
                </div>

                <div>
                  <div className="text-slate-400">Серия побед</div>
                  <div className="mt-0.5 text-base font-semibold font-mono text-amber-400">
                    {currentCharacter.winStreak}W
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    Лучшая: {currentCharacter.bestWinStreak}W подряд
                  </div>
                </div>

                <div>
                  <div className="text-slate-400">Управление / Время</div>
                  <div className="mt-0.5 text-base font-semibold text-slate-200">
                    {currentCharacter.controlType}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    ~{currentCharacter.hoursPlayed} ч на бойце
                  </div>
                </div>
              </div>
            </section>

            {/* Rank History Trajectory Chart */}
            <RankChart
              character={currentCharacter}
              selectedPointId={selectedPointId}
              onSelectPoint={(pt) => setSelectedPointId(pt.id)}
              liveIntervalSec={liveIntervalSec}
              onChangeLiveInterval={setLiveIntervalSec}
              onTriggerLiveMatch={(res) => handleTriggerLiveMatch(res)}
              isSimulating={isSimulating}
              countdownSec={countdownSec}
            />

            {/* Matchup Winrate Section: Exact Minimalist List Form */}
            <section
              id="matchups"
              className="bg-[#0D121B] border border-slate-800/70 p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/60">
                <div>
                  <h2 className="text-base font-semibold text-white">
                    Винрейт {currentCharacter.charName} против других персонажей
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Официальные показатели Capcom CFN для персонажа {currentCharacter.charName}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={matchupSearch}
                      onChange={(e) => setMatchupSearch(e.target.value)}
                      placeholder="Поиск бойца..."
                      className="pl-8 pr-3 py-1 text-xs bg-[#090D14] border border-slate-800 text-slate-200 focus:outline-none focus:border-slate-700 w-36"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setMatchupSort((prev) =>
                        prev === 'matches_desc'
                          ? 'winrate_desc'
                          : prev === 'winrate_desc'
                          ? 'name_asc'
                          : 'matches_desc'
                      )
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 bg-[#090D14] border border-slate-800 hover:border-slate-700 cursor-pointer"
                  >
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    <span>
                      {matchupSort === 'matches_desc'
                        ? 'По играм'
                        : matchupSort === 'winrate_desc'
                        ? 'По винрейту'
                        : 'По имени'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Exact format: Иконка + Имя + Сыграно игр + Выиграно игр + Процент побед */}
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-[11px] text-slate-400 font-medium">
                      <th className="py-2.5 px-3 w-12 text-center">Иконка</th>
                      <th className="py-2.5 px-3">Имя персонажа</th>
                      <th className="py-2.5 px-3 text-right font-mono">Сыграно игр</th>
                      <th className="py-2.5 px-3 text-right font-mono">Выиграно игр</th>
                      <th className="py-2.5 px-3 text-right font-mono">Процент побед</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {displayedMatchups.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                          Матчапы не найдены
                        </td>
                      </tr>
                    ) : (
                      displayedMatchups.map((m) => {
                        const isHigh = m.winrate >= 55;
                        const isLow = m.winrate < 45;
                        return (
                          <tr
                            key={m.opponentId}
                            className="hover:bg-slate-800/20 transition-colors"
                          >
                            {/* 1. Иконка персонажа */}
                            <td className="py-2.5 px-3 text-center">
                              <CharacterIcon name={m.opponentName} size="sm" />
                            </td>
                            {/* 2. Имя персонажа */}
                            <td className="py-2.5 px-3 font-medium text-slate-200">
                              {m.opponentName}
                            </td>
                            {/* 3. Сыгранные количество игр против него */}
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-300">
                              {m.matches}
                            </td>
                            {/* 4. Количество выигранных игр из этого количества */}
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-300">
                              <span className="text-emerald-400 font-semibold">{m.wins}</span>
                              <span className="text-slate-600 mx-1">/</span>
                              <span>{m.matches}</span>
                            </td>
                            {/* 5. Процент побед над ним */}
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                              <span
                                className={`font-semibold ${
                                  isHigh
                                    ? 'text-emerald-400'
                                    : isLow
                                    ? 'text-rose-400'
                                    : 'text-amber-400'
                                }`}
                              >
                                {m.winrate.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Playtime & Recent Match Log */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Playtime modes (6 cols) */}
              <section
                id="playtime"
                className="lg:col-span-6 bg-[#0D121B] border border-slate-800/70 p-5"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <h2 className="text-base font-semibold text-white">
                      Время в игре и режимах
                    </h2>
                  </div>
                  <span className="text-xs font-mono text-amber-400 font-semibold">
                    {account.playtime.totalHours} ч суммарно
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-xs">
                  {account.playtime.modes.map((mode) => (
                    <div
                      key={mode.id}
                      className="flex items-center justify-between py-1.5 border-b border-slate-800/30 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300">{mode.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          · {mode.percentage}%
                        </span>
                      </div>
                      <span className="font-mono text-slate-200 font-medium">
                        {mode.hours} ч
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Match log (6 cols) */}
              <section
                id="matches"
                className="lg:col-span-6 bg-[#0D121B] border border-slate-800/70 p-5"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <Swords className="w-3.5 h-3.5 text-slate-400" />
                    <h2 className="text-base font-semibold text-white">
                      Недавние бои ({currentCharacter.charName})
                    </h2>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    Всего {currentCharacter.rankHistory.length}
                  </span>
                </div>

                <div className="mt-3 divide-y divide-slate-800/40 text-xs">
                  {currentCharacter.rankHistory
                    .slice(-8)
                    .reverse()
                    .map((pt) => {
                      const isWin = pt.result === 'WIN';
                      const isSelected = selectedPointId === pt.id;
                      return (
                        <div
                          key={pt.id}
                          onClick={() => setSelectedPointId(pt.id)}
                          className={`py-2 px-2 flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-slate-800/60 border-l border-emerald-400'
                              : 'hover:bg-slate-800/20'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <CharacterIcon name={pt.opponentCharName} size="sm" />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`font-mono font-semibold ${
                                    isWin ? 'text-emerald-400' : 'text-rose-400'
                                  }`}
                                >
                                  {isWin ? 'WIN' : 'LOSS'}
                                </span>
                                <span className="text-slate-300">
                                  vs {pt.opponentCharName}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                {pt.dateLabel} {pt.timeLabel}{' '}
                                {pt.replayId ? `· Replay ${pt.replayId}` : ''}
                              </div>
                            </div>
                          </div>

                          <div className="text-right font-mono">
                            <div
                              className={`font-semibold ${
                                isWin ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {pt.deltaLp >= 0 ? `+${pt.deltaLp}` : pt.deltaLp} LP
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {pt.lp.toLocaleString('ru-RU')} LP
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </section>
            </div>
          </>
        )}
      </main>

      {/* Minimalist Footer */}
      <footer className="mt-auto border-t border-slate-800/60 py-4 px-6 text-xs text-slate-400">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            SF6 Analytics · Профиль игрока{' '}
            <strong className="text-slate-300 font-medium">
              {account?.fighterName || 'Kapubara'}
            </strong>{' '}
            (CFN ID: <span className="font-mono">{activeCfnId}</span>)
          </div>
          <button
            type="button"
            onClick={() => setIsPromptOpen(true)}
            className="hover:text-slate-300 underline cursor-pointer"
          >
            Текст ТЗ и промпта
          </button>
        </div>
      </footer>

      {/* Prompt Modal */}
      {isPromptOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#0D121B] border border-slate-700 max-w-2xl w-full p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-semibold text-white">ТЗ / Промпт для генерации</h3>
              <button
                type="button"
                onClick={() => setIsPromptOpen(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              readOnly
              value={PROMPT_SPEC_TEXT}
              rows={12}
              className="w-full text-xs font-mono bg-[#090D14] border border-slate-800 text-slate-300 p-3 select-all focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer transition-colors"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Скопировано!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Скопировать</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsPromptOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

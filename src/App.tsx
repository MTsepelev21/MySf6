import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  ArrowUpDown,
  Clock,
  Swords,
  Shield,
  Trophy,
} from 'lucide-react';
import type { CFNAccountData } from './types/sf6';
import { RankEmblem } from './components/RankEmblem';
import { RankChart } from './components/RankChart';
import { CharacterIcon } from './components/CharacterIcon';

type MatchupSort = 'matches_desc' | 'winrate_desc' | 'name_asc';

const USER_CFN_ID = '2438096652';

export default function App() {
  const [account, setAccount] = useState<CFNAccountData | null>(null);
  const [selectedCharId, setSelectedCharId] = useState<string>('ed');
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Matchup list controls
  const [matchupSearch, setMatchupSearch] = useState('');
  const [matchupSort, setMatchupSort] = useState<MatchupSort>('matches_desc');

  const fetchAccountStats = useCallback(
    async (
      charIdForTick = selectedCharId,
      forceRefresh = false
    ) => {
      try {
        if (forceRefresh) {
          setIsSyncing(true);
          setSyncSuccess(false);
        } else if (!account) {
          setIsLoading(true);
        }
        setErrorMsg(null);
        const params = new URLSearchParams();
        if (forceRefresh) {
          params.set('refresh', 'true');
          params.set('_t', String(Date.now()));
        }
        const qs = params.toString() ? `?${params.toString()}` : '';
        const response = await fetch(`/api/stats/${USER_CFN_ID}${qs}`, {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error(`Ошибка загрузки данных CFN (${response.status})`);
        }
        const data: CFNAccountData = await response.json();
        setAccount(data);
        if (!data.characters.some((c) => c.charId === charIdForTick)) {
          setSelectedCharId(data.mainCharacterId);
        }
        if (forceRefresh) {
          setSyncSuccess(true);
          window.setTimeout(() => setSyncSuccess(false), 4000);
        }
      } catch (err) {
        setErrorMsg(
          err instanceof Error ? err.message : 'Не удалось получить данные аккаунта'
        );
      } finally {
        setIsLoading(false);
        setIsSyncing(false);
      }
    },
    [account, selectedCharId]
  );

  useEffect(() => {
    fetchAccountStats('ed');
  }, []);

  // Determine character with highest rank on account (for avatar & top badge)
  const highestRankCharacter = useMemo(() => {
    if (!account || !account.characters?.length) return null;
    return [...account.characters].sort((a, b) => {
      if (b.currentMr !== a.currentMr) return b.currentMr - a.currentMr;
      return b.currentLp - a.currentLp;
    })[0];
  }, [account]);

  // Characters with games actually played on this account
  const activeCharacters = useMemo(() => {
    if (!account?.characters) return [];
    return account.characters.filter((c) => c.totalMatches > 0);
  }, [account]);

  const currentCharacter = useMemo(() => {
    if (!account) return null;
    return (
      account.characters.find((c) => c.charId === selectedCharId) ||
      account.characters[0]
    );
  }, [account, selectedCharId]);

  // Filter and sort matchups strictly according to requirements
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
    <div className="min-h-screen bg-[#090D14] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Navigation Bar: Clean, distraction-free */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 lg:px-10 py-3.5 bg-[#090D14]/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="flex items-center gap-3.5">
          <a
            href="/"
            className="text-lg lg:text-xl font-bold tracking-tight text-white font-display flex items-center gap-2"
          >
            <span>SF6 Analytics</span>
          </a>
          <span className="text-slate-600 text-sm hidden sm:inline">/</span>
          <span className="text-xs sm:text-sm text-slate-300 font-mono bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">
            Kapubara
          </span>
          <span className="text-xs text-amber-400/90 font-mono hidden md:inline">
            CFN: {USER_CFN_ID}
          </span>
        </div>

        <nav className="hidden lg:flex items-center gap-8 text-sm text-slate-400 font-semibold">
          <a href="#overview" className="hover:text-white transition-colors">
            Профиль
          </a>
          <a href="#characters-list" className="hover:text-white transition-colors">
            Персонажи ({activeCharacters.length})
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

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 rounded-full text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Capcom CFN Online</span>
          </span>
        </div>
      </header>

      {/* Main Viewport Container */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-10 py-8 space-y-8">
        {errorMsg && (
          <div className="p-4 bg-rose-950/30 border border-rose-800/60 rounded-xl text-rose-300 text-sm flex items-center justify-between">
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={() => fetchAccountStats()}
              className="text-sm text-rose-200 underline cursor-pointer font-medium"
            >
              Повторить запрос
            </button>
          </div>
        )}

        {isLoading || !account || !currentCharacter ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-44 bg-slate-900/40 border border-slate-800/60 rounded-xl" />
            <div className="h-48 bg-slate-900/40 border border-slate-800/60 rounded-xl" />
            <div className="h-80 bg-slate-900/40 border border-slate-800/60 rounded-xl" />
            <div className="h-96 bg-slate-900/40 border border-slate-800/60 rounded-xl" />
          </div>
        ) : (
          <>
            {/* 1. Profile Header Card */}
            <section
              id="overview"
              className="bg-[#0D121B] border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Profile Identity with Highest-Ranked Character Avatar */}
                <div className="flex items-center gap-5 sm:gap-6">
                  {/* Avatar: Icon of the character with highest rank on account (Alex) */}
                  <div
                    className="relative group cursor-pointer shrink-0"
                    onClick={() => {
                      if (highestRankCharacter) {
                        setSelectedCharId(highestRankCharacter.charId);
                      }
                    }}
                    title={`Высший ранг на аккаунте: ${highestRankCharacter?.charName} (${highestRankCharacter?.rankTier})`}
                  >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#141A26] border-2 border-slate-700/80 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-xl group-hover:border-amber-500/80 transition-all">
                      {highestRankCharacter && (
                        <CharacterIcon
                          name={highestRankCharacter.charName}
                          size="xl"
                          showBorder={false}
                          className="w-full h-full"
                        />
                      )}
                      {/* Rank Emblem Badge Overlay */}
                      {highestRankCharacter && (
                        <div className="absolute -bottom-1 -right-1 bg-[#090D14] p-1 rounded-lg border border-slate-700/80 shadow-md">
                          <RankEmblem tier={highestRankCharacter.rankTier} size="sm" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-400">
                      <span className="font-semibold text-slate-200">
                        {account.fighterName}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="font-mono text-slate-300">CFN ID: {USER_CFN_ID}</span>
                      <span className="text-slate-600">·</span>
                      <span>{account.platform}</span>
                      <span className="text-slate-600">·</span>
                      <span>{account.region}</span>
                    </div>

                    <div className="flex flex-wrap items-baseline gap-3">
                      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white font-display">
                        {account.fighterName}
                      </h1>
                      {highestRankCharacter && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs sm:text-sm font-medium text-amber-300">
                          <Trophy className="w-3.5 h-3.5 text-amber-400" />
                          <span>
                            Топ боец: <strong className="text-white">{highestRankCharacter.charName}</strong> ({highestRankCharacter.rankTier} · {highestRankCharacter.currentLp.toLocaleString('ru-RU')} LP)
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs sm:text-sm">
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-950/50 text-emerald-300 border border-emerald-800/50 rounded-full font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        {account.onlineStatus}
                      </span>
                      <span className="text-slate-400 font-mono text-xs sm:text-sm">
                        Последняя синхронизация:{' '}
                        <strong className="text-slate-200">
                          {new Date(account.lastSyncIso || account.capcomSyncedAt || Date.now()).toLocaleString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side: Dedicated Synchronize Button */}
                <div className="flex flex-col items-start lg:items-end gap-1.5 self-start lg:self-center">
                  <button
                    type="button"
                    onClick={() => fetchAccountStats(selectedCharId, true)}
                    disabled={isSyncing}
                    className={`inline-flex items-center justify-center gap-2.5 px-6 py-3 text-sm font-bold rounded-xl transition-all cursor-pointer shadow-lg disabled:opacity-60 active:scale-[0.98] ${
                      syncSuccess
                        ? 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/50'
                        : 'text-amber-300 hover:text-white bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 hover:border-amber-500/70'
                    }`}
                    title="Принудительно обновить данные напрямую с серверов Capcom CFN"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncSuccess ? 'text-emerald-400' : 'text-amber-400'} ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>
                      {isSyncing
                        ? 'Запрос новых игр из Capcom CFN...'
                        : syncSuccess
                        ? 'Данные CFN обновлены!'
                        : 'Синхронизировать данные CFN'}
                    </span>
                  </button>
                </div>
              </div>

              {/* 2. Character Selector Grid: ONLY characters with games played */}
              <div id="characters-list" className="mt-8 pt-6 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span>Персонажи аккаунта с сыгранными матчами ({activeCharacters.length})</span>
                  </div>
                  <span className="text-xs text-slate-400 hidden sm:inline">
                    Кликните по персонажу для просмотра подробной аналитики
                  </span>
                </div>

                {/* Responsive Grid for PC: spacious and prominent cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {activeCharacters.map((char) => {
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
                        className={`group p-3 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#151D2C] border-amber-500/80 shadow-lg ring-1 ring-amber-500/40'
                            : 'bg-[#0A0E17]/90 hover:bg-[#121824] border-slate-800/90 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <CharacterIcon
                            name={char.charName}
                            size="md"
                            showBorder={false}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm sm:text-base font-bold text-white truncate">
                                {char.charName}
                              </span>
                              {isHighest && (
                                <span
                                  className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shrink-0"
                                  title="Высший ранг"
                                />
                              )}
                            </div>
                            <div className="text-xs font-mono text-slate-400 truncate">
                              {char.rankTier}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-300 font-semibold">
                            {char.totalMatches} {char.totalMatches === 1 ? 'бой' : 'боев'}
                          </span>
                          <span
                            className={`font-bold ${
                              char.winrate >= 60
                                ? 'text-emerald-400'
                                : char.winrate >= 50
                                ? 'text-amber-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {char.winrate}% WR
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Selected Character Detailed Stat Row */}
              <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-[#090D14]/80 border border-slate-800/80 rounded-xl p-4 sm:p-5">
                  <div className="text-xs sm:text-sm font-semibold text-slate-400">
                    Ранг на бойце ({currentCharacter.charName})
                  </div>
                  <div className="mt-2 text-xl sm:text-2xl lg:text-3xl font-bold font-display text-white flex items-center gap-2.5">
                    <RankEmblem tier={currentCharacter.rankTier} size="md" />
                    <span>{currentCharacter.rankTier}</span>
                  </div>
                  <div className="text-xs sm:text-sm font-mono text-amber-400 font-semibold mt-1">
                    {currentCharacter.currentLp > 0
                      ? `${currentCharacter.currentLp.toLocaleString('ru-RU')} LP`
                      : 'Вне лиги / Калибровка'}
                  </div>
                </div>

                <div className="bg-[#090D14]/80 border border-slate-800/80 rounded-xl p-4 sm:p-5">
                  <div className="text-xs sm:text-sm font-semibold text-slate-400">
                    Винрейт в CFN
                  </div>
                  <div className="mt-2 text-xl sm:text-2xl lg:text-3xl font-bold font-mono text-emerald-400">
                    {currentCharacter.winrate}%
                  </div>
                  <div className="text-xs sm:text-sm font-mono text-slate-300 mt-1">
                    {currentCharacter.wins}W – {currentCharacter.losses}L (всего {currentCharacter.totalMatches})
                  </div>
                </div>

                <div className="bg-[#090D14]/80 border border-slate-800/80 rounded-xl p-4 sm:p-5">
                  <div className="text-xs sm:text-sm font-semibold text-slate-400">
                    Серия побед
                  </div>
                  <div className="mt-2 text-xl sm:text-2xl lg:text-3xl font-bold font-mono text-amber-400">
                    {currentCharacter.winStreak}W
                  </div>
                  <div className="text-xs sm:text-sm font-mono text-slate-400 mt-1">
                    Рекорд аккаунта: <strong className="text-slate-200">{currentCharacter.bestWinStreak}W</strong>
                  </div>
                </div>

                <div className="bg-[#090D14]/80 border border-slate-800/80 rounded-xl p-4 sm:p-5">
                  <div className="text-xs sm:text-sm font-semibold text-slate-400">
                    Тип управления / Опыт
                  </div>
                  <div className="mt-2 text-xl sm:text-2xl lg:text-3xl font-bold text-slate-100">
                    {currentCharacter.controlType}
                  </div>
                  <div className="text-xs sm:text-sm font-mono text-slate-400 mt-1">
                    Отыграно: ~{currentCharacter.hoursPlayed} ч
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Rank History Trajectory Chart */}
            <RankChart
              character={currentCharacter}
              selectedPointId={selectedPointId}
              onSelectPoint={(pt) => setSelectedPointId(pt.id)}
            />

            {/* 5. Matchups Table */}
            <section
              id="matchups"
              className="bg-[#0D121B] border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
                    Винрейт {currentCharacter.charName} против других персонажей
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Официальные показатели Capcom CFN для персонажа {currentCharacter.charName}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={matchupSearch}
                      onChange={(e) => setMatchupSearch(e.target.value)}
                      placeholder="Поиск бойца..."
                      className="pl-10 pr-4 py-2 text-sm bg-[#090D14] border border-slate-700/80 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 w-44 sm:w-56"
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
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-200 bg-[#090D14] border border-slate-700/80 rounded-lg hover:border-slate-600 cursor-pointer shadow-sm"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
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
              <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-[#0A0E17]/60">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400 bg-[#090D14]">
                      <th className="py-4 px-5 w-20 text-center">Иконка</th>
                      <th className="py-4 px-5">Имя персонажа</th>
                      <th className="py-4 px-5 text-right font-mono">Сыграно игр</th>
                      <th className="py-4 px-5 text-right font-mono">Выиграно игр</th>
                      <th className="py-4 px-5 text-right font-mono">Процент побед</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {displayedMatchups.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-400 text-sm">
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
                            className="hover:bg-slate-800/30 transition-colors group"
                          >
                            {/* 1. Иконка персонажа */}
                            <td className="py-3.5 px-5 text-center">
                              <CharacterIcon name={m.opponentName} size="md" />
                            </td>
                            {/* 2. Имя персонажа */}
                            <td className="py-3.5 px-5">
                              <div className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                                {m.opponentName}
                              </div>
                              <div className="text-xs text-slate-400">
                                {m.archetype}
                              </div>
                            </td>
                            {/* 3. Сыгранные количество игр против него */}
                            <td className="py-3.5 px-5 text-right font-mono tabular-nums text-sm sm:text-base font-semibold text-slate-200">
                              {m.matches}
                            </td>
                            {/* 4. Количество выигранных игр из этого количества */}
                            <td className="py-3.5 px-5 text-right font-mono tabular-nums text-sm sm:text-base">
                              <span className="text-emerald-400 font-bold">{m.wins}</span>
                              <span className="text-slate-500 mx-1.5 font-normal">/</span>
                              <span className="text-slate-300 font-semibold">{m.matches}</span>
                            </td>
                            {/* 5. Процент побед над ним */}
                            <td className="py-3.5 px-5 text-right font-mono tabular-nums">
                              <span
                                className={`inline-block px-3 py-1 text-sm sm:text-base font-bold rounded-lg ${
                                  isHigh
                                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                                    : isLow
                                    ? 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                                    : 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
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

            {/* 6. Playtime & Recent Match Log */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Playtime modes (6 cols) */}
              <section
                id="playtime"
                className="lg:col-span-6 bg-[#0D121B] border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xl"
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-5 h-5 text-amber-400" />
                    <h2 className="text-lg sm:text-xl font-bold text-white font-display">
                      Время в игре и режимах
                    </h2>
                  </div>
                  <span className="text-sm font-mono text-amber-400 font-bold bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/30">
                    {account.playtime.totalHours} ч суммарно
                  </span>
                </div>

                <div className="space-y-3">
                  {account.playtime.modes.map((mode) => (
                    <div
                      key={mode.id}
                      className="p-3.5 bg-[#0A0E17]/80 border border-slate-800/80 rounded-xl flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="text-sm sm:text-base font-semibold text-slate-200">
                          {mode.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {mode.description}
                        </div>
                      </div>
                      <div className="text-right font-mono shrink-0 ml-4">
                        <div className="text-base sm:text-lg font-bold text-white">
                          {mode.hours} ч
                        </div>
                        <div className="text-xs text-slate-400">
                          {mode.percentage}% времени
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Match log (6 cols) */}
              <section
                id="matches"
                className="lg:col-span-6 bg-[#0D121B] border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xl"
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <Swords className="w-5 h-5 text-amber-400" />
                    <h2 className="text-lg sm:text-xl font-bold text-white font-display">
                      Недавние бои ({currentCharacter.charName})
                    </h2>
                  </div>
                  <span className="text-xs sm:text-sm text-slate-400 font-mono">
                    Всего в истории: {currentCharacter.rankHistory.length}
                  </span>
                </div>

                <div className="space-y-2.5">
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
                          className={`p-3 sm:p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#151D2C] border-amber-500/80 shadow-md ring-1 ring-amber-500/40'
                              : 'bg-[#0A0E17]/80 hover:bg-[#121824] border-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <CharacterIcon name={pt.opponentCharName} size="md" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-mono font-bold text-xs sm:text-sm px-2 py-0.5 rounded ${
                                    isWin
                                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                                      : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                                  }`}
                                >
                                  {isWin ? 'WIN' : 'LOSS'}
                                </span>
                                <span className="text-sm sm:text-base font-bold text-slate-200">
                                  vs {pt.opponentCharName}
                                </span>
                              </div>
                              <div className="text-xs text-slate-400 font-mono mt-0.5">
                                {pt.dateLabel} {pt.timeLabel}{' '}
                                {pt.replayId ? `· Replay ${pt.replayId}` : ''}
                              </div>
                            </div>
                          </div>

                          <div className="text-right font-mono">
                            <div
                              className={`text-sm sm:text-base font-bold ${
                                isWin ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {pt.deltaLp >= 0 ? `+${pt.deltaLp}` : pt.deltaLp} LP
                            </div>
                            <div className="text-xs sm:text-sm text-slate-400 font-medium">
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

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 py-6 px-6 lg:px-10 text-xs sm:text-sm text-slate-400 bg-[#070A10]">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            SF6 Analytics · Персональная статистика игрока{' '}
            <strong className="text-slate-200 font-semibold">
              {account?.fighterName || 'Kapubara'}
            </strong>{' '}
            (CFN ID: <span className="font-mono text-amber-400">{USER_CFN_ID}</span>)
          </div>
          <div className="text-slate-500 font-mono text-xs">
            Street Fighter 6 · Capcom Fighting Network
          </div>
        </div>
      </footer>
    </div>
  );
}

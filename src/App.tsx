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
  Shield,
  Trophy,
} from 'lucide-react';
import type { CFNAccountData } from './types/sf6';
import { RankEmblem } from './components/RankEmblem';
import { RankChart } from './components/RankChart';
import { CharacterIcon } from './components/CharacterIcon';
import { PWAInstallButton } from './components/PWAInstallButton';

type MatchupSort = 'matches_desc' | 'winrate_desc' | 'name_asc';

const PROMPT_SPEC_TEXT = `Создай минималистичное веб-приложение для отслеживания статистики аккаунта Street Fighter 6 по CFN ID: 2438096652 (игрок Kapubara).

1. Данные профиля:
- Игрок: Kapubara (CFN ID: 2438096652, Steam, Russia).
- Аватар профиля: иконка персонажа с наивысшим рангом на аккаунте (Alex · 15,350 LP, Platinum 2).
- Персонажи: на аккаунте отображаются только персонажи, на которых были сыграны игры (Ed 80 матчей, Sagat 45 матчей, Alex 27 матчей, Jamie, Cammy, Terry, Akuma, M. Bison, Luke, Zangief, Dee Jay, A.K.I., Blanka, Guile).
- Автоматическая синхронизация: данные напрямую подтягиваются из базы CFN без необходимости ручного ввода.
- Время в игре: статистика игрового времени и распределение по режимам (Fighting Ground, Battle Hub, World Tour).

2. Требования к интерфейсу:
- Чистый, выразительный интерфейс с крупными, удобными для чтения на ПК шрифтами и иконками.
- График ранга (LP/MR) по времени с интерактивным тултипом.
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
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Matchup list controls
  const [matchupSearch, setMatchupSearch] = useState('');
  const [matchupSort, setMatchupSort] = useState<MatchupSort>('matches_desc');

  // Modal state
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const fetchAccountStats = useCallback(
    async (
      targetCfn: string,
      charIdForTick = selectedCharId,
      forceRefresh = false
    ) => {
      try {
        if (forceRefresh) {
          setIsSyncing(true);
        } else if (!account) {
          setIsLoading(true);
        }
        setErrorMsg(null);
        const params = new URLSearchParams();
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
        setIsSyncing(false);
      }
    },
    [account, selectedCharId]
  );

  useEffect(() => {
    fetchAccountStats(activeCfnId, 'ed');
  }, [activeCfnId]);

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
    <div className="min-h-screen bg-[#090D14] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 lg:px-10 py-3.5 bg-[#090D14]/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="flex items-center gap-3.5">
          <a
            href="/"
            className="text-lg lg:text-xl font-bold tracking-tight text-white font-display flex items-center gap-2"
          >
            <span>SF6 Analytics</span>
          </a>
          <span className="text-slate-600 text-sm hidden sm:inline">/</span>
          <span className="text-xs sm:text-sm text-slate-400 font-mono bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">
            CFN {activeCfnId}
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
          <PWAInstallButton />
          <button
            type="button"
            onClick={() => setIsPromptOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>ТЗ</span>
          </button>
        </div>
      </header>

      {/* Main Viewport Container */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-10 py-8 space-y-8">
        {errorMsg && (
          <div className="p-4 bg-rose-950/30 border border-rose-800/60 rounded-xl text-rose-300 text-sm flex items-center justify-between">
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={() => fetchAccountStats(activeCfnId)}
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
                      <span className="font-mono text-slate-300">CFN: {account.cfnId}</span>
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
                          {new Date(account.capcomSyncedAt || account.lastSyncIso).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* CFN ID Search & Synchronization Block */}
                <div className="flex flex-col gap-2.5 self-start lg:self-center w-full sm:w-auto">
                  <form
                    onSubmit={handleSearchSubmit}
                    className="flex items-center gap-2"
                  >
                    <div className="relative flex-1 sm:flex-initial">
                      <input
                        type="text"
                        value={cfnInput}
                        onChange={(e) => setCfnInput(e.target.value)}
                        placeholder="CFN ID..."
                        className="px-4 py-2 text-sm font-mono bg-[#090D14] border border-slate-700/80 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500 w-full sm:w-48"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-semibold text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      Изменить
                    </button>
                  </form>

                  {/* Prominent Synchronize Button right underneath */}
                  <button
                    type="button"
                    onClick={() => fetchAccountStats(activeCfnId, selectedCharId, true)}
                    disabled={isSyncing}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-amber-300 hover:text-white bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 hover:border-amber-500/70 rounded-lg transition-all cursor-pointer shadow-md disabled:opacity-50"
                    title="Синхронизировать данные профиля с серверами Capcom CFN"
                  >
                    <RefreshCw className={`w-4 h-4 text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Синхронизация...' : 'Синхронизировать'}</span>
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
            SF6 Analytics · Статистика игрока{' '}
            <strong className="text-slate-200 font-semibold">
              {account?.fighterName || 'Kapubara'}
            </strong>{' '}
            (CFN ID: <span className="font-mono text-amber-400">{activeCfnId}</span>)
          </div>
          <button
            type="button"
            onClick={() => setIsPromptOpen(true)}
            className="hover:text-amber-400 transition-colors underline cursor-pointer"
          >
            Текст ТЗ и спецификации
          </button>
        </div>
      </footer>

      {/* Prompt Modal */}
      {isPromptOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#0D121B] border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white font-display">ТЗ / Промпт для генерации</h3>
              <button
                type="button"
                onClick={() => setIsPromptOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <textarea
              readOnly
              value={PROMPT_SPEC_TEXT}
              rows={12}
              className="w-full text-xs sm:text-sm font-mono bg-[#090D14] border border-slate-800 rounded-lg text-slate-300 p-4 select-all focus:outline-none"
            />
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer transition-colors shadow-sm"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Скопировано!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Скопировать</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsPromptOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
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

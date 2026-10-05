export type RankTier =
  | 'Legend'
  | 'Master'
  | 'Diamond 5'
  | 'Diamond 4'
  | 'Diamond 3'
  | 'Diamond 2'
  | 'Diamond 1'
  | 'Platinum 5'
  | 'Platinum 4'
  | 'Platinum 3'
  | 'Platinum 2'
  | 'Platinum 1'
  | 'Gold 5'
  | 'Gold 4'
  | 'Gold 3'
  | 'Gold 2'
  | 'Gold 1'
  | 'Silver 5'
  | 'Silver 4'
  | 'Silver 3'
  | 'Silver 2'
  | 'Silver 1'
  | 'Bronze 5'
  | 'Bronze 4'
  | 'Bronze 3'
  | 'Bronze 2'
  | 'Bronze 1'
  | 'Bronze'
  | 'Iron 5'
  | 'Iron 4'
  | 'Iron 3'
  | 'Iron 2'
  | 'Iron 1'
  | 'Iron'
  | 'Rookie 5'
  | 'Rookie 4'
  | 'Rookie 3'
  | 'Rookie 2'
  | 'Rookie 1'
  | 'Rookie'
  | 'New Challenger';

export interface RankHistoryPoint {
  id: string;
  replayId?: string;
  timestamp: string; // ISO string
  timeLabel: string; // e.g., "18:57:38"
  dateLabel: string; // e.g., "28 сен"
  mr: number;        // Master Rating (0 if below Master)
  lp: number;        // League Points
  deltaMr: number;
  deltaLp: number;
  opponentCharId: string;
  opponentCharName: string;
  opponentName: string;
  opponentCfnId?: string;
  opponentLp?: number;
  opponentMr: number;
  result: 'WIN' | 'LOSS';
  score: string;
  rankTier: RankTier;
}

export interface MatchupStat {
  opponentId: string;
  opponentName: string;
  archetype: string;
  matches: number;
  wins: number;
  losses: number;
  winrate: number;
  avgMrDelta: number;
  lastPlayed: string;
  recentForm: ('W' | 'L')[];
}

export interface CharacterStats {
  charId: string;
  charName: string;
  controlType: 'Classic' | 'Modern';
  archetype: string;
  rankTier: RankTier;
  currentMr: number;
  peakMr: number;
  currentLp: number;
  serverRank: number;
  totalMatches: number;
  wins: number;
  losses: number;
  winrate: number;
  rankedWinrate: number;
  winStreak: number;
  bestWinStreak: number;
  hoursPlayed: number;
  driveUsage: {
    driveImpactRate: number;
    driveParryRate: number;
    driveRushRate: number;
    superArt3FinishRate: number;
    throwsPerGame?: number;
    punishCounterPerGame?: number;
  };
  matchups: MatchupStat[];
  rankHistory: RankHistoryPoint[];
}

export interface PlaytimeBreakdown {
  totalHours: number;
  fightingGroundHours: number;
  battleHubHours: number;
  worldTourHours: number;
  modes: {
    id: string;
    name: string;
    category: 'Fighting Ground' | 'Battle Hub' | 'World Tour';
    hours: number;
    percentage: number;
    matchesOrSessions: number;
    description: string;
  }[];
}

export interface CFNAccountData {
  cfnId: string;
  fighterName: string;
  clubName: string;
  title: string;
  comment?: string;
  region: string;
  platform: string;
  phase: string;
  onlineStatus: string;
  lastSyncIso: string;
  capcomSyncedAt?: string;
  dataSource: 'sfstats_capcom_live' | 'buckler_live' | 'cfn_telemetry_stream';
  officialRankedGames: number;
  officialCasualGames: number;
  officialCustomGames: number;
  mainCharacterId: string;
  playtime: PlaytimeBreakdown;
  characters: CharacterStats[];
}

export interface ProfileOverridePayload {
  fighterName?: string;
  clubName?: string;
  charId?: string;
  rankTier?: RankTier;
  currentLp?: number;
  currentMr?: number;
  wins?: number;
  losses?: number;
}

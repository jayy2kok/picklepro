
export type MatchType = 'Singles' | 'Doubles';

export interface Player {
  id: string;
  name: string;
  joinedDate: string;
}

export interface Match {
  id: string;
  date: string;
  type: MatchType;
  teamA: string[];
  teamB: string[];
  scoreA: number;
  scoreB: number;
  location: string;
  notes?: string;
  userId: string;
}

export interface PlayerStats {
  name: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  avgPointsFor: number;
  avgPointsAgainst: number;
  playStyle?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
  role?: 'ADMIN' | 'VIEWER';
}

export interface AppState {
  user: User | null;
  matches: Match[];
  players: Player[];
  isLoading: boolean;
}

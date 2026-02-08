
export type MatchType = 'Singles' | 'Doubles';

export interface Player {
  id: string;
  name: string;
  email?: string;
  contactNumber?: string;
  socialMedia?: {
    linkedin?: string;
    x?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
  };
  joinedDate: string;
  rating?: number;
}

export interface Venue {
  id: string;
  name: string;
  location: string;
  courtCount: number;
}

export interface Match {
  id: string;
  date: string;
  type: MatchType;
  teamA: string[];
  teamB: string[];
  scoreA: number;
  scoreB: number;
  venueId?: string;
  courtNumber?: number;
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

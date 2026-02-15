// Shared types — identical to frontend/types.ts
export type MatchType = 'Singles' | 'Doubles';
export type Role = 'GROUP_ADMIN' | 'VIEWER';
export type SystemRole = 'ADMIN' | 'USER';

export interface Group {
    id: string;
    name: string;
}

export interface Player {
    id: string;
    name: string;
    email?: string;
    contactNumber?: string;
    socialMedia?: Record<string, string>;
    joinedDate: string;
    rating?: number;
    systemRole: SystemRole;
    memberships: Record<string, Role>;
}

export interface Venue {
    id: string;
    name: string;
    location: string;
    courtCount: number;
    createdByUserId?: string;
    groupId?: string;
}

export interface Match {
    id: string;
    date: string;
    type: MatchType;
    teamA: string[];
    teamB: string[];
    teamANames?: string[];
    teamBNames?: string[];
    scoreA: number;
    scoreB: number;
    venueId?: string;
    courtNumber?: number;
    notes?: string;
    userId: string;
    groupId?: string;
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
    systemRole: SystemRole;
    memberships: Record<string, Role>;
}

export interface AppState {
    user: User | null;
    matches: Match[];
    players: Player[];
    groups: Group[];
    activeGroupId: string | null;
    isLoading: boolean;
}

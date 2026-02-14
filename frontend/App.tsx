import React, { useState, useEffect, useCallback } from 'react';
import { User, Match, Player, AppState, Venue, Group, Role } from './types';
import AuthOverlay from './components/AuthOverlay';
import MatchForm from './components/MatchForm';
import MatchList from './components/MatchList';
import StatsDashboard from './components/StatsDashboard';
import PlayerManager from './components/PlayerManager';
import VenueManager from './components/VenueManager';
import ProfileEditor from './components/ProfileEditor';
import CreateGroupModal from './components/CreateGroupModal';
import GroupSelector from './components/GroupSelector';
import { Icons } from './constants';
import { playersApi, matchesApi, venuesApi, groupsApi } from './api';

const THEME_KEY = 'picklepro_theme';
const ACTIVE_GROUP_KEY = 'picklepro_active_group';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    user: null,
    matches: [],
    players: [],
    groups: [],
    activeGroupId: localStorage.getItem(ACTIVE_GROUP_KEY),
    isLoading: true
  });
  const [venues, setVenues] = useState<Venue[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>(
    (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || 'light'
  );
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'history' | 'players' | 'venues' | 'profile'>('stats');
  const [error, setError] = useState<string | null>(null);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);

  // Load data from API
  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [players, matches, venueList, groups] = await Promise.all([
        playersApi.getAll(),
        matchesApi.getAll(),
        venuesApi.getAll(),
        groupsApi.getAll()
      ]);

      // Validate activeGroupId
      let currentGroupId = localStorage.getItem(ACTIVE_GROUP_KEY);
      const isValidGroup = currentGroupId && groups.some(g => g.id === currentGroupId);

      if (!isValidGroup && groups.length > 0) {
        currentGroupId = groups[0].id;
        localStorage.setItem(ACTIVE_GROUP_KEY, currentGroupId);
      } else if (!isValidGroup) {
        currentGroupId = null;
        localStorage.removeItem(ACTIVE_GROUP_KEY);
      }

      setState(prev => ({
        ...prev,
        players,
        matches,
        groups,
        activeGroupId: currentGroupId,
        isLoading: false
      }));
      setVenues(venueList);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data. Please try again.');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('picklepro_user');
    const token = localStorage.getItem('picklepro_token');

    if (savedUser && token) {
      setState(prev => ({ ...prev, user: JSON.parse(savedUser) }));
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Load data when user is authenticated
  useEffect(() => {
    if (state.user) {
      loadData();
    }
  }, [state.user, loadData]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Sync state.user permissions with latest players list
  useEffect(() => {
    if (state.user && state.players.length > 0) {
      const currentPlayer = state.players.find(p => p.email === state.user!.email);
      if (currentPlayer) {
        let shouldUpdate = false;
        const updatedUser = { ...state.user };

        // Check system role change
        if (currentPlayer.systemRole !== state.user.systemRole) {
          updatedUser.systemRole = currentPlayer.systemRole;
          shouldUpdate = true;
        }

        // Check memberships change (shallow compare is usually enough for key:value pairs)
        const currentMembershipsStr = JSON.stringify(state.user.memberships || {});
        const newMembershipsStr = JSON.stringify(currentPlayer.memberships || {});

        if (currentMembershipsStr !== newMembershipsStr) {
          updatedUser.memberships = currentPlayer.memberships || {};
          shouldUpdate = true;
        }

        if (shouldUpdate) {
          setState(prev => ({ ...prev, user: updatedUser }));
          localStorage.setItem('picklepro_user', JSON.stringify(updatedUser));
        }
      }
    }
  }, [state.players, state.user?.email, state.user?.memberships, state.user?.systemRole]);



  const handleLogin = (user: User) => {
    setState(prev => ({ ...prev, user, isLoading: true }));
    localStorage.setItem('picklepro_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setState({
      user: null,
      matches: [],
      players: [],
      groups: [],
      activeGroupId: null,
      isLoading: false
    });
    localStorage.removeItem('picklepro_user');
    localStorage.removeItem('picklepro_token');
    localStorage.removeItem(ACTIVE_GROUP_KEY);
  };

  const handleGroupChange = (groupId: string) => {
    setState(prev => ({ ...prev, activeGroupId: groupId }));
    localStorage.setItem(ACTIVE_GROUP_KEY, groupId);
  };

  const handleCreateGroup = () => {
    setIsCreateGroupModalOpen(true);
  };

  const handleCreateGroupSubmit = async (name: string) => {
    try {
      const newGroup = await groupsApi.create({ name });
      setState(prev => ({
        ...prev,
        groups: [...prev.groups, newGroup],
        activeGroupId: newGroup.id
      }));
      localStorage.setItem(ACTIVE_GROUP_KEY, newGroup.id);
      setIsCreateGroupModalOpen(false);
    } catch (err) {
      console.error('Failed to create group:', err);
      // Error handling is done inside the modal
    }
  };

  const handleAddPlayer = async (playerData: Partial<Player>, role: Role = 'VIEWER') => {
    try {
      setError(null);
      // Default to VIEWER for new players in the current group
      const newPlayer = await playersApi.create(playerData, state.activeGroupId || undefined, role);
      setState(prev => ({ ...prev, players: [...prev.players, newPlayer] }));
    } catch (err) {
      console.error('Failed to add player:', err);
      setError('Failed to add player. Please try again.');
    }
  };

  const handleAddExistingToGroup = async (playerId: string, groupId: string, role: Role) => {
    try {
      setError(null);
      await playersApi.addToGroup(playerId, groupId, role);
      // Refresh players to pick up the new membership
      const players = await playersApi.getAll();
      setState(prev => ({ ...prev, players }));

      // Update state.user if the current user was modified
      if (state.user && state.user.email) {
        const contentUser = players.find(p => p.email === state.user.email);
        if (contentUser && contentUser.memberships) {
          const updatedUser = { ...state.user, memberships: contentUser.memberships };
          setState(prev => ({ ...prev, user: updatedUser }));
          localStorage.setItem('picklepro_user', JSON.stringify(updatedUser));
        }
      }

      alert('Player added to group successfully!');
    } catch (err) {
      console.error('Failed to add existing player to group:', err);
      setError('Failed to add existing player to group. Please try again.');
    }
  };

  const handleUpdatePlayer = async (id: string, playerData: Partial<Player>) => {
    try {
      setError(null);
      const updatedPlayer = await playersApi.update(id, playerData);
      setState(prev => ({
        ...prev,
        players: prev.players.map(p => p.id === id ? updatedPlayer : p)
      }));
    } catch (err) {
      console.error('Failed to update player:', err);
      setError('Failed to update player. Please try again.');
    }
  };

  const handleRemovePlayer = async (id: string) => {
    if (!window.confirm('Delete this player? Match history will remain but names will stay as text.')) {
      return;
    }
    try {
      setError(null);
      await playersApi.delete(id);
      setState(prev => ({ ...prev, players: prev.players.filter(p => p.id !== id) }));
    } catch (err) {
      console.error('Failed to delete player:', err);
      setError('Failed to delete player. Please try again.');
    }
  };

  const handleSaveMatch = async (matchData: Omit<Match, 'id' | 'userId'>) => {
    try {
      setError(null);
      const matchWithGroup = { ...matchData, groupId: state.activeGroupId || undefined };
      const newMatch = await matchesApi.create(matchWithGroup);
      // Re-fetch players to pick up updated ratings from RatingService
      const updatedPlayers = await playersApi.getAll();
      setState(prev => ({ ...prev, matches: [...prev.matches, newMatch], players: updatedPlayers }));
      setShowForm(false);
      setActiveTab('history');
    } catch (err) {
      console.error('Failed to save match:', err);
      setError('Failed to save match. Please try again.');
    }
  };

  const handleDeleteMatch = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this match?')) return;

    try {
      setError(null);
      await matchesApi.delete(id);
      // Re-fetch players to pick up any rating recalculations
      const updatedPlayers = await playersApi.getAll();
      setState(prev => ({ ...prev, matches: prev.matches.filter(m => m.id !== id), players: updatedPlayers }));
    } catch (err) {
      console.error('Failed to delete match:', err);
      setError('Failed to delete match. Please try again.');
    }
  };

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const isSystemAdmin = state.user?.systemRole === 'ADMIN';
  const isGroupAdmin = isSystemAdmin || (state.activeGroupId ? state.user?.memberships[state.activeGroupId] === 'GROUP_ADMIN' : false);

  if (!state.user) return <AuthOverlay onLogin={handleLogin} />;

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Filter components data by active group
  const groupMatches = state.activeGroupId
    ? state.matches.filter(m => m.groupId === state.activeGroupId)
    : state.matches;

  const groupPlayers = state.activeGroupId
    ? state.players.filter(p => p.memberships[state.activeGroupId!])
    : state.players;

  // Venues are global
  const allVenues = venues;

  return (
    <div className="min-h-screen pb-24 dark:bg-slate-950 transition-colors duration-300">
      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onCreate={handleCreateGroupSubmit}
      />

      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-3 md:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-lime-500 rounded-lg flex items-center justify-center text-white font-bold">P</div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">PicklePro</span>
            </div>

            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden md:block"></div>

            <div className="hidden md:flex items-end gap-2">
              <GroupSelector
                groups={state.groups}
                activeGroupId={state.activeGroupId}
                onChange={handleGroupChange}
                className="w-64"
              />
              {isSystemAdmin && (
                <button
                  onClick={handleCreateGroup}
                  className="p-2 rounded-xl bg-lime-500 text-white hover:bg-lime-600 transition-colors shadow-sm"
                  title="Create New Group"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:scale-110 transition-all"
              aria-label="Toggle Dark Mode"
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              )}
            </button>
            <img
              src={state.user.picture}
              className="w-10 h-10 rounded-full border-2 border-slate-100 dark:border-slate-800 cursor-pointer hover:border-lime-500 transition-colors"
              onClick={() => setActiveTab('profile')}
              title="View Profile"
            />
            <button onClick={handleLogout} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              <Icons.Logout className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 pt-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">&times;</button>
          </div>
        )}

        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="md:hidden mb-2 flex items-end gap-2">
            <GroupSelector
              groups={state.groups}
              activeGroupId={state.activeGroupId}
              onChange={handleGroupChange}
              className="flex-1"
            />
            {isSystemAdmin && (
              <button
                onClick={handleCreateGroup}
                className="p-2 rounded-xl bg-lime-500 text-white hover:bg-lime-600 transition-colors shadow-sm"
                title="Create New Group"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
          </div>
          <div className="flex gap-2 p-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
            {['stats', 'history', 'players', 'venues'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap shrink-0 ${activeTab === tab ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </header>

        {showForm ? (
          <MatchForm players={groupPlayers} matches={groupMatches} onSave={handleSaveMatch} onCancel={() => setShowForm(false)} />
        ) : (
          <div className="animate-in fade-in duration-300">
            {activeTab === 'stats' && <StatsDashboard matches={groupMatches} players={groupPlayers} userName={state.user.name} />}
            {activeTab === 'history' && <MatchList matches={groupMatches} venues={allVenues} onDelete={handleDeleteMatch} readOnly={!isGroupAdmin} />}
            {activeTab === 'players' && <PlayerManager
              players={groupPlayers}
              activeGroupId={state.activeGroupId}
              onAddPlayer={handleAddPlayer}
              onUpdatePlayer={handleUpdatePlayer}
              onRemovePlayer={handleRemovePlayer}
              onAddExistingToGroup={handleAddExistingToGroup}
              readOnly={!isGroupAdmin}
            />}
            {activeTab === 'venues' && <VenueManager user={state.user} activeGroupId={state.activeGroupId} isGroupAdmin={isGroupAdmin} />}
            {activeTab === 'profile' && (
              <ProfileEditor
                player={state.players.find(p => p.email === state.user?.email)}
                user={state.user}
                onSave={(updatedPlayer) => {
                  setState(prev => ({
                    ...prev,
                    players: prev.players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p)
                  }));
                  // If new player was created (not in list), add it
                  if (!state.players.find(p => p.id === updatedPlayer.id)) {
                    setState(prev => ({ ...prev, players: [...prev.players, updatedPlayer] }));
                  }
                  alert('Profile saved successfully!');
                }}
                onCancel={() => setActiveTab('stats')}
              />
            )}
          </div>
        )}
      </main>

      {!showForm && isGroupAdmin && (
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-8 right-8 z-50 flex items-center gap-2 bg-lime-500 text-white px-6 py-4 rounded-full font-bold shadow-2xl shadow-lime-500/30 transition-all hover:scale-105 active:scale-95"
        >
          <Icons.Plus className="w-6 h-6" /> Record Match
        </button>
      )}
    </div>
  );
};

export default App;

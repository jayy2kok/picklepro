
import React, { useMemo, useEffect, useState } from 'react';
import { Match, PlayerStats } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StatsDashboardProps {
  matches: Match[];
  userName: string;
}

const ITEMS_PER_PAGE = 10;

const StatsDashboard: React.FC<StatsDashboardProps> = ({ matches, userName }) => {
  const [activePlayerName, setActivePlayerName] = useState<string>(userName);
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate all stats
  const allStats = useMemo(() => {
    const playerStats: Record<string, PlayerStats> = {};
    matches.forEach(m => {
      const players = [...m.teamA, ...m.teamB];
      players.forEach(p => {
        if (!playerStats[p]) {
          playerStats[p] = { name: p, matchesPlayed: 0, wins: 0, losses: 0, winRate: 0, avgPointsFor: 0, avgPointsAgainst: 0 };
        }
        const s = playerStats[p];
        s.matchesPlayed++;
        const isTeamA = m.teamA.includes(p);
        const win = (isTeamA && m.scoreA > m.scoreB) || (!isTeamA && m.scoreB > m.scoreA);
        if (win) s.wins++; else s.losses++;
        const pFor = isTeamA ? m.scoreA : m.scoreB;
        const pAgainst = isTeamA ? m.scoreB : m.scoreA;
        s.avgPointsFor = (s.avgPointsFor * (s.matchesPlayed - 1) + pFor) / s.matchesPlayed;
        s.avgPointsAgainst = (s.avgPointsAgainst * (s.matchesPlayed - 1) + pAgainst) / s.matchesPlayed;
        s.winRate = (s.wins / s.matchesPlayed) * 100;
      });
    });

    return Object.values(playerStats).sort((a, b) => {
      const scoreDiff = b.avgPointsFor - a.avgPointsFor;
      if (scoreDiff !== 0) return scoreDiff;
      return a.name.localeCompare(b.name);
    });
  }, [matches]);

  useEffect(() => {
    if (allStats.length > 0 && !allStats.find(s => s.name === activePlayerName)) {
      setActivePlayerName(allStats[0].name);
    }
  }, [allStats, activePlayerName]);

  const selectedPlayerStats = allStats.find(s => s.name === activePlayerName) || {
    name: activePlayerName,
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    avgPointsFor: 0,
    avgPointsAgainst: 0
  };

  const paginatedStats = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return allStats.slice(start, start + ITEMS_PER_PAGE);
  }, [allStats, currentPage]);

  const totalPages = Math.ceil(allStats.length / ITEMS_PER_PAGE);

  const chartData = useMemo(() => {
    return matches
      .filter(m => [...m.teamA, ...m.teamB].includes(activePlayerName))
      .slice(-10)
      .map((m, i) => {
        const isTeamA = m.teamA.includes(activePlayerName);
        return {
          name: `M${i + 1}`,
          points: isTeamA ? m.scoreA : m.scoreB,
          opponent: isTeamA ? m.scoreB : m.scoreA,
        };
      });
  }, [matches, activePlayerName]);

  if (matches.length === 0) return (
    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 transition-colors">
      <p className="text-slate-500 dark:text-slate-400 font-medium">No data available. Add a match to see your profile!</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 1. Player Roster (Top) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Player Standings</h3>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
            >
              <svg className="w-5 h-5 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
            >
              <svg className="w-5 h-5 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs uppercase font-bold">
                <th className="pb-4 pl-2">Name</th>
                <th className="pb-4 text-center">Rating</th>
                <th className="pb-4 text-center">Matches</th>
                <th className="pb-4 text-center">Avg Score</th>
                <th className="pb-4 text-center">Defense</th>
                <th className="pb-4 text-right pr-2">Win %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {paginatedStats.map(s => (
                <tr
                  key={s.name}
                  onClick={() => setActivePlayerName(s.name)}
                  className={`group hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all ${activePlayerName === s.name ? 'bg-lime-50/50 dark:bg-lime-900/10' : ''}`}
                >
                  <td className="py-4 pl-2 font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    {activePlayerName === s.name && <div className="w-1.5 h-1.5 rounded-full bg-lime-500"></div>}
                    {s.name}
                  </td>
                  <td className="py-4 text-center text-slate-500 dark:text-slate-400">{matches.find(m => m.teamA.includes(s.name) || m.teamB.includes(s.name)) ? (matches.find(m => m.teamA.includes(s.name) || m.teamB.includes(s.name)) as any).rating || 1200 : 1200}</td>
                  <td className="py-4 text-center text-slate-500 dark:text-slate-400">{s.matchesPlayed}</td>
                  <td className="py-4 text-center text-lime-600 dark:text-lime-400 font-bold">{s.avgPointsFor.toFixed(1)}</td>
                  <td className="py-4 text-center text-slate-400 dark:text-slate-600">{s.avgPointsAgainst.toFixed(1)}</td>
                  <td className="py-4 text-right pr-2 font-bold dark:text-slate-200">{s.winRate.toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Stats for Selected Player */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full flex items-center justify-center font-black transition-colors">
            {activePlayerName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">{activePlayerName}'s Performance</h2>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Selected Player Dashboard</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Win Rate', value: `${selectedPlayerStats.winRate.toFixed(0)}%`, icon: '🏆', color: 'text-lime-600 dark:text-lime-400' },
            { label: 'Avg Points', value: selectedPlayerStats.avgPointsFor.toFixed(1), icon: '🎾', color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Avg Against', value: selectedPlayerStats.avgPointsAgainst.toFixed(1), icon: '🛡️', color: 'text-rose-500 dark:text-rose-400' },
            { label: 'MatchesPlayed', value: selectedPlayerStats.matchesPlayed, icon: '📅', color: 'text-slate-600 dark:text-slate-400' },
          ].map((s, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 group hover:shadow-md transition-all">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">{s.label}</p>
              <p className={`text-2xl font-black flex items-center gap-2 ${s.color}`}>{s.icon} {s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
            <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
            Point Distribution (Last 10 Games)
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="points" fill="#84cc16" radius={[4, 4, 0, 0]} name="Score" />
                <Bar dataKey="opponent" fill="#475569" radius={[4, 4, 0, 0]} name="Opponent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;

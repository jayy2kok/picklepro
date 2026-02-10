
import React from 'react';
import { Match, Venue } from '../types';
import { Icons } from '../constants';

interface MatchListProps {
  matches: Match[];
  venues: Venue[];
  onDelete?: (id: string) => void;
  readOnly?: boolean;
}

const MatchList: React.FC<MatchListProps> = ({ matches, venues, onDelete, readOnly }) => {
  if (matches.length === 0) return (
    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
      <p className="text-slate-400 dark:text-slate-600 font-medium">No match history found.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2 px-2">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Match History</h2>
        <span className="text-sm font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full">{matches.length} Matches</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...matches].reverse().map((match) => (
          <div key={match.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 flex gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${match.type === 'Singles' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'}`}>
                {match.type}
              </span>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="text-center bg-slate-50 dark:bg-slate-950 rounded-xl p-2 min-w-[60px] border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                  {new Date(match.date).toLocaleDateString('en-US', { month: 'short' })}
                </p>
                <p className="text-xl font-black text-slate-800 dark:text-slate-200">
                  {new Date(match.date).getDate()}
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                  {match.venueId
                    ? `${venues.find(v => v.id === match.venueId)?.name || 'Venue'}${match.courtNumber ? ` - Court ${match.courtNumber}` : ''}`
                    : 'Match'
                  }
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Icons.Calendar className="w-3 h-3" />
                  {new Date(match.date).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 relative bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="text-center border-r border-slate-200 dark:border-slate-800 pr-2">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase mb-1">TEAM A</p>
                <div className="flex flex-wrap justify-center gap-1 mb-2 h-10 overflow-hidden">
                  {(match.teamANames || match.teamA).map(p => (
                    <span key={p} className="text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded shadow-sm border border-slate-100 dark:border-slate-800">{p}</span>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <p className={`text-3xl font-black ${match.scoreA > match.scoreB ? 'text-lime-600 dark:text-lime-400' : 'text-slate-400 dark:text-slate-700'}`}>{match.scoreA}</p>
                  {match.scoreA > match.scoreB && <Icons.Trophy className="w-5 h-5 text-lime-500 dark:text-lime-400" />}
                </div>
              </div>
              <div className="text-center pl-2">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase mb-1">TEAM B</p>
                <div className="flex flex-wrap justify-center gap-1 mb-2 h-10 overflow-hidden">
                  {(match.teamBNames || match.teamB).map(p => (
                    <span key={p} className="text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded shadow-sm border border-slate-100 dark:border-slate-800">{p}</span>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-2">
                  {match.scoreB > match.scoreA && <Icons.Trophy className="w-5 h-5 text-lime-500 dark:text-lime-400" />}
                  <p className={`text-3xl font-black ${match.scoreB > match.scoreA ? 'text-lime-600 dark:text-lime-400' : 'text-slate-400 dark:text-slate-700'}`}>{match.scoreB}</p>
                </div>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-300 dark:text-slate-600 shadow-sm">
                VS
              </div>
            </div>

            {match.notes && (
              <p className="mt-3 text-xs text-slate-400 dark:text-slate-500 italic bg-slate-50/50 dark:bg-slate-950/30 p-2 rounded-lg">"{match.notes}"</p>
            )}

            {onDelete && !readOnly && (
              <button
                onClick={() => onDelete(match.id)}
                className="absolute bottom-2 right-2 p-2 text-slate-300 hover:text-rose-500 dark:hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                title="Delete Match"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatchList;

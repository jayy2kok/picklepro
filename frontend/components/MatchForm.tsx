
import React, { useState, useMemo, useEffect } from 'react';
import { Match, MatchType, Player, Venue } from '../types';
import { venuesApi } from '../api';

interface MatchFormProps {
  players: Player[];
  matches: Match[];
  onSave: (match: Omit<Match, 'id' | 'userId'>) => void;
  onCancel: () => void;
}

const MatchForm: React.FC<MatchFormProps> = ({ players, matches, onSave, onCancel }) => {
  const [type, setType] = useState<MatchType>('Doubles');
  const [teamA, setTeamA] = useState<string[]>(['', '']);
  const [teamB, setTeamB] = useState<string[]>(['', '']);
  const [scoreA, setScoreA] = useState<number>(0);
  const [scoreB, setScoreB] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [venueId, setVenueId] = useState('');
  const [courtNumber, setCourtNumber] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoadingVenues, setIsLoadingVenues] = useState(true);

  useEffect(() => {
    const loadVenues = async () => {
      try {
        const data = await venuesApi.getAll();
        setVenues(data);
      } catch (err) {
        console.error('Failed to load venues:', err);
      } finally {
        setIsLoadingVenues(false);
      }
    };
    loadVenues();
  }, []);

  const selectedVenue = useMemo(() => {
    return venues.find(v => v.id === venueId);
  }, [venues, venueId]);

  const selectedPlayerNames = useMemo(() => {
    const list = [teamA[0], teamB[0]];
    if (type === 'Doubles') {
      list.push(teamA[1], teamB[1]);
    }
    return list.filter(p => p !== '');
  }, [teamA, teamB, type]);

  const hasDuplicates = useMemo(() => {
    return new Set(selectedPlayerNames).size !== selectedPlayerNames.length;
  }, [selectedPlayerNames]);

  const handlePlayerChange = (team: 'A' | 'B', index: number, value: string) => {
    if (team === 'A') {
      const newTeam = [...teamA];
      newTeam[index] = value;
      setTeamA(newTeam);
    } else {
      const newTeam = [...teamB];
      newTeam[index] = value;
      setTeamB(newTeam);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasDuplicates) return;

    onSave({
      date: new Date(date).toISOString(),
      type,
      teamA: type === 'Singles' ? [teamA[0]] : teamA,
      teamB: type === 'Singles' ? [teamB[0]] : teamB,
      scoreA,
      scoreB,
      venueId: venueId || undefined,
      courtNumber: venueId ? courtNumber : undefined,
      notes
    });
  };

  const inputClasses = "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-lime-500 transition-all";
  const selectClasses = "w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none appearance-none transition-all";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-6 md:p-8 animate-in fade-in zoom-in duration-300 transition-colors">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Record Match</h2>
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => setType('Singles')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${type === 'Singles' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
          >
            Singles
          </button>
          <button
            type="button"
            onClick={() => setType('Doubles')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${type === 'Doubles' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
          >
            Doubles
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {hasDuplicates && (
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 px-4 py-2 rounded-xl text-sm font-medium animate-bounce flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Each player must be unique in a match.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Venue (Optional)</label>
            <select
              value={venueId}
              onChange={(e) => {
                setVenueId(e.target.value);
                setCourtNumber(1);
              }}
              className={selectClasses}
              disabled={isLoadingVenues}
            >
              <option value="">Select Venue</option>
              {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>

          {venueId && selectedVenue && (
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Court Number</label>
              <select
                value={courtNumber}
                onChange={(e) => setCourtNumber(Number(e.target.value))}
                className={selectClasses}
              >
                {Array.from({ length: selectedVenue.courtCount }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>Court {num}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Match Date</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClasses}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Team A */}
          <div className={`p-4 rounded-2xl border transition-all ${scoreA > scoreB ? 'bg-lime-50 dark:bg-lime-900/20 border-lime-200 dark:border-lime-900/50' : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-700 dark:text-slate-300">Team A</h3>
              {scoreA > scoreB && <span className="text-xl">🏆</span>}
            </div>
            <div className="space-y-3">
              {[0, 1].map(i => (
                (i === 0 || type === 'Doubles') && (
                  <select
                    key={`A-${i}`}
                    required
                    value={teamA[i]}
                    onChange={(e) => handlePlayerChange('A', i, e.target.value)}
                    className={`${selectClasses} ${teamA[i] && selectedPlayerNames.filter(name => name === teamA[i]).length > 1 ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 dark:border-slate-700 focus:border-lime-500'}`}
                  >
                    <option value="" className="dark:bg-slate-900">Select Player {i + 1}</option>
                    {players.map(p => <option key={p.id} value={p.name} className="text-slate-900 dark:text-white dark:bg-slate-900">{p.name}</option>)}
                  </select>
                )
              ))}
            </div>
            <div className="mt-4">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Points</label>
              <input
                type="number"
                min="0"
                value={scoreA}
                onChange={(e) => setScoreA(parseInt(e.target.value) || 0)}
                className="w-full mt-1 px-4 py-3 text-2xl font-black rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-center transition-colors"
              />
            </div>
          </div>

          {/* Team B */}
          <div className={`p-4 rounded-2xl border transition-all ${scoreB > scoreA ? 'bg-lime-50 dark:bg-lime-900/20 border-lime-200 dark:border-lime-900/50' : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-700 dark:text-slate-300">Team B</h3>
              {scoreB > scoreA && <span className="text-xl">🏆</span>}
            </div>
            <div className="space-y-3">
              {[0, 1].map(i => (
                (i === 0 || type === 'Doubles') && (
                  <select
                    key={`B-${i}`}
                    required
                    value={teamB[i]}
                    onChange={(e) => handlePlayerChange('B', i, e.target.value)}
                    className={`${selectClasses} ${teamB[i] && selectedPlayerNames.filter(name => name === teamB[i]).length > 1 ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 dark:border-slate-700 focus:border-lime-500'}`}
                  >
                    <option value="" className="dark:bg-slate-900">Select Player {i + 1}</option>
                    {players.map(p => <option key={p.id} value={p.name} className="text-slate-900 dark:text-white dark:bg-slate-900">{p.name}</option>)}
                  </select>
                )
              ))}
            </div>
            <div className="mt-4">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Points</label>
              <input
                type="number"
                min="0"
                value={scoreB}
                onChange={(e) => setScoreB(parseInt(e.target.value) || 0)}
                className="w-full mt-1 px-4 py-3 text-2xl font-black rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-center transition-colors"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none resize-none h-20 focus:ring-2 focus:ring-lime-500 transition-colors"
            placeholder="Match context (weather, difficulty, notable plays)..."
          ></textarea>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={hasDuplicates}
            className={`flex-1 font-bold py-4 rounded-xl transition-all shadow-lg active:scale-[0.98] ${hasDuplicates ? 'bg-slate-200 dark:bg-slate-800 cursor-not-allowed text-slate-400 dark:text-slate-600' : 'bg-lime-500 hover:bg-lime-600 text-white'}`}
          >
            Save Match Results
          </button>
          <button type="button" onClick={onCancel} className="px-8 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-bold rounded-xl active:scale-[0.98] transition-colors">Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default MatchForm;

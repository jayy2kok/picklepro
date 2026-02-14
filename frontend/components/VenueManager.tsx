import React, { useState, useEffect } from 'react';
import { Venue, User } from '../types';
import { venuesApi } from '../api';

interface VenueManagerProps {
    user: User;
    activeGroupId: string | null;
    isGroupAdmin: boolean;
}

const VenueManager: React.FC<VenueManagerProps> = ({ user, activeGroupId, isGroupAdmin }) => {
    const [venues, setVenues] = useState<Venue[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [courtCount, setCourtCount] = useState(1);

    const isSystemAdmin = user.systemRole === 'ADMIN';
    const canManageVenues = isSystemAdmin || isGroupAdmin;

    useEffect(() => {
        loadVenues();
    }, [activeGroupId]);

    const loadVenues = async () => {
        try {
            setIsLoading(true);
            const data = await venuesApi.getAll();
            setVenues(data);
        } catch (err) {
            setError('Failed to load venues');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setName('');
        setLocation('');
        setCourtCount(1);
        setEditingId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canManageVenues) return;

        try {
            if (editingId) {
                const updated = await venuesApi.update(editingId, { name, location, courtCount });
                setVenues(prev => prev.map(v => v.id === editingId ? updated : v));
            } else {
                const created = await venuesApi.create({ name, location, courtCount }, activeGroupId || undefined);
                setVenues(prev => [...prev, created]);
            }
            resetForm();
        } catch (err) {
            setError('Failed to save venue');
        }
    };

    const handleEdit = (venue: Venue) => {
        setEditingId(venue.id);
        setName(venue.name);
        setLocation(venue.location);
        setCourtCount(venue.courtCount);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this venue?')) return;
        try {
            await venuesApi.delete(id);
            setVenues(prev => prev.filter(v => v.id !== id));
        } catch (err) {
            setError('Failed to delete venue');
        }
    };

    if (isLoading) return <div className="text-center py-8">Loading venues...</div>;

    return (
        <div className="space-y-8">
            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-100 text-red-700 rounded-xl flex justify-between items-center">
                    {error}
                    <button onClick={() => setError(null)}>&times;</button>
                </div>
            )}

            {/* Admin Form */}
            {canManageVenues && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                    <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">{editingId ? 'Edit Venue' : 'Add New Venue'}</h2>
                    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                                placeholder="Centre Court"
                                required
                            />
                        </div>
                        <div className="flex-1 w-full">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Location</label>
                            <input
                                type="text"
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                                placeholder="123 Pickle Ave"
                                required
                            />
                        </div>
                        <div className="w-24">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Courts</label>
                            <input
                                type="number"
                                min="1"
                                value={courtCount}
                                onChange={e => setCourtCount(Number(e.target.value))}
                                className="w-full px-4 py-2 rounded-xl border dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                                required
                            />
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" className="px-6 py-2 bg-lime-500 text-white font-bold rounded-xl hover:bg-lime-600 transition-colors">
                                {editingId ? 'Update' : 'Add'}
                            </button>
                            {editingId && (
                                <button type="button" onClick={resetForm} className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300">
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            {/* Venues List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {venues.map(venue => (
                    <div key={venue.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{venue.name}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    {venue.location}
                                </p>
                            </div>
                            <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300">
                                {venue.courtCount} Courts
                            </div>
                        </div>

                        {canManageVenues && (
                            <div className="flex justify-end gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(venue)} className="text-blue-500 hover:text-blue-600 text-sm font-bold">Edit</button>
                                <button onClick={() => handleDelete(venue.id)} className="text-rose-500 hover:text-rose-600 text-sm font-bold">Delete</button>
                            </div>
                        )}
                    </div>
                ))}

                {venues.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-400 italic">
                        No venues found. {canManageVenues ? 'Add one above!' : 'Ask an admin to add venues.'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VenueManager;


import React, { useState, useEffect } from 'react';
import { Player, User } from '../types';
import { playersApi } from '../api';
import { Icons } from '../constants';

interface ProfileEditorProps {
    player?: Player;
    user: User;
    onSave: (player: Player) => void;
    onCancel: () => void;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ player, user, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<Player>>({
        name: player?.name || user.name || '',
        email: player?.email || user.email || '',
        contactNumber: player?.contactNumber || '',
        socialMedia: {
            linkedin: player?.socialMedia?.linkedin || '',
            x: player?.socialMedia?.x || '',
            instagram: player?.socialMedia?.instagram || '',
            facebook: player?.socialMedia?.facebook || '',
            youtube: player?.socialMedia?.youtube || '',
        }
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isAdmin = user.systemRole === 'ADMIN';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name.startsWith('social_')) {
            const socialKey = name.replace('social_', '');
            setFormData(prev => ({
                ...prev,
                socialMedia: {
                    ...prev.socialMedia,
                    [socialKey]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            let savedPlayer: Player;
            if (player) {
                // Update existing
                savedPlayer = await playersApi.update(player.id, formData);
            } else {
                // Create new (only allowed if not found, but API will enforce constraints)
                // For now, let's assume we're updating mostly. 
                // If creating, we might need a different API call or rely on Admin to create first?
                // Plan says: "Allow VIEWERS to update *their own* profile". 
                // If profile doesn't exist, we should probably create one.
                // Let's use create if no ID.
                savedPlayer = await playersApi.create({ name: formData.name, email: formData.email });
                // Then update with rest of fields? Or update create API?
                // The create API only takes name currently. 
                // Let's update it immediately after creation if needed, or just support name first.
                if (formData.email || formData.contactNumber || formData.socialMedia) {
                    savedPlayer = await playersApi.update(savedPlayer.id, formData);
                }
            }
            onSave(savedPlayer);
        } catch (err: any) {
            console.error('Failed to save profile:', err);
            setError(err.message || 'Failed to save profile');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-6 md:p-8 max-w-2xl mx-auto border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {player ? 'Edit Profile' : 'Complete Your Profile'}
                </h2>
                <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    ✕
                </button>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Display Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-lime-500"
                            placeholder="Your Name"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={!isAdmin}
                            className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-lime-500 ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
                        />
                        {!isAdmin && <p className="text-xs text-slate-400">Linked to your login account</p>}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Contact Number</label>
                        <input
                            type="tel"
                            name="contactNumber"
                            value={formData.contactNumber}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-lime-500"
                            placeholder="+1-555-012-3456"
                        />
                    </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Social Media</h3>
                    <div className="grid grid-cols-1 gap-4">
                        {['linkedin', 'x', 'instagram', 'facebook', 'youtube'].map((platform) => (
                            <div key={platform} className="relative">
                                <div className="absolute left-4 top-3.5 text-slate-400">
                                    {/* Simple icon placeholder based on first letter */}
                                    <span className="font-bold uppercase text-xs">{platform.substring(0, 2)}</span>
                                </div>
                                <input
                                    type="url"
                                    name={`social_${platform}`}
                                    value={(formData.socialMedia as any)?.[platform] || ''}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-lime-500 text-sm"
                                    placeholder={`${platform.charAt(0).toUpperCase() + platform.slice(1)} Profile URL`}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-8 py-3 rounded-xl font-bold bg-lime-500 text-white hover:bg-lime-400 transition-colors shadow-lg shadow-lime-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProfileEditor;

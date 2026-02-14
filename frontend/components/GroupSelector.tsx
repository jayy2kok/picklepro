import React, { useState, useEffect, useRef } from 'react';
import { Group } from '../types';

interface GroupSelectorProps {
    groups: Group[];
    activeGroupId: string | null;
    onChange: (groupId: string) => void;
    className?: string;
}

const GroupSelector: React.FC<GroupSelectorProps> = ({ groups, activeGroupId, onChange, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    const selectedGroup = groups.find(g => g.id === activeGroupId);

    useEffect(() => {
        if (!isOpen && selectedGroup) {
            setSearchTerm(selectedGroup.name);
        } else if (!isOpen) {
            setSearchTerm('');
        }
    }, [selectedGroup, isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredGroups = groups.filter(g =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (group: Group) => {
        onChange(group.id);
        setIsOpen(false);
    };

    return (
        <div className={`relative flex items-center gap-3 ${className}`} ref={wrapperRef}>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase whitespace-nowrap">
                Group
            </label>
            <div className="relative flex-1">
                <input
                    type="text"
                    value={isOpen ? searchTerm : (selectedGroup?.name || '')}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => {
                        setIsOpen(true);
                        setSearchTerm('');
                    }}
                    onClick={() => {
                        if (!isOpen) {
                            setIsOpen(true);
                            setSearchTerm('');
                        }
                    }}
                    placeholder="Search groups..."
                    className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold py-2 px-4 rounded-xl border-none focus:ring-2 focus:ring-lime-500 outline-none pr-8 truncate"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 max-h-64 overflow-y-auto z-50">
                    {filteredGroups.length > 0 ? (
                        filteredGroups.map(group => (
                            <button
                                key={group.id}
                                onClick={() => handleSelect(group)}
                                className={`w-full text-left px-4 py-2 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${group.id === activeGroupId
                                    ? 'text-lime-600 dark:text-lime-400 bg-lime-50 dark:bg-lime-900/10'
                                    : 'text-slate-700 dark:text-slate-300'
                                    }`}
                            >
                                {group.name}
                            </button>
                        ))
                    ) : (
                        <div className="px-4 py-3 text-sm text-slate-400 text-center">No groups found</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GroupSelector;

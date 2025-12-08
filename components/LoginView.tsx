
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { User } from '../types';
import { PlusCircleIcon } from './icons';

interface LoginViewProps {
    onLogin: (user: User) => void;
}

const AVATARS = [
    // Chefs
    '👨‍🍳', '👩‍🍳', '🧑‍🍳', 
    // Diverse Adults
    '👩', '👨', '🧑', '🧔', '🧕', '👳', '👲', '👱‍♀️', '👱', '👩‍🦰', '👨‍🦰', '👩‍🦱', '👨‍🦱', '👩‍🦳', '👨‍🦳', '👩‍🦲', '👨‍🦲',
    // Skin Tones (Yellow, Light, Medium, Dark)
    '👩🏻', '👨🏻', '🧑🏻', '👩🏽', '👨🏽', '🧑🏽', '👩🏾', '👨🏾', '🧑🏾', '👩🏿', '👨🏿', '🧑🏿',
    // Ages
    '👶', '👧', '👦', '🧒', '👵', '👴', '🧓',
    // Professions/Roles that might cook
    '👩‍🔬', '👨‍🔬', '👩‍🌾', '👨‍🌾', '👩‍🍼', '👨‍🍼',
    // Fantasy / Fun
    '🧛', '🧜', '🧝', '🧞', '🧟', '🤖', '👽',
    // Food
    '🍲', '🥗', '🥘', '🥪', '🥑', '🥦', '🥕', '🌶️', '🥩', '🧀', '🍕', '🌮'
];

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
    const users = useLiveQuery(() => db.users.toArray());
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newAvatar, setNewAvatar] = useState(AVATARS[0]);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        const newUser: User = {
            name: newName.trim(),
            avatar: newAvatar,
            preferences: {
                darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
                dietaryFilters: [],
                currency: '$' // Default to USD
            },
            createdAt: Date.now()
        };

        const id = await db.users.add(newUser);
        const userWithId = { ...newUser, id: Number(id) };
        onLogin(userWithId);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 transition-colors duration-200">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="p-8 text-center">
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">Chef 🍳</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">Your smart culinary companion.</p>

                    {!isCreating ? (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Who is cooking today?</h2>
                            
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {users?.map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => onLogin(user)}
                                        className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-all group shadow-sm"
                                    >
                                        <span className="text-4xl mb-2 transform group-hover:scale-110 transition-transform filter drop-shadow-sm">{user.avatar}</span>
                                        <span className="font-medium text-gray-900 dark:text-white truncate w-full">{user.name}</span>
                                    </button>
                                ))}
                                
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="flex flex-col items-center justify-center p-4 rounded-xl bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-500 hover:text-blue-600 dark:text-gray-400 transition-all"
                                >
                                    <PlusCircleIcon className="w-8 h-8 mb-2 opacity-50" />
                                    <span className="font-medium">New Profile</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleCreateUser} className="text-left animate-fadeIn">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 text-center">Create Profile</h2>
                            
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Choose an Avatar</label>
                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1 border border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                                    {AVATARS.map((avatar, index) => (
                                        <button
                                            key={`${avatar}-${index}`}
                                            type="button"
                                            onClick={() => setNewAvatar(avatar)}
                                            className={`text-2xl p-2 rounded-lg transition-all ${newAvatar === avatar ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500 scale-110 z-10 shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-700 opacity-80 hover:opacity-100'}`}
                                        >
                                            {avatar}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Name</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="e.g. Gordon"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="flex-1 py-3 px-4 rounded-xl text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newName.trim()}
                                    className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30"
                                >
                                    Create Profile
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginView;

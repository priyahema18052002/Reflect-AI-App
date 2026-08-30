import React from 'react';
import { Sparkles, Plus, LogOut, Cloud, CloudCheck, ShieldCheck } from 'lucide-react';
import type { UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile | null;
  onNewEntry: () => void;
  onSignOut: () => void;
  syncStatus: 'synced' | 'saving' | 'error';
  isHistoryOpen: boolean;
  onToggleHistory: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onNewEntry,
  onSignOut,
  syncStatus,
  isHistoryOpen,
  onToggleHistory,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#111112]/95 backdrop-blur-md border-b border-[#222226]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Toggle */}
        <div className="flex items-center gap-3">
          <button
            id="toggle-history-btn"
            onClick={onToggleHistory}
            className="md:hidden p-2 rounded-lg text-[#A1A1AA] hover:bg-[#1E1E22] hover:text-[#FAFAFA] transition-colors cursor-pointer"
            title="Toggle Journal History"
            aria-label="Toggle history menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1C1C20] border border-[#2E2E34] text-amber-400 flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="font-serif text-lg font-semibold tracking-tight text-[#F4F4F5] block leading-tight">
                ReflectAI
              </span>
              <span className="text-[10px] font-medium tracking-wider uppercase text-[#71717A] block leading-none mt-0.5">
                Gemini &amp; Firestore
              </span>
            </div>
          </div>
        </div>

        {/* Sync Status Badge & Action Controls */}
        <div className="flex items-center gap-3">
          {/* Live Cloud Status */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#161619] text-[#A1A1AA] border border-[#27272A]">
            {syncStatus === 'saving' ? (
              <>
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-300">Saving to Firestore...</span>
              </>
            ) : syncStatus === 'error' ? (
              <>
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-rose-400">Sync pending</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[#A1A1AA]">Encrypted in Firestore</span>
              </>
            )}
          </div>

          {/* New Entry Button */}
          <button
            id="new-entry-nav-btn"
            onClick={onNewEntry}
            className="flex items-center gap-1.5 bg-[#FAFAFA] hover:bg-[#E4E4E7] text-[#0A0A0B] px-3.5 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#0A0A0B] stroke-[2.5]" />
            <span className="hidden sm:inline">New Reflection</span>
            <span className="sm:hidden">New</span>
          </button>

          {/* User Menu */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-[#27272A]">
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-[#38383E] object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#27272A] text-[#E4E4E7] font-semibold text-xs flex items-center justify-center border border-[#38383E]">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-semibold text-[#F4F4F5] truncate max-w-[120px]">
                    {user.displayName || 'Reflector'}
                  </div>
                  <div className="text-[10px] text-[#71717A] truncate max-w-[120px]">
                    {user.email}
                  </div>
                </div>
              </div>

              <button
                id="sign-out-btn"
                onClick={onSignOut}
                className="p-2 text-[#8E8E93] hover:text-[#FAFAFA] hover:bg-[#1C1C20] rounded-lg transition-colors cursor-pointer"
                title="Sign Out"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

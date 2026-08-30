import React, { useState, useMemo } from 'react';
import { Search, Plus, Trash2, Calendar, Tag, MessageSquare, Sparkles, Filter, ChevronRight, X } from 'lucide-react';
import type { JournalInteraction, ReflectionMode } from '../types';

interface SidebarHistoryProps {
  interactions: JournalInteraction[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const SidebarHistory: React.FC<SidebarHistoryProps> = ({
  interactions,
  activeId,
  onSelect,
  onNew,
  onDelete,
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMode, setSelectedMode] = useState<string>('all');

  const filteredInteractions = useMemo(() => {
    return interactions.filter((item) => {
      const matchesMode = selectedMode === 'all' || item.mode === selectedMode;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesMode;

      const matchesTitle = item.title?.toLowerCase().includes(q);
      const matchesSummary = item.summary?.toLowerCase().includes(q);
      const matchesContent = item.messages?.some((m) =>
        m.content.toLowerCase().includes(q)
      );
      const matchesTag = item.tags?.some((t) => t.toLowerCase().includes(q));

      return matchesMode && (matchesTitle || matchesSummary || matchesContent || matchesTag);
    });
  }, [interactions, searchQuery, selectedMode]);

  // Group by date: Today, Yesterday, Earlier
  const groupedInteractions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: {
      today: JournalInteraction[];
      yesterday: JournalInteraction[];
      earlier: JournalInteraction[];
    } = {
      today: [],
      yesterday: [],
      earlier: [],
    };

    filteredInteractions.forEach((item) => {
      const itemDate = new Date(item.updatedAt || item.createdAt);
      if (itemDate >= today) {
        groups.today.push(item);
      } else if (itemDate >= yesterday) {
        groups.yesterday.push(item);
      } else {
        groups.earlier.push(item);
      }
    });

    return groups;
  }, [filteredInteractions]);

  const modeBadge = (mode: ReflectionMode) => {
    switch (mode) {
      case 'deep_reflection':
        return { label: 'Reflection', bg: 'bg-amber-950/40 text-amber-300 border border-amber-800/40' };
      case 'brainstorm':
        return { label: 'Brainstorm', bg: 'bg-blue-950/40 text-blue-300 border border-blue-800/40' };
      case 'summarize':
        return { label: 'Summary', bg: 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40' };
      case 'open_dialogue':
        return { label: 'Dialogue', bg: 'bg-purple-950/40 text-purple-300 border border-purple-800/40' };
      default:
        return { label: 'Entry', bg: 'bg-[#1E1E22] text-[#D1D1D1] border border-[#2A2A2E]' };
    }
  };

  const renderItemCard = (item: JournalInteraction) => {
    const isSelected = item.id === activeId;
    const badge = modeBadge(item.mode);
    const dateFormatted = new Date(item.updatedAt || item.createdAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Extract first user line if no summary
    const excerpt =
      item.summary ||
      item.messages?.find((m) => m.role === 'user')?.content.slice(0, 100) ||
      'Empty reflection session...';

    return (
      <div
        key={item.id}
        id={`history-item-${item.id}`}
        onClick={() => {
          onSelect(item.id);
          onClose();
        }}
        className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
          isSelected
            ? 'bg-[#1C1C20] text-[#FAFAFA] border-amber-500/50 shadow-sm ring-1 ring-amber-500/30'
            : 'bg-[#141416] hover:bg-[#18181B] text-[#D1D1D1] border-[#222226] hover:border-[#333338]'
        }`}
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className={`font-serif text-sm font-semibold truncate flex-1 ${isSelected ? 'text-[#FAFAFA]' : 'text-[#EDEDED]'}`}>
            {item.title || 'Untitled Reflection'}
          </h3>
          <button
            id={`delete-entry-${item.id}`}
            onClick={(e) => onDelete(item.id, e)}
            className={`opacity-0 group-hover:opacity-100 p-1 rounded-md transition-opacity cursor-pointer ${
              isSelected
                ? 'text-[#A1A1AA] hover:text-rose-400 hover:bg-[#27272A]'
                : 'text-[#71717A] hover:text-rose-400 hover:bg-rose-950/40'
            }`}
            title="Delete this entry"
            aria-label="Delete entry"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className={`text-xs line-clamp-2 mb-2.5 font-normal leading-relaxed ${isSelected ? 'text-[#D4D4D8]' : 'text-[#A1A1AA]'}`}>
          {excerpt}
        </p>

        <div className="flex items-center justify-between text-[11px]">
          <span className={`px-2 py-0.5 rounded-md font-medium text-[10px] ${isSelected ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' : badge.bg}`}>
            {badge.label}
          </span>
          <span className={`flex items-center gap-1 ${isSelected ? 'text-[#A1A1AA]' : 'text-[#71717A]'}`}>
            <MessageSquare className="w-3 h-3" />
            <span>{item.messages?.length || 0}</span>
            <span className="mx-1">&bull;</span>
            <span>{dateFormatted}</span>
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-20 md:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-20 w-80 bg-[#111112] border-r border-[#222226] flex flex-col h-[calc(100vh-4rem)] transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header & New Action */}
        <div className="p-4 border-b border-[#222226] bg-[#141416]">
          <div className="flex items-center justify-between mb-3">
            <span className="font-serif font-semibold text-[#F4F4F5] text-sm flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#A1A1AA]" />
              <span>Past Reflections ({interactions.length})</span>
            </span>
            <button
              onClick={onClose}
              className="md:hidden p-1 text-[#71717A] hover:text-[#FAFAFA]"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <button
            id="sidebar-new-entry-btn"
            onClick={() => {
              onNew();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 bg-[#FAFAFA] hover:bg-[#E4E4E7] text-[#0A0A0B] py-2.5 px-4 rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4 text-[#0A0A0B] stroke-[2.5]" />
            <span>Start New Reflection</span>
          </button>

          {/* Search Box */}
          <div className="relative mt-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
            <input
              id="history-search-input"
              type="text"
              placeholder="Search entries, insights, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#18181B] border border-[#27272A] rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-400 focus:bg-[#1C1C20] transition-all text-[#F4F4F5] placeholder:text-[#71717A]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#D1D1D1]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 mt-2.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {[
              { id: 'all', label: 'All' },
              { id: 'deep_reflection', label: 'Reflections' },
              { id: 'brainstorm', label: 'Brainstorms' },
              { id: 'summarize', label: 'Summaries' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedMode(f.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer border ${
                  selectedMode === f.id
                    ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                    : 'bg-[#18181B] text-[#A1A1AA] hover:bg-[#222226] border-[#27272A]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Interaction List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filteredInteractions.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-10 h-10 rounded-full bg-[#18181B] border border-[#27272A] text-[#71717A] flex items-center justify-center mx-auto mb-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-sm font-medium text-[#D1D1D1]">No reflections found</p>
              <p className="text-xs text-[#71717A] mt-1">
                {searchQuery ? 'Try changing your search terms.' : 'Start your first journal dialogue above.'}
              </p>
            </div>
          ) : (
            <>
              {groupedInteractions.today.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold tracking-wider text-[#71717A] uppercase mb-2 px-1">
                    Today
                  </div>
                  <div className="space-y-2.5">
                    {groupedInteractions.today.map(renderItemCard)}
                  </div>
                </div>
              )}

              {groupedInteractions.yesterday.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold tracking-wider text-[#71717A] uppercase mb-2 px-1">
                    Yesterday
                  </div>
                  <div className="space-y-2.5">
                    {groupedInteractions.yesterday.map(renderItemCard)}
                  </div>
                </div>
              )}

              {groupedInteractions.earlier.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold tracking-wider text-[#71717A] uppercase mb-2 px-1">
                    Earlier
                  </div>
                  <div className="space-y-2.5">
                    {groupedInteractions.earlier.map(renderItemCard)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
};

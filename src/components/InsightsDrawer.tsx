import React from 'react';
import { Lightbulb, CheckSquare, Sparkles, BookOpen, Layers, X, Copy, Check } from 'lucide-react';
import type { JournalInteraction } from '../types';

interface InsightsDrawerProps {
  interaction: JournalInteraction;
  isOpen: boolean;
  onClose: () => void;
}

export const InsightsDrawer: React.FC<InsightsDrawerProps> = ({
  interaction,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const totalWords = interaction.messages?.reduce((acc, m) => {
    return acc + (m.content ? m.content.trim().split(/\s+/).length : 0);
  }, 0) || 0;

  const handleCopySummary = () => {
    const text = `Title: ${interaction.title}
Mode: ${interaction.mode}
Summary: ${interaction.summary || 'N/A'}

Key Insights:
${(interaction.keyInsights || []).map((i) => `- ${i}`).join('\n')}

Action Items:
${(interaction.actionItems || []).map((a) => `- ${a}`).join('\n')}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-30 w-full sm:w-96 bg-[#111112] text-[#D1D1D1] shadow-2xl border-l border-[#222226] flex flex-col h-full animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-5 border-b border-[#222226] flex items-center justify-between bg-[#141416]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h2 className="font-serif font-semibold text-[#FAFAFA] text-base">
            Session Synthesis
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySummary}
            className="p-1.5 text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1C1C20] rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1"
            title="Copy synthesized report"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#1C1C20] rounded-lg transition-colors cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 text-left">
        {/* Executive Summary */}
        <section>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#71717A] mb-2">
            <BookOpen className="w-3.5 h-3.5 text-[#A1A1AA]" />
            <span>Executive Summary</span>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-[#EDEDED] text-sm leading-relaxed font-normal">
            {interaction.summary ? (
              interaction.summary
            ) : (
              <span className="text-[#71717A] italic text-xs">
                Write a journal reflection or submit a prompt to generate an automated executive summary.
              </span>
            )}
          </div>
        </section>

        {/* Key Insights */}
        <section>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#71717A] mb-2">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>Key Insights</span>
          </div>
          {interaction.keyInsights && interaction.keyInsights.length > 0 ? (
            <ul className="space-y-2">
              {interaction.keyInsights.map((insight, idx) => (
                <li
                  key={idx}
                  className="text-xs text-[#D1D1D1] p-3 bg-[#141416] rounded-xl border border-[#222226] flex items-start gap-2.5 leading-relaxed"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-xs text-[#71717A] italic p-3 bg-[#141416] rounded-xl border border-[#222226]">
              No insights extracted yet. Converse with Gemini to distill takeaways.
            </div>
          )}
        </section>

        {/* Action Items */}
        <section>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#71717A] mb-2">
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>Recommended Actions</span>
          </div>
          {interaction.actionItems && interaction.actionItems.length > 0 ? (
            <ul className="space-y-2">
              {interaction.actionItems.map((action, idx) => (
                <li
                  key={idx}
                  className="text-xs text-[#D1D1D1] p-3 bg-[#121A16] rounded-xl border border-emerald-900/40 flex items-start gap-2.5 leading-relaxed"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-xs text-[#71717A] italic p-3 bg-[#141416] rounded-xl border border-[#222226]">
              Action items will appear here as you develop solutions with Gemini.
            </div>
          )}
        </section>

        {/* Metadata & Stats */}
        <section className="pt-4 border-t border-[#222226]">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#71717A] mb-3">
            <Layers className="w-3.5 h-3.5 text-[#A1A1AA]" />
            <span>Session Stats</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-[#141416] border border-[#222226] rounded-xl">
              <div className="text-lg font-serif font-bold text-[#FAFAFA]">
                {interaction.messages?.length || 0}
              </div>
              <div className="text-[11px] text-[#71717A] font-medium">Total Turns</div>
            </div>
            <div className="p-3 bg-[#141416] border border-[#222226] rounded-xl">
              <div className="text-lg font-serif font-bold text-[#FAFAFA]">{totalWords}</div>
              <div className="text-[11px] text-[#71717A] font-medium">Word Count</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

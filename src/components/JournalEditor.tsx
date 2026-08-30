import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { 
  Send, 
  Sparkles, 
  Lightbulb, 
  Brain, 
  BookOpen, 
  MessageSquare, 
  PanelRightOpen, 
  RotateCw, 
  Copy, 
  Check, 
  AlertCircle,
  Tag as TagIcon,
  ChevronDown,
  ChevronUp,
  Download
} from 'lucide-react';
import type { JournalInteraction, ReflectionMode, ChatMessage } from '../types';

interface JournalEditorProps {
  interaction: JournalInteraction;
  onUpdateInteraction: (updated: JournalInteraction) => void;
  onSendMessage: (content: string) => Promise<void>;
  onGenerateTitle: () => Promise<void>;
  isGenerating: boolean;
  isSaving: boolean;
  saveError: string | null;
  onRetrySave: () => void;
  onToggleInsights: () => void;
}

const MODES: { id: ReflectionMode; label: string; icon: any; desc: string }[] = [
  {
    id: 'deep_reflection',
    label: 'Deep Reflection',
    icon: Brain,
    desc: 'Unpack emotional clarity, subconscious patterns & motives',
  },
  {
    id: 'brainstorm',
    label: 'Brainstorming',
    icon: Lightbulb,
    desc: 'Generate creative solutions, strategies & lateral ideas',
  },
  {
    id: 'summarize',
    label: 'Executive Summary',
    icon: BookOpen,
    desc: 'Synthesize messy reflections into crisp takeaways',
  },
  {
    id: 'open_dialogue',
    label: 'Open Dialogue',
    icon: MessageSquare,
    desc: 'Freeform collaborative journaling and exploration',
  },
];

const STARTER_PROMPTS = [
  {
    mode: 'deep_reflection' as ReflectionMode,
    title: 'Decision Dilemma',
    prompt: 'I am wrestling with a difficult decision between two paths. Help me unpack the trade-offs and my underlying motivations.',
  },
  {
    mode: 'deep_reflection' as ReflectionMode,
    title: 'Emotional Decompression',
    prompt: 'I felt overwhelmed and reactive today. Help me reflect calmly on what triggered me and how I can respond differently next time.',
  },
  {
    mode: 'brainstorm' as ReflectionMode,
    title: 'Creative Strategy',
    prompt: 'I want to brainstorm 5 innovative angles for my new project to stand out from typical solutions.',
  },
  {
    mode: 'summarize' as ReflectionMode,
    title: 'Weekly Synthesis',
    prompt: 'Here is what happened this week: I launched a new feature, got mixed feedback from users, and had a team dispute. Synthesize this into key lessons and priorities.',
  },
];

export const JournalEditor: React.FC<JournalEditorProps> = ({
  interaction,
  onUpdateInteraction,
  onSendMessage,
  onGenerateTitle,
  isGenerating,
  isSaving,
  saveError,
  onRetrySave,
  onToggleInsights,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showInsightsInline, setShowInsightsInline] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(interaction.title);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTempTitle(interaction.title);
  }, [interaction.title]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [interaction.messages, isGenerating]);

  // Adjust textarea height dynamically
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 240)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!inputText.trim() || isGenerating) return;
    const content = inputText.trim();
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await onSendMessage(content);
  };

  const handleFollowUpClick = (promptText: string) => {
    if (isGenerating) return;
    onSendMessage(promptText);
  };

  const handleCopyMessage = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveTitle = () => {
    setIsEditingTitle(false);
    if (tempTitle.trim() && tempTitle !== interaction.title) {
      onUpdateInteraction({
        ...interaction,
        title: tempTitle.trim(),
      });
    }
  };

  const handleExportMarkdown = () => {
    const markdown = `# ${interaction.title || 'Journal Reflection'}
**Mode:** ${interaction.mode}  
**Date:** ${new Date(interaction.createdAt).toLocaleString()}  

${interaction.summary ? `## Summary\n${interaction.summary}\n\n` : ''}
${interaction.keyInsights && interaction.keyInsights.length > 0 ? `## Key Insights\n${interaction.keyInsights.map((i) => `- ${i}`).join('\n')}\n\n` : ''}
${interaction.actionItems && interaction.actionItems.length > 0 ? `## Action Items\n${interaction.actionItems.map((a) => `- ${a}`).join('\n')}\n\n` : ''}
## Conversation Transcript
${interaction.messages
  .map((m) => `### ${m.role === 'user' ? 'You' : 'Gemini'} (${new Date(m.timestamp).toLocaleTimeString()})\n\n${m.content}\n`)
  .join('\n---\n\n')}
`;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(interaction.title || 'reflection').toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const lastGeminiMessage = [...interaction.messages].reverse().find((m) => m.role === 'model');

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-[#0A0A0B] overflow-hidden relative">
      {/* Top Action Bar */}
      <div className="bg-[#111112] border-b border-[#222226] px-4 sm:px-6 py-3 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Title Editing & AI Suggestion */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isEditingTitle ? (
            <div className="flex items-center gap-2 w-full max-w-md">
              <input
                id="edit-title-input"
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                autoFocus
                className="w-full text-base font-serif font-bold text-[#FAFAFA] bg-[#18181B] border border-[#2E2E34] rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <button
                onClick={handleSaveTitle}
                className="px-2.5 py-1 text-xs bg-[#FAFAFA] text-[#0A0A0B] font-semibold rounded-lg cursor-pointer"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group min-w-0">
              <h1
                onClick={() => setIsEditingTitle(true)}
                className="font-serif text-lg sm:text-xl font-bold text-[#FAFAFA] truncate hover:text-amber-300 transition-colors cursor-pointer"
                title="Click to edit title"
              >
                {interaction.title || 'Untitled Reflection'}
              </h1>
              <button
                onClick={() => setIsEditingTitle(true)}
                className="opacity-0 group-hover:opacity-100 text-xs text-[#71717A] hover:text-[#D1D1D1] underline transition-opacity cursor-pointer"
              >
                Rename
              </button>
            </div>
          )}

          {/* AI Auto Title Suggestion */}
          <button
            id="ai-suggest-title-btn"
            onClick={onGenerateTitle}
            disabled={isGenerating || interaction.messages.length === 0}
            className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-amber-300 hover:bg-[#1C1C20] transition-colors disabled:opacity-30 cursor-pointer shrink-0"
            title="Auto-generate title with Gemini"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
          </button>
        </div>

        {/* Right Tools: Export, Insights Drawer Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="export-markdown-btn"
            onClick={handleExportMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#18181B] hover:bg-[#222226] text-[#D1D1D1] border border-[#27272A] transition-colors cursor-pointer"
            title="Download reflection as Markdown file"
          >
            <Download className="w-3.5 h-3.5 text-[#A1A1AA]" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            id="toggle-insights-drawer-btn"
            onClick={onToggleInsights}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-800/40 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Synthesis</span>
            {interaction.keyInsights && interaction.keyInsights.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-[#0A0A0B] text-[10px] flex items-center justify-center font-bold">
                {interaction.keyInsights.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mode Selector Ribbon */}
      <div className="bg-[#141416] border-b border-[#222226] px-4 sm:px-6 py-2 overflow-x-auto no-scrollbar shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#71717A] whitespace-nowrap">
            Focus Mode:
          </span>
          {MODES.map((m) => {
            const Icon = m.icon;
            const isCurrent = interaction.mode === m.id;
            return (
              <button
                key={m.id}
                id={`mode-tab-${m.id}`}
                onClick={() =>
                  onUpdateInteraction({
                    ...interaction,
                    mode: m.id,
                  })
                }
                title={m.desc}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer border ${
                  isCurrent
                    ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 shadow-xs'
                    : 'bg-[#18181B] text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#222226] border-[#27272A]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-amber-300' : 'text-[#71717A]'}`} />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Save Error Banner if any */}
      {saveError && (
        <div className="bg-[#241215] border-b border-[#4C1D24] px-4 py-2 flex items-center justify-between text-xs text-rose-200 shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{saveError}</span>
          </div>
          <button
            onClick={onRetrySave}
            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-medium cursor-pointer"
          >
            Retry Save
          </button>
        </div>
      )}

      {/* Conversation / Journal Transcript Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {interaction.messages.length === 0 ? (
          /* Empty State / Prompt Starters */
          <div className="max-w-2xl mx-auto text-center py-10">
            <div className="w-12 h-12 rounded-2xl bg-[#1C1C20] border border-[#2E2E34] text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#FAFAFA] mb-2">
              Begin Your Reflection
            </h2>
            <p className="text-sm text-[#A1A1AA] max-w-md mx-auto mb-8 font-normal leading-relaxed">
              Write freely about your day, challenges, ideas, or questions. Gemini will listen, respond thoughtfully, and extract key insights.
            </p>

            <div className="text-left space-y-3">
              <div className="text-[11px] font-semibold text-[#71717A] uppercase tracking-wider px-1">
                Prompt Starters for Inspiration
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {STARTER_PROMPTS.map((starter, i) => (
                  <button
                    key={i}
                    id={`starter-prompt-${i}`}
                    onClick={() => {
                      onUpdateInteraction({
                        ...interaction,
                        mode: starter.mode,
                      });
                      onSendMessage(starter.prompt);
                    }}
                    className="p-4 bg-[#141416] rounded-xl border border-[#222226] hover:border-amber-500/40 hover:bg-[#18181B] text-left transition-all group cursor-pointer"
                  >
                    <div className="font-serif text-sm font-semibold text-[#FAFAFA] group-hover:text-amber-300 mb-1">
                      {starter.title}
                    </div>
                    <p className="text-xs text-[#A1A1AA] line-clamp-2 leading-relaxed">
                      "{starter.prompt}"
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Rendered Transcript */
          <div className="max-w-3xl mx-auto space-y-6">
            {interaction.messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              const isCopied = copiedId === msg.id;

              return (
                <div
                  key={msg.id || index}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1.5 px-1">
                    <span className="text-[10px] font-semibold text-[#71717A] uppercase tracking-wider">
                      {isUser ? 'You' : 'Gemini 3.6 Flash'}
                    </span>
                    <span className="text-[10px] text-[#52525B]">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div
                    className={`relative max-w-full sm:max-w-2xl rounded-2xl p-5 text-sm leading-relaxed shadow-sm group text-left ${
                      isUser
                        ? 'bg-[#222226] text-[#FAFAFA] border border-[#2E2E34] rounded-tr-xs'
                        : 'bg-[#141416] text-[#D1D1D1] border border-[#222226] rounded-tl-xs'
                    }`}
                  >
                    {/* Copy Button */}
                    <button
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      className={`absolute top-3 right-3 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
                        isUser
                          ? 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#2A2A30]'
                          : 'text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#222226]'
                      }`}
                      title="Copy content"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    {isUser ? (
                      <div className="whitespace-pre-wrap font-normal text-[#FAFAFA] pr-4">
                        {msg.content}
                      </div>
                    ) : (
                      <div className="markdown-body pr-4">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* In-Flight Thinking Indicator */}
            {isGenerating && (
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2 mb-1.5 px-1">
                  <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 animate-spin text-amber-400" />
                    <span>Gemini is reflecting...</span>
                  </span>
                </div>
                <div className="bg-[#141416] border border-[#222226] rounded-2xl rounded-tl-xs p-4 shadow-sm flex items-center gap-3">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" />
                  </div>
                  <span className="text-xs text-[#A1A1AA] font-normal">
                    Processing insights and follow-up paths
                  </span>
                </div>
              </div>
            )}

            {/* Suggested Follow-up chips after Gemini response */}
            {!isGenerating &&
              interaction.messages.length > 0 &&
              interaction.keyInsights &&
              interaction.keyInsights.length > 0 && (
                <div className="pt-2">
                  <div className="text-[10px] font-semibold text-[#71717A] uppercase tracking-wider mb-2">
                    Follow-Up Reflection Threads
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'How do I turn this into an immediate action plan?',
                      'What potential blind spots am I overlooking here?',
                      'Summarize our entire reflection in 3 bullet points',
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleFollowUpClick(chip)}
                        className="px-3 py-1.5 rounded-full bg-[#141416] hover:bg-[#1C1C20] border border-[#27272A] hover:border-amber-500/40 text-xs text-[#D1D1D1] hover:text-amber-300 transition-all text-left flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>{chip}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Composer Footer */}
      <div className="bg-[#111112] border-t border-[#222226] p-4 sm:px-6 shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="relative border border-[#2A2A30] rounded-2xl bg-[#18181B] focus-within:bg-[#1C1C20] focus-within:border-amber-400/50 focus-within:ring-1 focus-within:ring-amber-400/20 transition-all p-2 shadow-sm">
            <textarea
              id="reflection-input-textarea"
              ref={textareaRef}
              rows={2}
              value={inputText}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={
                interaction.mode === 'deep_reflection'
                  ? 'What is on your mind? Describe your feelings, dilemma, or thoughts...'
                  : interaction.mode === 'brainstorm'
                  ? 'Describe the goal, challenge, or topic you want to brainstorm ideas for...'
                  : interaction.mode === 'summarize'
                  ? 'Paste your raw thoughts or journal notes to synthesize...'
                  : 'Write your reflection or message here...'
              }
              className="w-full bg-transparent px-2.5 py-1.5 text-sm text-[#FAFAFA] placeholder:text-[#71717A] focus:outline-none resize-none min-h-[52px] max-h-[220px]"
            />

            <div className="flex items-center justify-between pt-2 px-2 border-t border-[#27272A] mt-1">
              <span className="text-[11px] text-[#71717A] hidden sm:inline">
                Press <kbd className="font-mono bg-[#27272A] border border-[#38383E] px-1 py-0.5 rounded text-[10px] text-[#D1D1D1]">Cmd/Ctrl + Enter</kbd> to send
              </span>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  id="send-reflection-btn"
                  onClick={handleSubmit}
                  disabled={!inputText.trim() || isGenerating}
                  className="flex items-center gap-1.5 bg-[#FAFAFA] hover:bg-[#E4E4E7] disabled:opacity-30 text-[#0A0A0B] px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm active:scale-98 cursor-pointer"
                >
                  {isGenerating ? (
                    <span className="inline-block w-3.5 h-3.5 border-2 border-[#0A0A0B]/40 border-t-[#0A0A0B] rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Reflect</span>
                      <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Sparkles, Shield, Brain, History, ArrowRight, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => void;
  isLoading: boolean;
  errorMessage: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSignIn,
  isLoading,
  errorMessage,
}) => {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#D1D1D1] flex flex-col justify-between selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Banner */}
      <nav className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#161619] border border-[#27272A] text-amber-400 flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <span className="font-serif text-xl font-bold tracking-tight text-[#F4F4F5] block leading-tight">
              ReflectAI
            </span>
            <span className="text-xs font-medium tracking-wide uppercase text-[#71717A]">
              Journal &amp; Reflection Studio
            </span>
          </div>
        </div>

        <button
          id="landing-signin-header-btn"
          onClick={onSignIn}
          disabled={isLoading}
          className="inline-flex items-center gap-2 bg-[#FAFAFA] hover:bg-[#E4E4E7] text-[#0A0A0B] px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <span className="inline-block w-4 h-4 border-2 border-[#0A0A0B]/40 border-t-[#0A0A0B] rounded-full animate-spin" />
          ) : (
            <>
              <span>Sign In with Google</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </nav>

      {/* Main Hero Section */}
      <main className="max-w-4xl mx-auto px-6 py-12 text-center flex-1 flex flex-col justify-center">
        {/* Security / Technology Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141416] border border-[#27272A] shadow-xs mx-auto mb-6 text-xs font-medium text-[#A1A1AA]">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Strict User-Isolated Cloud Firestore Storage &bull; Gemini 3.6 Flash</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[#FAFAFA] tracking-tight leading-[1.15] mb-6">
          A private sanctuary to think, reflect, and discover clarity.
        </h1>

        <p className="text-lg sm:text-xl text-[#A1A1AA] max-w-2xl mx-auto font-normal leading-relaxed mb-10">
          Write unfiltered thoughts or multi-turn journal entries. Converse with Gemini to uncover blindspots, brainstorm creative directions, and distill actionable life insights.
        </p>

        {errorMessage && (
          <div className="mb-6 p-4 max-w-md mx-auto bg-[#241215] border border-[#4C1D24] rounded-xl text-rose-200 text-sm flex items-start gap-3 text-left">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-300">Authentication Error</p>
              <p className="text-xs text-rose-200/80 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Primary Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto w-full mb-16">
          <button
            id="google-signin-main-btn"
            onClick={onSignIn}
            disabled={isLoading}
            className="w-full sm:w-auto px-8 py-4 bg-[#FAFAFA] hover:bg-[#E4E4E7] text-[#0A0A0B] rounded-xl font-semibold text-base transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer active:scale-98"
          >
            {isLoading ? (
              <span className="inline-block w-5 h-5 border-2 border-[#0A0A0B]/40 border-t-[#0A0A0B] rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.43 7.37 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.27 2.57 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </div>

        {/* Feature Cards Bento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-[#121214] p-6 rounded-2xl border border-[#222226] shadow-sm flex flex-col justify-between hover:border-[#33333A] transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#1C1C20] border border-[#2E2E34] text-amber-400 flex items-center justify-center mb-4">
                <Brain className="w-5 h-5" />
              </div>
              <h2 className="font-serif text-lg font-semibold text-[#F4F4F5] mb-2">
                Multi-Turn Dialogue
              </h2>
              <p className="text-sm text-[#A1A1AA] leading-relaxed">
                Choose from Deep Reflection, Creative Brainstorming, or Executive Synthesis to converse in depth.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-[#222226] flex items-center gap-2 text-xs font-medium text-amber-400">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>Resilient Gemini 3.6 Flash Engine</span>
            </div>
          </div>

          <div className="bg-[#121214] p-6 rounded-2xl border border-[#222226] shadow-sm flex flex-col justify-between hover:border-[#33333A] transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#1C1C20] border border-[#2E2E34] text-emerald-400 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="font-serif text-lg font-semibold text-[#F4F4F5] mb-2">
                Isolated Cloud Firestore
              </h2>
              <p className="text-sm text-[#A1A1AA] leading-relaxed">
                Your entries and reflections are locked strictly to your account with hardened, owner-bound Firestore security rules.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-[#222226] flex items-center gap-2 text-xs font-medium text-emerald-400">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Zero cross-user visibility</span>
            </div>
          </div>

          <div className="bg-[#121214] p-6 rounded-2xl border border-[#222226] shadow-sm flex flex-col justify-between hover:border-[#33333A] transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#1C1C20] border border-[#2E2E34] text-amber-400 flex items-center justify-center mb-4">
                <History className="w-5 h-5" />
              </div>
              <h2 className="font-serif text-lg font-semibold text-[#F4F4F5] mb-2">
                Persistent History &amp; Insights
              </h2>
              <p className="text-sm text-[#A1A1AA] leading-relaxed">
                Review past journaling sessions, search through key themes, and track your ongoing personal insights over time.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-[#222226] flex items-center gap-2 text-xs font-medium text-[#A1A1AA]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Real-time instant synchronization</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-[#1E1E22] text-center text-xs text-[#71717A]">
        <p>Built with Google Cloud Run, Cloud Firestore, Firebase Authentication, and Gemini 3.6 Flash API.</p>
      </footer>
    </div>
  );
};

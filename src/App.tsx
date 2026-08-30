import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { 
  auth, 
  signInWithGoogle, 
  checkRedirectAuth, 
  signOutUser, 
  saveInteraction, 
  deleteInteraction, 
  subscribeUserInteractions 
} from './firebase';
import type { JournalInteraction, UserProfile, ReflectionMode, ChatMessage, ReflectionResponsePayload } from './types';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { SidebarHistory } from './components/SidebarHistory';
import { JournalEditor } from './components/JournalEditor';
import { InsightsDrawer } from './components/InsightsDrawer';
import { DeleteModal } from './components/DeleteModal';

function createNewInteraction(userId: string, mode: ReflectionMode = 'deep_reflection'): JournalInteraction {
  const now = Date.now();
  return {
    id: `entry_${now}_${Math.random().toString(36).substring(2, 9)}`,
    userId,
    title: 'New Reflection',
    mode,
    messages: [],
    tags: ['reflection'],
    createdAt: now,
    updatedAt: now,
  };
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [interactions, setInteractions] = useState<JournalInteraction[]>([]);
  const [activeInteraction, setActiveInteraction] = useState<JournalInteraction | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'error'>('synced');
  const [saveError, setSaveError] = useState<string | null>(null);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);

  // Deletion modal state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Initialize Auth Listener
  useEffect(() => {
    checkRedirectAuth().catch((e) => console.warn('Redirect check failed:', e));

    const unsubscribe = onAuthStateChanged(
      auth,
      (user: User | null) => {
        if (user) {
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          });
        } else {
          setCurrentUser(null);
          setInteractions([]);
          setActiveInteraction(null);
        }
        setIsAuthLoading(false);
      },
      (error) => {
        console.error('Auth state change error:', error);
        setAuthError(error.message);
        setIsAuthLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 2. Subscribe to Firestore User Interactions
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = subscribeUserInteractions(
      currentUser.uid,
      (items) => {
        setInteractions(items);
        // If no active interaction yet, or if current active is deleted, set to latest or create one
        setActiveInteraction((prev) => {
          if (!prev) {
            return items.length > 0 ? items[0] : createNewInteraction(currentUser.uid);
          }
          const updated = items.find((i) => i.id === prev.id);
          return updated || prev;
        });
      },
      (err) => {
        console.error('Subscription error:', err);
        setSyncStatus('error');
        setSaveError('Failed to synchronize with Cloud Firestore.');
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Handle Google Sign In
  const handleSignIn = async () => {
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Sign-in failure:', err);
      setAuthError(err?.message || 'Could not sign in with Google.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  // Create a brand new reflection
  const handleNewEntry = useCallback(() => {
    if (!currentUser?.uid) return;
    const newEntry = createNewInteraction(currentUser.uid);
    setActiveInteraction(newEntry);
  }, [currentUser?.uid]);

  // Select an existing reflection
  const handleSelectEntry = (id: string) => {
    const selected = interactions.find((i) => i.id === id);
    if (selected) {
      setActiveInteraction(selected);
    }
  };

  // Prompt delete modal
  const handleDeleteRequest = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTargetId(id);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!currentUser?.uid || !deleteTargetId) return;
    setIsDeleting(true);
    try {
      await deleteInteraction(currentUser.uid, deleteTargetId);
      if (activeInteraction?.id === deleteTargetId) {
        const remaining = interactions.filter((i) => i.id !== deleteTargetId);
        setActiveInteraction(
          remaining.length > 0 ? remaining[0] : createNewInteraction(currentUser.uid)
        );
      }
      setDeleteTargetId(null);
    } catch (err: any) {
      console.error('Delete error:', err);
      alert('Failed to delete reflection from Firestore.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Save interaction directly to Firestore
  const persistInteraction = async (interactionToSave: JournalInteraction) => {
    if (!currentUser?.uid) return;
    setSyncStatus('saving');
    setSaveError(null);
    try {
      await saveInteraction(currentUser.uid, interactionToSave);
      setSyncStatus('synced');
    } catch (err: any) {
      console.error('Firestore save failed:', err);
      setSyncStatus('error');
      setSaveError('Failed to save to Firestore. Please retry.');
    }
  };

  // Update interaction in state and persist
  const handleUpdateInteraction = (updated: JournalInteraction) => {
    setActiveInteraction(updated);
    persistInteraction(updated);
  };

  // Auto Generate Title using Gemini backend
  const handleGenerateTitle = async () => {
    if (!activeInteraction || activeInteraction.messages.length === 0) return;
    const allText = activeInteraction.messages.map((m) => `${m.role}: ${m.content}`).join('\n');
    try {
      const res = await fetch('/api/gemini/quick-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: allText }),
      });
      if (!res.ok) throw new Error('Failed to generate summary');
      const data = await res.json();
      if (data.title) {
        const updated = {
          ...activeInteraction,
          title: data.title,
          tags: data.tags || activeInteraction.tags,
        };
        setActiveInteraction(updated);
        persistInteraction(updated);
      }
    } catch (err) {
      console.error('Title generation error:', err);
    }
  };

  // Send message and converse with Gemini
  const handleSendMessage = async (userContent: string) => {
    if (!currentUser?.uid || !activeInteraction) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: userContent,
      timestamp: Date.now(),
    };

    const newMessages = [...activeInteraction.messages, userMessage];

    // Optimistically update local interaction
    let workingInteraction: JournalInteraction = {
      ...activeInteraction,
      messages: newMessages,
      updatedAt: Date.now(),
      // Auto-set title if it's currently default and this is first message
      title:
        activeInteraction.title === 'New Reflection'
          ? userContent.slice(0, 36) + (userContent.length > 36 ? '...' : '')
          : activeInteraction.title,
    };

    setActiveInteraction(workingInteraction);
    // Persist user prompt first
    await persistInteraction(workingInteraction);

    // Call Gemini Reflection API
    setIsGenerating(true);
    try {
      const response = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          mode: workingInteraction.mode,
          title: workingInteraction.title,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const data: ReflectionResponsePayload = await response.json();

      const modelMessage: ChatMessage = {
        id: `msg_${Date.now()}_m`,
        role: 'model',
        content: data.reply || 'No response generated.',
        timestamp: Date.now(),
      };

      const finalMessages = [...newMessages, modelMessage];
      const finalInteraction: JournalInteraction = {
        ...workingInteraction,
        messages: finalMessages,
        summary: data.summary || workingInteraction.summary,
        keyInsights: data.keyInsights || workingInteraction.keyInsights,
        actionItems: data.actionItems || workingInteraction.actionItems,
        title:
          workingInteraction.title === 'New Reflection' && data.suggestedTitle
            ? data.suggestedTitle
            : workingInteraction.title,
        updatedAt: Date.now(),
      };

      setActiveInteraction(finalInteraction);
      await persistInteraction(finalInteraction);
    } catch (err: any) {
      console.error('Error conversing with Gemini:', err);
      setSaveError(err.message || 'Gemini processing encountered an error.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Loading Screen while authenticating
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center text-[#D1D1D1]">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-[#27272A] border-t-amber-400 rounded-full animate-spin mx-auto mb-4" />
          <h2 className="font-serif font-semibold text-lg text-[#FAFAFA]">Initializing ReflectAI...</h2>
          <p className="text-xs text-[#71717A] mt-1">Connecting to Firebase &amp; Cloud Firestore</p>
        </div>
      </div>
    );
  }

  // Unauthenticated Landing Screen
  if (!currentUser) {
    return (
      <LandingPage
        onSignIn={handleSignIn}
        isLoading={isAuthLoading}
        errorMessage={authError}
      />
    );
  }

  const targetInteractionForDelete = interactions.find((i) => i.id === deleteTargetId);

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex flex-col font-sans text-[#D1D1D1] selection:bg-amber-400/30 selection:text-[#FAFAFA]">
      {/* Navigation Bar */}
      <Navbar
        user={currentUser}
        onNewEntry={handleNewEntry}
        onSignOut={handleSignOut}
        syncStatus={syncStatus}
        isHistoryOpen={isHistoryOpen}
        onToggleHistory={() => setIsHistoryOpen((prev) => !prev)}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-hidden">
        {/* Left Sidebar: Journal History */}
        <SidebarHistory
          interactions={interactions}
          activeId={activeInteraction?.id || null}
          onSelect={handleSelectEntry}
          onNew={handleNewEntry}
          onDelete={handleDeleteRequest}
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
        />

        {/* Center / Primary: Active Journal Editor */}
        {activeInteraction ? (
          <JournalEditor
            interaction={activeInteraction}
            onUpdateInteraction={handleUpdateInteraction}
            onSendMessage={handleSendMessage}
            onGenerateTitle={handleGenerateTitle}
            isGenerating={isGenerating}
            isSaving={syncStatus === 'saving'}
            saveError={saveError}
            onRetrySave={() => activeInteraction && persistInteraction(activeInteraction)}
            onToggleInsights={() => setIsInsightsOpen((prev) => !prev)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center text-[#71717A]">
            <p className="text-sm">Select or create a reflection to begin.</p>
          </div>
        )}

        {/* Right Drawer: AI Insights & Synthesis */}
        {activeInteraction && (
          <InsightsDrawer
            interaction={activeInteraction}
            isOpen={isInsightsOpen}
            onClose={() => setIsInsightsOpen(false)}
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={!!deleteTargetId}
        title={targetInteractionForDelete?.title || ''}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
        isDeleting={isDeleting}
      />
    </div>
  );
}

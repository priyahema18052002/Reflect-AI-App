export type ReflectionMode = 'deep_reflection' | 'brainstorm' | 'summarize' | 'open_dialogue';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface JournalInteraction {
  id: string;
  userId: string;
  title: string;
  mode: ReflectionMode;
  messages: ChatMessage[];
  summary?: string;
  keyInsights?: string[];
  actionItems?: string[];
  tags: string[];
  createdAt: number;
  updatedAt: number;
  wordCount?: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface ReflectionResponsePayload {
  reply: string;
  summary?: string;
  keyInsights?: string[];
  actionItems?: string[];
  suggestedTitle?: string;
  suggestedFollowUps?: string[];
  modelUsed?: string;
}

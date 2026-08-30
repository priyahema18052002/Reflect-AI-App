import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged,
  type User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  getDoc
} from 'firebase/firestore';
import type { JournalInteraction } from './types';
import firebaseConfigData from '../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
const databaseId = firebaseConfigData.firestoreDatabaseId || '(default)';
export const db = getFirestore(app, databaseId);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Strict undefined-stripping utility for zero-crash Firestore writes
 */
export function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (key, value) => (value === undefined ? null : value))
  );
}

export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (popupError: unknown) {
    const error = popupError as { code?: string; message?: string };
    console.warn('Popup login failed or blocked, attempting redirect:', error?.message);
    if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (redirectErr) {
        console.error('Redirect sign-in error:', redirectErr);
      }
    }
    throw popupError;
  }
}

export async function checkRedirectAuth(): Promise<User | null> {
  try {
    const result = await getRedirectResult(auth);
    return result ? result.user : null;
  } catch (err) {
    console.error('Error resolving redirect auth:', err);
    return null;
  }
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Save or update a journal interaction strictly under /users/{userId}/interactions/{interactionId}
 */
export async function saveInteraction(userId: string, interaction: JournalInteraction): Promise<void> {
  if (!userId || !interaction.id) {
    throw new Error('Missing userId or interactionId for persistence');
  }
  const cleanData = sanitizeForFirestore({
    ...interaction,
    userId,
    updatedAt: Date.now()
  });

  const interactionRef = doc(db, 'users', userId, 'interactions', interaction.id);
  await setDoc(interactionRef, cleanData, { merge: true });
}

/**
 * Delete an interaction
 */
export async function deleteInteraction(userId: string, interactionId: string): Promise<void> {
  if (!userId || !interactionId) return;
  const interactionRef = doc(db, 'users', userId, 'interactions', interactionId);
  await deleteDoc(interactionRef);
}

/**
 * Subscribe to real-time updates of user interactions
 */
export function subscribeUserInteractions(
  userId: string, 
  onUpdate: (interactions: JournalInteraction[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const interactionsRef = collection(db, 'users', userId, 'interactions');
  const q = query(interactionsRef, orderBy('updatedAt', 'desc'));

  const unsubscribe = onSnapshot(
    q, 
    (snapshot) => {
      const items: JournalInteraction[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as JournalInteraction);
      });
      onUpdate(items);
    },
    (error) => {
      console.error('Firestore subscription error:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
}

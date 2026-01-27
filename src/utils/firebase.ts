import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, off } from 'firebase/database';
import { GameState } from '../types';

// Firebase config
// You'll need to create a Firebase project and replace these values
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project (or use existing)
// 3. Go to Project Settings > General > Your apps > Add web app
// 4. Copy the config values here
// 5. Go to Realtime Database > Create Database > Start in test mode
// 6. Copy the database URL to databaseURL below

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

// Initialize Firebase
let app: ReturnType<typeof initializeApp> | null = null;
let database: ReturnType<typeof getDatabase> | null = null;

const getDb = () => {
  if (!database) {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
  }
  return database;
};

const GAMES_PATH = 'games';

// Normalize game state from Firebase (Firebase removes empty arrays)
const normalizeGameState = (state: GameState): GameState => {
  return {
    ...state,
    players: state.players || [],
    speakerOrder: state.speakerOrder || [],
    rounds: (state.rounds || []).map(round => ({
      ...round,
      submissions: round.submissions || [],
      votes: round.votes || {},
    })),
  };
};

// Save game state to Firebase
export const saveGameStateFirebase = async (state: GameState): Promise<void> => {
  try {
    const db = getDb();
    const gameRef = ref(db, `${GAMES_PATH}/${state.gameCode}`);
    await set(gameRef, state);
  } catch (error) {
    console.error('Firebase save error:', error);
    throw error;
  }
};

// Get game state from Firebase
export const getGameStateFirebase = async (gameCode: string): Promise<GameState | null> => {
  try {
    const db = getDb();
    const gameRef = ref(db, `${GAMES_PATH}/${gameCode}`);
    const snapshot = await get(gameRef);
    if (snapshot.exists()) {
      return normalizeGameState(snapshot.val() as GameState);
    }
    return null;
  } catch (error) {
    console.error('Firebase get error:', error);
    return null;
  }
};

// Subscribe to game state changes
export const subscribeToGame = (
  gameCode: string,
  callback: (state: GameState | null) => void
): (() => void) => {
  const db = getDb();
  const gameRef = ref(db, `${GAMES_PATH}/${gameCode}`);

  onValue(gameRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(normalizeGameState(snapshot.val() as GameState));
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Firebase subscription error:', error);
  });

  // Return unsubscribe function
  return () => off(gameRef);
};

// Delete game from Firebase (cleanup)
export const deleteGameFirebase = async (gameCode: string): Promise<void> => {
  try {
    const db = getDb();
    const gameRef = ref(db, `${GAMES_PATH}/${gameCode}`);
    await set(gameRef, null);
  } catch (error) {
    console.error('Firebase delete error:', error);
  }
};

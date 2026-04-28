import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

const allowedGoogleEmails = ['joshi14hardik@gmail.com'];
const allowedEmailPasswordAccounts = [
  {
    email: 'sample.teacher@gridaan.school',
    password: 'Gridaan@2026!',
  },
];

export function isAllowedAuthEmail(email?: string | null) {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    return false;
  }

  return (
    allowedGoogleEmails.includes(normalizedEmail) ||
    allowedEmailPasswordAccounts.some((account) => account.email === normalizedEmail)
  );
}

export function isAllowedEmailPassword(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  return allowedEmailPasswordAccounts.some(
    (account) => account.email === normalizedEmail && account.password === password,
  );
}

googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Connection test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or internet connection.");
    }
  }
}

testConnection();

export async function loginWithEmailPassword(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!isAllowedEmailPassword(normalizedEmail, password)) {
    throw new Error('This email and password are not on the approved whitelist.');
  }

  try {
    return await createUserWithEmailAndPassword(auth, normalizedEmail, password);
  } catch (error) {
    const errorCode = error instanceof Error && 'code' in error ? (error as { code?: string }).code : undefined;

    if (errorCode === 'auth/email-already-in-use' || errorCode === 'auth/credential-already-in-use') {
      return signInWithEmailAndPassword(auth, normalizedEmail, password);
    }

    if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/user-not-found') {
      try {
        return await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      } catch (createError) {
        const createErrorCode = createError instanceof Error && 'code' in createError
          ? (createError as { code?: string }).code
          : undefined;

        if (createErrorCode === 'auth/email-already-in-use' || createErrorCode === 'auth/credential-already-in-use') {
          return signInWithEmailAndPassword(auth, normalizedEmail, password);
        }

        throw createError;
      }
    }

    throw error;
  }
}

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from './config';

export const loginWithEmail = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const logout = () => signOut(auth);

export const subscribeToAuthChanges = (callback) => {
  try {
    return onAuthStateChanged(auth, callback);
  } catch {
    callback(null);
    return () => {};
  }
};

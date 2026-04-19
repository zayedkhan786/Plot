import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
} from 'firebase/auth';
import { auth } from './config';

export const loginWithEmail = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const logout = () => signOut(auth);

async function reauthenticateWithPassword(user, password) {
  const email = user?.email;
  if (!email) throw new Error('No email on account.');
  const cred = EmailAuthProvider.credential(email, password);
  await reauthenticateWithCredential(user, cred);
}

/** Change sign-in email (Firebase may send verification to the new address). */
export async function changeAccountEmail(user, currentPassword, newEmail) {
  await reauthenticateWithPassword(user, currentPassword);
  await updateEmail(user, newEmail.trim());
}

/** Change password while signed in. */
export async function changeAccountPassword(user, currentPassword, newPassword) {
  await reauthenticateWithPassword(user, currentPassword);
  await updatePassword(user, newPassword);
}

export const subscribeToAuthChanges = (callback) => {
  try {
    return onAuthStateChanged(auth, callback);
  } catch {
    callback(null);
    return () => {};
  }
};

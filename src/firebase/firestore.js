import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';

// ─── PLOTS ───────────────────────────────────────────────────
export const subscribePlots = (callback, onError) => {
  const q = query(collection(db, 'plots'), orderBy('plotNumber'));
  return onSnapshot(
    q,
    (snap) => {
      const plots = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(plots);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
};


export const getPlot = async (id) => {
  const snap = await getDoc(doc(db, 'plots', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updatePlot = async (id, data, userEmail) => {
  await updateDoc(doc(db, 'plots', id), {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: userEmail,
  });
};

export const seedPlots = async (plotsArray) => {
  const batch = writeBatch(db);
  plotsArray.forEach((p) => {
    const ref = doc(db, 'plots', p.id);
    batch.set(ref, p, { merge: true });
  });
  await batch.commit();
};

// ─── TRANSACTIONS ─────────────────────────────────────────────
export const addTransaction = async (txData) => {
  return addDoc(collection(db, 'transactions'), {
    ...txData,
    createdAt: serverTimestamp(),
  });
};

export const subscribeTransactions = (callback) => {
  const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const txs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(txs);
  });
};

export const getPlotTransactions = async (plotId) => {
  const q = query(collection(db, 'transactions'), where('plotId', '==', plotId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// ─── ENQUIRIES ────────────────────────────────────────────────
export const subscribeEnquiries = (callback) => {
  const q = query(collection(db, 'enquiries'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const enqs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(enqs);
  });
};

export const addEnquiry = async (data) => {
  return addDoc(collection(db, 'enquiries'), {
    ...data,
    createdAt: serverTimestamp(),
  });
};

export const updateEnquiry = async (id, data) => {
  await updateDoc(doc(db, 'enquiries', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// ─── RECEIPT COUNTER ─────────────────────────────────────────
export const getNextReceiptNumber = async () => {
  const ref = doc(db, 'meta', 'receiptCounter');
  const snap = await getDoc(ref);
  const current = snap.exists() ? snap.data().count : 0;
  const next = current + 1;
  await setDoc(ref, { count: next });
  return `SDR-${String(next).padStart(4, '0')}`;
};

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  enableNetwork,
  Firestore
} from 'firebase/firestore';
import { app } from './firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Transaction,
  ExpenseRecord,
  DebtRecord,
  MasterPPOBRange,
  MasterPPOBLain,
  MasterBarang,
  MasterBBM,
  MasterPSUnit,
  PSRentalSession,
  PSSisaWaktuRecord,
  UserAccount,
  StoreSettings
} from '../types';

export const db: Firestore = (firebaseConfig as any).firestoreDatabaseId
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
  : getFirestore(app);

export const STORE_DOC_ID = 'pos_main_store_v6';
export const storeRef = doc(db, 'stores', STORE_DOC_ID);

export interface StoreCloudData {
  transactions?: Transaction[];
  expenses?: ExpenseRecord[];
  debts?: DebtRecord[];
  ppobRanges?: MasterPPOBRange[];
  ppobLains?: MasterPPOBLain[];
  barangList?: MasterBarang[];
  bbmList?: MasterBBM[];
  psUnits?: MasterPSUnit[];
  activePsSessions?: PSRentalSession[];
  psSisaWaktuList?: PSSisaWaktuRecord[];
  users?: UserAccount[];
  settings?: StoreSettings;
  updatedAt?: string;
  lastUpdatedDevice?: string;
}

/**
 * Recursively cleans objects to remove any `undefined` values so Firestore setDoc never throws.
 */
export function sanitizeForFirestore(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForFirestore(item));
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = sanitizeForFirestore(value);
    }
  }
  return result;
}

/**
 * Fetch store data from Firestore
 */
export async function fetchStoreFromFirestore(): Promise<StoreCloudData | null> {
  try {
    await enableNetwork(db).catch(() => {});
    const snap = await getDoc(storeRef);
    if (snap.exists()) {
      return snap.data() as StoreCloudData;
    }
    return null;
  } catch (err: any) {
    console.warn('Error fetching from Firestore:', err);
    return null;
  }
}

/**
 * Force fetch store data from Firestore (useful for manual refresh across mobile/desktop)
 */
export async function forceFetchStoreFromFirestore(): Promise<StoreCloudData | null> {
  try {
    await enableNetwork(db).catch(() => {});
    const snap = await getDoc(storeRef);
    if (snap.exists()) {
      return snap.data() as StoreCloudData;
    }
    return null;
  } catch (err: any) {
    console.warn('Force fetch from Firestore error:', err);
    return null;
  }
}

/**
 * Save store data to Firestore with sanitization
 */
export async function saveStoreToFirestore(data: Partial<StoreCloudData>): Promise<boolean> {
  try {
    const cleanPayload = sanitizeForFirestore({
      ...data,
      updatedAt: new Date().toISOString()
    });
    await setDoc(storeRef, cleanPayload, { merge: true });
    return true;
  } catch (err: any) {
    console.error('Error saving to Firestore:', err);
    return false;
  }
}

/**
 * Subscribe to real-time updates from Firestore (instant multi-device sync)
 */
export function subscribeStoreFirestore(
  onDataUpdated: (data: StoreCloudData, isFromCache: boolean) => void,
  onError?: (error: any) => void
) {
  return onSnapshot(
    storeRef,
    { includeMetadataChanges: true },
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as StoreCloudData;
        const isFromCache = snap.metadata.fromCache;
        onDataUpdated(data, isFromCache);
      }
    },
    (err: any) => {
      console.warn('Firestore subscription error:', err);
      if (onError) onError(err);
    }
  );
}

import { getFirestore, doc, getDoc, setDoc, onSnapshot, enableNetwork } from 'firebase/firestore';
import { app } from './firebase';
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

export const db = getFirestore(app);

const STORE_DOC_ID = 'pos_main_store_v5';
const storeRef = doc(db, 'stores', STORE_DOC_ID);

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
}

/**
 * Fetch initial store data from Firestore
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
    if (err?.code === 'unavailable' || err?.message?.includes('offline')) {
      console.info('Firestore is offline. Using local cached data.');
    } else {
      console.warn('Error fetching from Firestore:', err);
    }
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
 * Save store data to Firestore
 */
export async function saveStoreToFirestore(data: StoreCloudData): Promise<boolean> {
  try {
    const cleanData = JSON.parse(
      JSON.stringify({
        ...data,
        updatedAt: new Date().toISOString()
      })
    );
    await setDoc(storeRef, cleanData, { merge: true });
    return true;
  } catch (err: any) {
    if (err?.code === 'unavailable' || err?.message?.includes('offline')) {
      console.info('Firestore is offline. Changes stored locally.');
    } else {
      console.warn('Error saving to Firestore:', err);
    }
    return false;
  }
}

/**
 * Subscribe to real-time updates from Firestore (instant multi-device sync)
 */
export function subscribeStoreFirestore(onDataUpdated: (data: StoreCloudData) => void) {
  return onSnapshot(storeRef, (snap) => {
    if (snap.exists()) {
      onDataUpdated(snap.data() as StoreCloudData);
    }
  }, (err: any) => {
    if (err?.code === 'unavailable' || err?.message?.includes('offline')) {
      console.info('Firestore subscription offline.');
    } else {
      console.warn('Firestore subscription error:', err);
    }
  });
}


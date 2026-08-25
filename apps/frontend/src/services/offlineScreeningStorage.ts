import { offlineStorage } from './offlineStorage';

export interface OfflineScreening {
  client_record_id: string;
  citizen_user_id?: string;
  citizen_name: string;
  age: number;
  gender: string;
  village: string;
  phone?: string;
  emergency_contact?: string;
  screening_date: string;
  systolic: number | null;
  systolic_status: string;
  diastolic: number | null;
  diastolic_status: string;
  pulse: number | null;
  pulse_status: string;
  spo2: number | null;
  spo2_status: string;
  temperature: number | null;
  temperature_status: string;
  glucose: number | null;
  glucose_status: string;
  weight: number | null;
  weight_status: string;
  height: number | null;
  height_status: string;
  known_conditions: string[];
  allergies: string[];
  current_medicines: string[];
  symptoms: string[];
  notes?: string;
  risk_level?: string;
  risk_flags?: string[];
  sync_status: 'PENDING' | 'SYNCED' | 'FAILED';
  error?: string;
}

const STORE_NAME = 'screenings';

const getActiveUserId = (): string => {
  const userRaw = sessionStorage.getItem('user');
  if (userRaw) {
    try {
      return JSON.parse(userRaw).id || 'default_worker';
    } catch {
      return 'default_worker';
    }
  }
  return 'default_worker';
};

export const offlineScreeningStorage = {
  getScreenings: async (): Promise<OfflineScreening[]> => {
    const userId = getActiveUserId();
    return await offlineStorage.getAllForUser(STORE_NAME, userId);
  },

  addScreening: async (screening: Omit<OfflineScreening, 'sync_status' | 'client_record_id'>): Promise<OfflineScreening> => {
    const client_record_id = `scr-client-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    const newRecord: OfflineScreening = {
      ...screening,
      client_record_id,
      sync_status: 'PENDING'
    };
    const userId = getActiveUserId();
    await offlineStorage.set(STORE_NAME, client_record_id, userId, newRecord);
    return newRecord;
  },

  updateSyncStatus: async (clientRecordId: string, status: 'SYNCED' | 'FAILED', error?: string): Promise<void> => {
    const userId = getActiveUserId();
    const records = await offlineStorage.getAllForUser(STORE_NAME, userId);
    const match = records.find(r => r.client_record_id === clientRecordId);
    if (match) {
      match.sync_status = status;
      if (error) match.error = error;
      await offlineStorage.set(STORE_NAME, clientRecordId, userId, match);
    }
  },

  clearSynced: async (): Promise<void> => {
    const userId = getActiveUserId();
    const records = await offlineStorage.getAllForUser(STORE_NAME, userId);
    const synced = records.filter(r => r.sync_status === 'SYNCED');
    for (const r of synced) {
      await offlineStorage.delete(STORE_NAME, r.client_record_id);
    }
  },

  getStats: async () => {
    const screenings = await offlineScreeningStorage.getScreenings();
    const pending = screenings.filter(s => s.sync_status === 'PENDING').length;
    const synced = screenings.filter(s => s.sync_status === 'SYNCED').length;
    const failed = screenings.filter(s => s.sync_status === 'FAILED').length;
    return { pending, synced, failed, total: screenings.length };
  }
};

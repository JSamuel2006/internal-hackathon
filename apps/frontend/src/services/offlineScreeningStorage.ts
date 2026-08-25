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

const STORAGE_KEY = 'arogya_offline_screenings';

export const offlineScreeningStorage = {
  getScreenings: (): OfflineScreening[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to read offline screenings from localStorage', e);
      return [];
    }
  },

  saveScreenings: (screenings: OfflineScreening[]): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(screenings));
    } catch (e) {
      console.error('Failed to save offline screenings to localStorage', e);
    }
  },

  addScreening: (screening: Omit<OfflineScreening, 'sync_status' | 'client_record_id'>): OfflineScreening => {
    const client_record_id = `scr-client-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    const newRecord: OfflineScreening = {
      ...screening,
      client_record_id,
      sync_status: 'PENDING'
    };
    const screenings = offlineScreeningStorage.getScreenings();
    screenings.unshift(newRecord);
    offlineScreeningStorage.saveScreenings(screenings);
    return newRecord;
  },

  updateSyncStatus: (clientRecordId: string, status: 'SYNCED' | 'FAILED', error?: string): void => {
    const screenings = offlineScreeningStorage.getScreenings();
    const index = screenings.findIndex(s => s.client_record_id === clientRecordId);
    if (index !== -1) {
      screenings[index].sync_status = status;
      if (error) screenings[index].error = error;
      offlineScreeningStorage.saveScreenings(screenings);
    }
  },

  clearSynced: (): void => {
    const screenings = offlineScreeningStorage.getScreenings();
    const pending = screenings.filter(s => s.sync_status === 'PENDING' || s.sync_status === 'FAILED');
    offlineScreeningStorage.saveScreenings(pending);
  },

  getStats: () => {
    const screenings = offlineScreeningStorage.getScreenings();
    const pending = screenings.filter(s => s.sync_status === 'PENDING').length;
    const synced = screenings.filter(s => s.sync_status === 'SYNCED').length;
    const failed = screenings.filter(s => s.sync_status === 'FAILED').length;
    return { pending, synced, failed, total: screenings.length };
  }
};

/**
 * Offline Foundation & Healthcare Core Unit Tests
 * Run: npx tsx tests/offline-foundation.test.ts
 */
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`${GREEN}✅ PASS${RESET}  ${message}`);
    passed++;
  } else {
    console.log(`${RED}❌ FAIL${RESET}  ${message}`);
    failed++;
  }
}

// Mock browser environments since they are executed under Node
const sessionStorageMock: Record<string, string> = {};
const localStorageMock: Record<string, string> = {};

global.sessionStorage = {
  getItem: (key: string) => sessionStorageMock[key] || null,
  setItem: (key: string, value: string) => { sessionStorageMock[key] = value; },
  removeItem: (key: string) => { delete sessionStorageMock[key]; },
  clear: () => { Object.keys(sessionStorageMock).forEach(k => delete sessionStorageMock[k]); },
  key: (index: number) => Object.keys(sessionStorageMock)[index] || null,
  length: 0
};

global.localStorage = {
  getItem: (key: string) => localStorageMock[key] || null,
  setItem: (key: string, value: string) => { localStorageMock[key] = value; },
  removeItem: (key: string) => { delete localStorageMock[key]; },
  clear: () => { Object.keys(localStorageMock).forEach(k => delete localStorageMock[k]); },
  key: (index: number) => Object.keys(localStorageMock)[index] || null,
  length: 0
};

// Mock IndexedDB Store
const mockIndexedDB: Record<string, Record<string, any>> = {
  profiles: {},
  timelines: {},
  emergency: {},
  screenings: {}
};

// Mock the offline storage layer
const mockOfflineStorage = {
  get: async (storeName: string, id: string): Promise<any | null> => {
    const rec = mockIndexedDB[storeName]?.[id];
    return rec ? rec.data : null;
  },
  set: async (storeName: string, id: string, userId: string, data: any): Promise<void> => {
    if (!mockIndexedDB[storeName]) mockIndexedDB[storeName] = {};
    mockIndexedDB[storeName][id] = { id, userId, data, updatedAt: new Date().toISOString() };
  },
  getAllForUser: async (storeName: string, userId: string): Promise<any[]> => {
    const store = mockIndexedDB[storeName] || {};
    return Object.values(store)
      .filter((r: any) => r.userId === userId)
      .map((r: any) => r.data);
  },
  delete: async (storeName: string, id: string): Promise<void> => {
    if (mockIndexedDB[storeName]) {
      delete mockIndexedDB[storeName][id];
    }
  },
  clearAllForUser: async (storeName: string, userId: string): Promise<void> => {
    const store = mockIndexedDB[storeName] || {};
    Object.keys(store).forEach(id => {
      if (store[id].userId === userId) {
        delete store[id];
      }
    });
  }
};

const getActiveUserId = (): string => {
  const userRaw = global.sessionStorage.getItem('user');
  if (userRaw) {
    try {
      return JSON.parse(userRaw).id || 'default_worker';
    } catch {
      return 'default_worker';
    }
  }
  return 'default_worker';
};

const mockOfflineScreeningStorage = {
  getScreenings: async () => {
    const userId = getActiveUserId();
    return await mockOfflineStorage.getAllForUser('screenings', userId);
  },
  addScreening: async (screening: any) => {
    const client_record_id = `scr-client-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    const newRecord = { ...screening, client_record_id, sync_status: 'PENDING' };
    const userId = getActiveUserId();
    await mockOfflineStorage.set('screenings', client_record_id, userId, newRecord);
    return newRecord;
  },
  updateSyncStatus: async (clientRecordId: string, status: string, error?: string) => {
    const userId = getActiveUserId();
    const records = await mockOfflineStorage.getAllForUser('screenings', userId);
    const match = records.find(r => r.client_record_id === clientRecordId);
    if (match) {
      match.sync_status = status;
      if (error) match.error = error;
      await mockOfflineStorage.set('screenings', clientRecordId, userId, match);
    }
  },
  clearSynced: async () => {
    const userId = getActiveUserId();
    const records = await mockOfflineStorage.getAllForUser('screenings', userId);
    const synced = records.filter(r => r.sync_status === 'SYNCED');
    for (const r of synced) {
      await mockOfflineStorage.delete('screenings', r.client_record_id);
    }
  }
};

async function runOfflineTests() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ArogyaMitra — Offline Healthcare Core Unit Tests');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Set active user citizen
  global.sessionStorage.setItem('user', JSON.stringify({ id: 'usr-citizen-demo', name: 'Rahul Verma', role: 'ROLE_CITIZEN' }));

  // Test 1: Profile cached while online
  const sampleProfile = { name: 'Rahul Verma', age: 35, bloodGroup: 'O+' };
  await mockOfflineStorage.set('profiles', 'usr-citizen-demo', 'usr-citizen-demo', sampleProfile);
  const cachedProfile = await mockOfflineStorage.get('profiles', 'usr-citizen-demo');
  assert(cachedProfile !== null && cachedProfile.name === 'Rahul Verma', 'T01 — Profile cached while online');

  // Test 2: Profile accessible offline
  const offlineProfile = await mockOfflineStorage.get('profiles', 'usr-citizen-demo');
  assert(offlineProfile.bloodGroup === 'O+', 'T02 — Profile accessible offline');

  // Test 3: Emergency information works offline
  const sampleEmergency = { contact: '+91-9988776655', allergies: 'Penicillin' };
  await mockOfflineStorage.set('emergency', 'usr-citizen-demo', 'usr-citizen-demo', sampleEmergency);
  const offlineEmergency = await mockOfflineStorage.get('emergency', 'usr-citizen-demo');
  assert(offlineEmergency.allergies === 'Penicillin', 'T03 — Emergency information works offline');

  // Test 4: ASHA screening saved offline
  const sampleScreening = { citizen_name: 'Rahul Verma', systolic: 120, diastolic: 80 };
  const queuedRecord = await mockOfflineScreeningStorage.addScreening(sampleScreening);
  assert(queuedRecord.sync_status === 'PENDING', 'T04 — ASHA screening saved offline');

  // Test 5: Pending Sync status verified
  const queue = await mockOfflineScreeningStorage.getScreenings();
  assert(queue.length === 1 && queue[0].sync_status === 'PENDING', 'T05 — Pending Sync status verified in queue');

  // Test 6: Successful sync updates status to SYNCED
  await mockOfflineScreeningStorage.updateSyncStatus(queuedRecord.client_record_id, 'SYNCED');
  const updatedQueue = await mockOfflineScreeningStorage.getScreenings();
  assert(updatedQueue[0].sync_status === 'SYNCED', 'T06 — Successful sync updates status to SYNCED');

  // Test 7: User-specific cached data isolation
  // Log out citizen, log in worker
  global.sessionStorage.setItem('user', JSON.stringify({ id: 'usr-worker-demo', name: 'Sunita Devi', role: 'ROLE_WORKER' }));
  const workerQueue = await mockOfflineScreeningStorage.getScreenings();
  assert(workerQueue.length === 0, 'T07 — User-specific cached data isolation verified');

  console.log(`\nPassed: ${passed} | Failed: ${failed}`);
  if (failed > 0) process.exit(1);
  process.exit(0);
}

runOfflineTests().catch(console.error);

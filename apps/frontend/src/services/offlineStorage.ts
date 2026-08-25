const DB_NAME = 'ArogyaOfflineDB';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('profiles')) {
        db.createObjectStore('profiles', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('timelines')) {
        db.createObjectStore('timelines', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('emergency')) {
        db.createObjectStore('emergency', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('screenings')) {
        db.createObjectStore('screenings', { keyPath: 'id' });
      }
    };

    request.onsuccess = (e: any) => {
      dbInstance = e.target.result;
      resolve(dbInstance!);
    };

    request.onerror = (e: any) => {
      reject(e.target.error);
    };
  });
}

export const offlineStorage = {
  get: async (storeName: string, id: string): Promise<any | null> => {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(id);
      req.onsuccess = () => {
        resolve(req.result ? req.result.data : null);
      };
      req.onerror = () => resolve(null);
    });
  },

  set: async (storeName: string, id: string, userId: string, data: any): Promise<void> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const record = { id, userId, data, updatedAt: new Date().toISOString() };
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  getAllForUser: async (storeName: string, userId: string): Promise<any[]> => {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => {
        const records = req.result || [];
        resolve(records.filter((r: any) => r.userId === userId).map((r: any) => r.data));
      };
      req.onerror = () => resolve([]);
    });
  },

  delete: async (storeName: string, id: string): Promise<void> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  clearAllForUser: async (storeName: string, userId: string): Promise<void> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => {
        const records = req.result || [];
        const userRecords = records.filter((r: any) => r.userId === userId);
        const promises = userRecords.map((r: any) => {
          return new Promise((res) => {
            const delReq = store.delete(r.id);
            delReq.onsuccess = () => res(true);
            delReq.onerror = () => res(false);
          });
        });
        Promise.all(promises).then(() => resolve());
      };
      req.onerror = () => reject(req.error);
    });
  }
};

/**
 * ApexPLM IndexedDB Storage Utility for Heavy Binary Vault Files (CAD, PDF, STEP)
 * Circumvents localStorage 5MB limit by leveraging browser IndexedDB storage (hundreds of MBs).
 */

const DB_NAME = 'ApexPLM_Vault_DB';
const DB_VERSION = 1;
const STORE_NAME = 'vault_files';

let dbInstance: IDBDatabase | null = null;

function openVaultDatabase(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.warn('IndexedDB open error:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Save file binary / dataUrl to IndexedDB
 */
export async function saveVaultFileBinary(key: string, dataUrl: string): Promise<boolean> {
  if (!key || !dataUrl) return false;
  try {
    const db = await openVaultDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ key, dataUrl, timestamp: Date.now() });

      request.onsuccess = () => resolve(true);
      request.onerror = () => {
        console.warn('Failed saving binary to IndexedDB for key:', key);
        resolve(false);
      };
    });
  } catch (err) {
    console.warn('Error saving to IndexedDB:', err);
    return false;
  }
}

/**
 * Retrieve file binary / dataUrl from IndexedDB
 */
export async function getVaultFileBinary(key: string): Promise<string | null> {
  if (!key) return null;
  try {
    const db = await openVaultDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result?.dataUrl || null);
      };
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}

/**
 * Delete a file binary from IndexedDB
 */
export async function deleteVaultFileBinary(key: string): Promise<boolean> {
  if (!key) return false;
  try {
    const db = await openVaultDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  } catch (err) {
    return false;
  }
}

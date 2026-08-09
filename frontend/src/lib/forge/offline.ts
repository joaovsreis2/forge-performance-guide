const DATABASE_NAME = "forge-offline";
const DATABASE_VERSION = 1;
const STATE_STORE = "state";
const OPERATION_STORE = "operations";

export type OfflineOperation = {
  id: string;
  sessionId: string;
  kind: "record-set" | "skip-set" | "skip-exercise" | "pause" | "resume" | "complete" | "cancel";
  payload?: Record<string, unknown>;
  createdAt: number;
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STATE_STORE)) {
        database.createObjectStore(STATE_STORE, { keyPath: "key" });
      }
      if (!database.objectStoreNames.contains(OPERATION_STORE)) {
        database.createObjectStore(OPERATION_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, mode);
    const request = run(tx.objectStore(storeName));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => database.close();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveOfflineState(value: unknown) {
  if (typeof indexedDB === "undefined") return;
  await transaction(STATE_STORE, "readwrite", (store) => store.put({ key: "forge", value }));
}

export async function loadOfflineState<T>(): Promise<T | null> {
  if (typeof indexedDB === "undefined") return null;
  const result = await transaction<{ key: string; value: T } | undefined>(
    STATE_STORE,
    "readonly",
    (store) => store.get("forge"),
  );
  return result?.value ?? null;
}

export async function enqueueOfflineOperation(operation: OfflineOperation) {
  await transaction(OPERATION_STORE, "readwrite", (store) => store.put(operation));
}

export async function listOfflineOperations(): Promise<OfflineOperation[]> {
  if (typeof indexedDB === "undefined") return [];
  const operations = await transaction<OfflineOperation[]>(OPERATION_STORE, "readonly", (store) =>
    store.getAll(),
  );
  return operations.sort((left, right) => left.createdAt - right.createdAt);
}

export async function removeOfflineOperation(id: string) {
  await transaction(OPERATION_STORE, "readwrite", (store) => store.delete(id));
}

export async function clearOfflineData() {
  if (typeof indexedDB === "undefined") return;
  await Promise.all([
    transaction(STATE_STORE, "readwrite", (store) => store.clear()),
    transaction(OPERATION_STORE, "readwrite", (store) => store.clear()),
  ]);
}

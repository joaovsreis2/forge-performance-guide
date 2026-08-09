const DB_NAME = "forge-offline-workout";
const DB_VERSION = 1;
const STORE_NAME = "pending-operations";

function openOfflineDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "clientGeneratedId" });
      }
    };
  });
}

async function storeOperation(operation) {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(operation);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function listOperations() {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deleteOperation(clientGeneratedId) {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(clientGeneratedId);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

function formPayload(form) {
  const formData = new FormData(form);
  const payload = {};
  formData.forEach((value, key) => {
    payload[key] = value;
  });
  return payload;
}

function uuid() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (character) => {
    return (
      Number(character) ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(character) / 4)))
    ).toString(16);
  });
}

function incrementSetNumber(form) {
  const setNumberInput = form.querySelector("[data-set-number]");
  setNumberInput.value = String(Number(setNumberInput.value || 0) + 1);
}

function showPendingStatus(form) {
  const status = form.parentElement.querySelector("[data-sync-status]");
  if (!status) {
    return;
  }
  status.hidden = false;
}

async function syncPendingOperations() {
  if (!navigator.onLine) {
    return;
  }
  const operations = await listOperations();
  for (const operation of operations) {
    const formData = new FormData();
    Object.entries(operation.payload).forEach(([key, value]) => {
      formData.append(key, value);
    });
    const response = await fetch(operation.url, {
      method: "POST",
      body: formData,
      headers: {
        "X-CSRFToken": operation.payload.csrfmiddlewaretoken,
      },
      credentials: "same-origin",
    });
    if (response.redirected && response.url.includes("/accounts/")) {
      return;
    }
    if (response.ok || response.redirected) {
      await deleteOperation(operation.clientGeneratedId);
    }
  }
}

document.querySelectorAll("[data-offline-set-form]").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    const clientIdInput = form.querySelector("[data-client-generated-id]");
    clientIdInput.value = clientIdInput.value || uuid();

    if (navigator.onLine) {
      return;
    }

    event.preventDefault();
    await storeOperation({
      clientGeneratedId: clientIdInput.value,
      type: "completed_set",
      url: form.action,
      payload: formPayload(form),
      createdAt: new Date().toISOString(),
    });
    showPendingStatus(form);
    form.reset();
    incrementSetNumber(form);
  });
});

window.addEventListener("online", () => {
  syncPendingOperations().catch(() => {
    document.documentElement.dataset.syncStatus = "failed";
  });
});

syncPendingOperations().catch(() => {});

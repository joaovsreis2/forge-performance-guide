import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearOfflineData,
  enqueueOfflineOperation,
  listOfflineOperations,
  loadOfflineState,
  removeOfflineOperation,
  saveOfflineState,
} from "./offline";

describe("offline persistence", () => {
  beforeEach(async () => {
    await clearOfflineData();
  });

  it("restores the latest cached application state", async () => {
    await saveOfflineState({ phase: "app", profileName: "Pessoa Offline" });

    await expect(loadOfflineState()).resolves.toEqual({
      phase: "app",
      profileName: "Pessoa Offline",
    });
  });

  it("keeps operations ordered and removes confirmed writes", async () => {
    await enqueueOfflineOperation({
      id: "second",
      sessionId: "session",
      kind: "skip-set",
      createdAt: 20,
    });
    await enqueueOfflineOperation({
      id: "first",
      sessionId: "session",
      kind: "record-set",
      payload: { clientGeneratedId: "stable-id", repetitions: 8 },
      createdAt: 10,
    });

    const queued = await listOfflineOperations();
    expect(queued.map((operation) => operation.id)).toEqual(["first", "second"]);

    await removeOfflineOperation("first");
    await expect(listOfflineOperations()).resolves.toMatchObject([{ id: "second" }]);
  });
});

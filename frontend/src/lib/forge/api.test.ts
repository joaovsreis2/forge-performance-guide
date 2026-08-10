import { afterEach, describe, expect, it, vi } from "vitest";

describe("Forge API CSRF lifecycle", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("fetches a fresh CSRF token after registration rotates the session token", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ csrfToken: "before-login" }))
      .mockResolvedValueOnce(Response.json({ email: "smoke@example.com" }, { status: 201 }))
      .mockResolvedValueOnce(Response.json({ csrfToken: "after-login" }))
      .mockResolvedValueOnce(Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    const { forgeApi } = await import("./api");

    await forgeApi.register({
      name: "Smoke",
      email: "smoke@example.com",
      password: "Forge-Smoke-2026!7x",
      passwordConfirmation: "Forge-Smoke-2026!7x",
      acceptedTerms: true,
    });
    await forgeApi.deleteAccount("Forge-Smoke-2026!7x");

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(new Headers(fetchMock.mock.calls[1]?.[1]?.headers).get("X-CSRFToken")).toBe(
      "before-login",
    );
    expect(new Headers(fetchMock.mock.calls[3]?.[1]?.headers).get("X-CSRFToken")).toBe(
      "after-login",
    );
  });
});

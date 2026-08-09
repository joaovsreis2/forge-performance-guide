import { describe, expect, it, vi } from "vitest";

import { proxyApiRequest } from "./api-proxy";

describe("proxyApiRequest", () => {
  it("forwards API requests to the configured backend origin", async () => {
    let forwarded: Request | undefined;
    const fetcher = vi.fn(async (request: Request) => {
      forwarded = request;
      return Response.json({ ok: true });
    });
    const request = new Request("https://forge.example/api/me/?source=pwa", {
      headers: { Cookie: "sessionid=abc" },
    });

    const response = await proxyApiRequest(
      request,
      { FORGE_API_ORIGIN: "https://forge-api.example" },
      fetcher,
    );

    expect(response?.status).toBe(200);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(forwarded?.url).toBe("https://forge-api.example/api/me/?source=pwa");
    expect(forwarded?.headers.get("Cookie")).toBe("sessionid=abc");
  });

  it("returns an explicit error when the production API is not configured", async () => {
    const response = await proxyApiRequest(new Request("https://forge.example/api/me/"), {});

    expect(response?.status).toBe(503);
    expect(response?.headers.get("Cache-Control")).toBe("no-store");
  });

  it("leaves application routes to TanStack Start", async () => {
    const response = await proxyApiRequest(new Request("https://forge.example/signin"), {});

    expect(response).toBeNull();
  });
});

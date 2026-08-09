export type ForgeRuntimeEnv = {
  FORGE_API_ORIGIN?: string;
};

type Fetcher = (request: Request) => Promise<Response>;

function apiOrigin(env: ForgeRuntimeEnv): URL | null {
  const value = env.FORGE_API_ORIGIN?.trim();
  if (!value) return null;

  try {
    const origin = new URL(value);
    if (!["http:", "https:"].includes(origin.protocol)) return null;
    return origin;
  } catch {
    return null;
  }
}

export async function proxyApiRequest(
  request: Request,
  env: ForgeRuntimeEnv,
  fetcher: Fetcher = fetch,
): Promise<Response | null> {
  const incoming = new URL(request.url);
  if (incoming.pathname !== "/api" && !incoming.pathname.startsWith("/api/")) return null;

  const backend = apiOrigin(env);
  if (!backend) {
    return Response.json(
      { detail: "A API do Forge não foi configurada neste ambiente." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const target = new URL(incoming.pathname + incoming.search, backend);
  return fetcher(new Request(target, request));
}

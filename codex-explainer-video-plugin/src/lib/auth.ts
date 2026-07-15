function unauthorized(): Response {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      message: "Provide Authorization: Bearer <MCP_API_KEY>.",
    }),
    {
      status: 401,
      headers: {
        "content-type": "application/json",
        "www-authenticate": "Bearer",
      },
    },
  );
}

export function authorizeRequest(request: Request, env: Env): Response | null {
  if (!env.MCP_API_KEY) return null;

  const header = request.headers.get("authorization");
  if (header !== `Bearer ${env.MCP_API_KEY}`) {
    return unauthorized();
  }

  return null;
}

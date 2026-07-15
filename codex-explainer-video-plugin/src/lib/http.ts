export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export async function readErrorBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      return await response.json();
    }
    return await response.text();
  } catch {
    return null;
  }
}

export async function assertOk(response: Response, label: string): Promise<void> {
  if (response.ok) return;

  const details = await readErrorBody(response);
  throw new HttpError(
    `${label} failed with HTTP ${response.status}`,
    response.status,
    details,
  );
}

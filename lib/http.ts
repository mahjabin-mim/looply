/**
 * The request body as JSON, or {} when it's empty or broken (e.g. the app closed mid-request).
 * Routes then reject missing fields with a normal 400 instead of crashing with a 500.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readJson(req: Request): Promise<any> {
  try {
    const v = await req.json();
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

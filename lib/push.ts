import webpush from "web-push";

let ready = false;
export function pushConfigured() {
  return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export async function sendPush(
  sub: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: { title: string; body: string; url?: string },
): Promise<"ok" | "gone" | "error"> {
  if (!ready) {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@looply.app", process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
    ready = true;
  }
  try {
    await webpush.sendNotification(sub, JSON.stringify(payload));
    return "ok";
  } catch (e) {
    const code = (e as { statusCode?: number }).statusCode;
    return code === 404 || code === 410 ? "gone" : "error";
  }
}

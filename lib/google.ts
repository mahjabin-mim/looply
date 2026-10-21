export const googleConfigured = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const redirectUri = (req: Request) =>
  `${process.env.APP_URL || new URL(req.url).origin}/api/auth/google/callback`;

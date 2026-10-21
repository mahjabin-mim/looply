# Monthly List

Lightweight Next.js app: one checklist per month. Tick items as done (with price + date/time),
mark items "not now", edit anything, and unfinished items are automatically copied into the current month.

## Run
```bash
npm install
npm run dev   # http://localhost:3000
```
Forgot-password emails are sent via [Resend](https://resend.com) when `RESEND_API_KEY` (and optionally `MAIL_FROM`) is set; otherwise the reset link is printed in the server console.

Data is stored in `data/db.json` (git-ignored). Set `AUTH_SECRET` in production.

> The JSON file store suits local / single-server use. For serverless hosts (e.g. Vercel) swap `lib/db.ts` for a hosted DB.

## Mobile app (PWA)
The site is an installable PWA. Open the deployed (HTTPS) URL on your phone:
- **Android / Chrome:** menu → *Install app* / *Add to Home screen*
- **iPhone / Safari:** Share → *Add to Home Screen*

## Google sign-in
1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → *Create credentials* → *OAuth client ID* → type **Web application**.
2. Add authorized redirect URIs: `http://localhost:3000/api/auth/google/callback` and `https://YOUR-SITE/api/auth/google/callback`.
3. Put the client ID/secret in `.env.local` (see `.env.local.example`) and restart. The "Continue with Google" button appears automatically once configured.

Signing in with Google links to an existing account with the same email, or creates a new one.

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

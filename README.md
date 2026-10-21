# Monthly List

Lightweight Next.js app: one checklist per month. Tick items as done (with price + date/time),
mark items "not now", edit anything, and unfinished items are automatically copied into the current month.

## Run
```bash
npm install
npm run dev   # http://localhost:3000
```
Data is stored in `data/db.json` (git-ignored). Set `AUTH_SECRET` in production.

> The JSON file store suits local / single-server use. For serverless hosts (e.g. Vercel) swap `lib/db.ts` for a hosted DB.

# Sparring Partner 👽

A voice-first AI sparring partner for debate and critical thinking.
*Don't just tell me what I believe. Make me defend it.*

- **Design spec:** [docs/SPEC.md](docs/SPEC.md)
- **Roadmap:** [docs/ROADMAP.md](docs/ROADMAP.md)

## Stack
Next.js (App Router, TypeScript) on Vercel · Prisma + Postgres · Anthropic API (server-side only).

## Environment variables
| Name | Required | What it is |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string (set automatically by Vercel's Prisma Postgres integration) |
| `ANTHROPIC_API_KEY` | yes | Your Anthropic API key. Only ever read on the server. |
| `APP_ACCESS_CODE` | no | If set, each device must enter this code once before using the app. |

## Deploys
Vercel runs `npm run vercel-build`, which generates the Prisma client, **applies any new database migrations**, and builds the app. There's nothing to run by hand.

## Local development (optional, needs a computer)
```bash
cp .env.example .env   # fill in values
npm install
npx prisma migrate deploy
npm run dev
```

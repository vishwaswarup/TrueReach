# TrueReach

TrueReach is an influencer campaign intelligence app that helps teams audit creator quality, benchmark fair pricing, and execute milestone-based campaign payments.

## What It Does

- Runs creator authenticity analysis and risk detection
- Generates fair-price recommendations based on audience quality
- Simulates clean-audience uplift
- Supports campaign flow actions: start, engagement verification, payment release
- Shows AI-generated audit and pricing insights when Gemini is configured

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: Node + Express
- Tests: Vitest + Testing Library + Supertest + Playwright
- AI: Google Gemini via `@google/genai`

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment variables in `.env`:

```dotenv
GEMINI_API_KEY="your_api_key"
GEMINI_MODEL="gemini-2.0-flash"
```

3. Start dev server:

```bash
npm run dev
```

## Scripts

- `npm run dev` - run app locally
- `npm run build` - production build
- `npm run test` - unit + integration tests
- `npm run test:e2e` - Playwright tests

## API Endpoints

- `GET /api/analyze?creator=<handle>`
- `POST /api/campaign/start`
- `POST /api/campaign/engagement`
- `POST /api/campaign/release`
- `POST /api/simulate/clean-audience`

## Deploying To Vercel

1. Import this GitHub repository into Vercel.
2. Keep framework as Vite.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Add project environment variables in Vercel:
	 - `GEMINI_API_KEY`
	 - `GEMINI_MODEL` (optional, defaults to `gemini-2.0-flash`)
6. Deploy and test API directly, for example:

```text
https://<your-domain>/api/analyze?creator=modi
```

## Troubleshooting

- If UI shows "Creator not found":
	- Open browser Network tab and inspect `/api/analyze?creator=...`
	- Check status code and response body
	- Verify latest commit is deployed on Vercel

- If AI text is missing:
	- Confirm `GEMINI_API_KEY` is set in Vercel project settings
	- Redeploy after updating environment variables

## Security Note

If an API key is ever exposed, rotate it immediately and update both local `.env` and Vercel environment variables.

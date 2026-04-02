<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/de622a1e-9e57-4212-82ec-cdfdb693711c

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Testing

1. Install dependencies if you have not already:
   `npm install`
2. Run unit and integration tests:
   `npm run test`
3. Run tests in watch mode:
   `npm run test:watch`
4. Run end-to-end tests (starts the dev server automatically):
   `npm run test:e2e`

### Notes

- The test suite includes backend logic tests, API route tests (via Supertest), and UI component tests (via Testing Library).
- The end-to-end smoke test exercises the primary demo flow (search, analyze, campaign, release).
- If Playwright prompts to install browsers, run `npx playwright install`.

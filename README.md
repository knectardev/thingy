# Thingy

A minimalist personal capture tool. Type or dictate a thought, tag it with a keyword, and it routes automatically to GitHub Issues, Google Sheets, or Gmail.

Thingy is a **bring-your-own-credentials** utility for developers who want a single input box that dispatches to multiple services. It is not a SaaS product -- you deploy your own instance, supply your own API keys, and own your data.

## Architecture

Thingy follows a "Glass Box" design: every step of every capture is logged to a relational database and visible in a real-time activity feed.

```
Input → Parser → Router → Handler → External Service
                    ↓
              Execution Logs (Postgres)
```

**Key components:**

- `lib/parser.ts` -- Extracts a trailing `#token` (or compound token like `#email chris`) from the input text. Supports voice-to-text normalization (`hashtag`, `keyword` → `#`).
- `lib/router.ts` -- Maps tokens to handler functions. Unknown tokens fall through to an uncategorized handler so captures are never lost.
- `lib/handlers/` -- Modular, self-contained integrations. Each handler is an async function with the signature `(content: string, thingyId: number) => Promise<void>`.
- `lib/logger.ts` -- Writes structured log entries to `execution_logs` with a 5-second query timeout. Logging failures never crash a request.
- `app/api/ingest/route.ts` -- POST endpoint. Handles idempotency via client-generated UUIDs, atomic database writes, and routing.
- `app/api/logs/route.ts` -- GET endpoint. Returns recent activity for the frontend feed.

**Database schema** (`lib/schema.sql`):

- `thingies` -- Captures with content, token, and a unique `client_id` (UUID) for idempotency.
- `execution_logs` -- Append-only log of every handler action with status and timestamp.

## Supported Tokens

| Token | Destination | Notes |
|---|---|---|
| `#task`, `#lot`, `#feature` | GitHub Issues | Creates an issue in the configured repo |
| `#lendl task`, `#lendle task` | GitHub Issues | Compound token, typo-tolerant |
| `#idea`, `#tshirt` | Google Sheets | Appends a row to the configured spreadsheet |
| `#email chris` | Gmail | Sends to the configured "chris" address |
| `#email alana` | Gmail | Sends to the configured "alana" address |
| *(no token)* | Uncategorized | Captured and logged, not routed |

**Voice-to-text support:** The words `hashtag` and `keyword` are treated as equivalent to `#` (case-insensitive). Spaces after `#` are collapsed. So "buy milk hashtag task" and "buy milk # task" both parse correctly.

## Getting Started

### Prerequisites

- Node.js 18+
- A Vercel account with a Neon Postgres database (or any Postgres instance)

### Configuration Checklist

Create a `.env.local` file with the following variables:

```
# Database (required)
POSTGRES_URL=<your-neon-postgres-connection-string>

# GitHub Issues (required for #task, #lot, #feature, #lendl tokens)
GITHUB_TOKEN=<personal-access-token-with-issues-write>

# Google Sheets (required for #idea, #tshirt tokens)
GOOGLE_SERVICE_ACCOUNT_EMAIL=<service-account-email>
GOOGLE_PRIVATE_KEY="<service-account-private-key>"

# Gmail (required for #email tokens)
GMAIL_USER=<sending-gmail-address>
GMAIL_APP_PASSWORD=<16-char-app-password>

# Access control (required)
THINGY_SECRET=<a-random-string-only-you-know>
```

### Setup

```bash
npm install
node --env-file=.env.local scripts/run-schema.mjs   # create database tables
npm run dev                                           # start dev server on localhost:3000
```

### Running Tests

```bash
npm test
```

All external dependencies (Octokit, Google Sheets, Nodemailer) are mocked in tests. No real API calls or emails are sent.

### Deploying to Vercel

1. Push the repo to GitHub.
2. Import the project in Vercel with the **Next.js** framework preset.
3. Add all environment variables from the checklist above to the Vercel project settings.
4. Deploy.
5. Bookmark `https://<your-vercel-domain>/?key=<your-secret>` on your phone/browser for frictionless access.

## Access Control

Thingy is a personal tool, not a public service. Three layers prevent accidental discovery:

1. **`robots.txt`** -- Tells compliant crawlers (Googlebot, Bingbot) not to index any page.
2. **`X-Robots-Tag` header** -- Adds `noindex, nofollow, noarchive` to every response, catching bots that ignore `robots.txt`.
3. **Shared-secret middleware** -- A `middleware.ts` checks for a `?key=` query parameter matching `THINGY_SECRET`. Requests without the correct key receive a `403 Forbidden` response. API routes (`/api/*`) and static assets (`/_next/*`) are excluded so the ingest endpoint and page resources remain functional.

To access the app, bookmark the URL with your secret appended: `https://thingy-eta.vercel.app/?key=your-secret-code`. Anyone hitting the bare URL without the key gets a 403.

## Credits & Tooling

This project is a demonstration of high-leverage "Team of One" engineering, made possible by:

- **Product Management & Architecture:** Chris Amato @knectardev on GitHub
- **Ideation & Strategy:** Gemini (Google)
- **Agentic IDE:** Cursor
- **LLM Intelligence:** Opus 4.6 (Anthropic)

## Disclaimer

You are responsible for the costs, API rate limits, and security of the external services you connect. Thingy stores credentials only in environment variables and never commits them to the repository. Review your `.gitignore` to confirm `.env*.local` and key files are excluded.

## License

MIT

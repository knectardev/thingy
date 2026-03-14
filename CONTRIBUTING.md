# Contributing to Thingy

## Design Principles

These principles are enforced by `.cursorrules` and should guide every change.

**Modularity.** Each integration lives in its own file under `lib/handlers/`. Handlers are pure functions with no shared mutable state. Adding or removing a handler should not require changes beyond `router.ts` and the UI.

**Idempotency.** Every capture includes a client-generated UUID (`client_id`). The database enforces uniqueness, so network retries and double-taps never create duplicate entries.

**Observability.** Every handler logs its start and end (or failure) via `lib/logger.ts`. The activity feed and `execution_logs` table provide a full trace of every capture's lifecycle. Logging failures are caught silently and never crash a request.

**Reliability.** All async operations are wrapped in explicit `try/catch` blocks. Missing environment variables trigger an early return with a logged failure, not an unhandled exception.

## Adding a New Integration

### 1. Create the handler

Add a new file in `lib/handlers/`. It must export an async function matching the `Handler` type:

```typescript
type Handler = (content: string, thingyId: number) => Promise<void>;
```

Follow the existing pattern:

```typescript
import { log } from "@/lib/logger";

export async function handleMyService(
  content: string,
  thingyId: number
): Promise<void> {
  await log(thingyId, "[MyService] Starting", "started");

  const apiKey = process.env.MY_SERVICE_KEY;
  if (!apiKey) {
    await log(thingyId, "[MyService] Missing MY_SERVICE_KEY env var", "failed");
    return;
  }

  try {
    // Call external service here
    await log(thingyId, "[MyService] Done", "completed");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await log(thingyId, `[MyService] Error: ${message}`, "failed");
  }
}
```

### 2. Register the token

In `lib/router.ts`, import your handler and add it to `handlerMap`:

```typescript
import { handleMyService } from "@/lib/handlers/myservice";

const handlerMap: Record<string, Handler> = {
  // ...existing entries
  mytoken: handleMyService,
};
```

For simple tokens (`#mytoken`), no parser changes are needed. For compound tokens (`#mytoken subcommand`), add an entry to the `COMPOUND_TOKENS` array in `lib/parser.ts`.

### 3. Update the Activity Feed

In `app/components/ActivityFeed.tsx`, add your token to `DESTINATION_LINKS`:

```typescript
mytoken: { label: "My Service", url: "https://example.com" },
```

Also add it to the keyword help modal in `app/components/CaptureInput.tsx`.

### 4. Add environment variables

Add any required credentials to `.env.local` (locally) and document them in the README configuration checklist.

## Testing Policy

All new handlers must include unit tests in `tests/handlers.test.ts`.

**Mock all external dependencies.** Tests must never make real API calls, send real emails, or touch real databases. Use `vi.mock` to replace external libraries (Octokit, Nodemailer, Google Sheets, etc.) with controlled stubs.

**Test the contract, not the implementation.** Verify that:

1. The handler calls `log()` with `"started"` and `"completed"` statuses.
2. The external service mock is called with the expected arguments.
3. Missing environment variables produce a `"failed"` log, not an exception.

**Run tests before submitting:**

```bash
npm test
```

## Code Style

- TypeScript for all source files.
- Tailwind CSS utility classes for styling.
- No marketing copy in code or comments.
- Comments explain *why*, not *what*.

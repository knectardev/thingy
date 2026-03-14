# Requirements: "Thingy" Capture System (Revised)

## 1. Overview
The **Thingy Capture System** is a minimalist, personal-use PWA designed for frictionless "capture-on-the-go." It allows a single user to record text notes, optionally appended with a simple keyword token, and have them automatically routed to specific destinations (e.g., GitHub, Google Sheets) in real-time, with built-in transparency for debugging.

## 2. Functional Requirements
* **Capture Interface:** A minimalist PWA with a single large text input and a "Submit" button.
* **Intelligent Ingestion:**
    * The system shall parse the input string to identify a trailing keyword token (e.g., `Buy tshirt #task`).
    * If a token is detected, it maps to a specific handler.
    * If no token is detected, it defaults to an "Uncategorized" handler.
* **Real-time Routing:** The backend shall process the request immediately upon submission and execute the corresponding API action.
* **Audit & Debug Log:** The system shall maintain an execution log for every request. This log must be visible to the user via the PWA (or a dedicated /logs endpoint) to verify that the routing, API calls, and handlers executed as expected.
* **Environment Management:** Configuration of API tokens and keys via Vercel’s Environment Variables (Config GUI).

## 3. Modular Code Structure
The system is built as a unified Next.js application:

```text
/api
  /ingest.js        # Entry: Receives POST, runs router, logs execution steps
  /logs.js          # Endpoint: Returns the execution history for the UI
/lib
  /router.js        # Core Logic: Splits token and executes handlers
  /logger.js        # Utility: Writes execution steps to a database table
  /handlers/        # Direct Integration Modules
    /github.js      # Uses Octokit to push to GitHub
    /sheets.js      # Uses Google Sheets API to append rows
/app
  /page.js          # UI: "Big Button" + "Activity Feed" component


  
## 1. Technical Stack

* **Framework:** Next.js (App Router).
* **Hosting:** Vercel (Serverless Functions).
* **Database:** Vercel Postgres (Serverless SQL).
* `thingies` table: Stores the raw content, token, and status.
* `execution_logs` table: Stores a chronological audit trail of the routing process (e.g., `[Started]`, `[Token Parsed: #task]`, `[Calling GitHub API]`, `[Success]`).


* **Integrations:** Direct API usage (`@octokit/rest`, `google-spreadsheet`).

## 2. Non-Functional Requirements

* **Frictionless:** Zero-manual-tagging effort beyond a simple trailing token.
* **Visible Transparency:** The PWA UI shall include an "Activity Feed" that displays the most recent `execution_logs` for immediate verification.
* **Maintainability:** Adding an integration only requires adding a handler and updating the router map.

---
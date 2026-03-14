#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const REPO = "knectardev/lot";
const DELAY_MS = 1500;
const MAX_RETRIES = 3;

// ---------------------------------------------------------------------------
// Label color palette (grouped by purpose)
// ---------------------------------------------------------------------------
const LABEL_COLORS = {
  // Priority (red spectrum)
  blocker: "B60205",
  high: "D93F0B",
  medium: "E4A221",
  low: "C2B280",

  // Category (blue/teal spectrum)
  security: "1D4ED8",
  product: "0969DA",
  infrastructure: "0E7490",
  accessibility: "7C3AED",
  legal: "6B7280",
  marketing: "9333EA",

  // Phase (green spectrum)
  "pre-phase-1": "14532D",
  "phase-1": "15803D",
  "phase-1.5": "16A34A",
  "phase-2": "4ADE80",
  "phase-3": "86EFAC",
  "phase-4": "BBF7D0",

  // Security-adjacent (steel blue)
  tls: "4A6FA5",
  "rate-limiting": "4A6FA5",
  "file-upload": "4A6FA5",
  "anti-indexing": "4A6FA5",
  cookies: "4A6FA5",
  xss: "4A6FA5",
  owasp: "4A6FA5",
  auth: "4A6FA5",
  compliance: "4A6FA5",

  // Accessibility-adjacent (soft violet)
  keyboard: "A78BFA",
  "screen-reader": "A78BFA",
  forms: "A78BFA",
  images: "A78BFA",
  wcag: "A78BFA",

  // Infrastructure-adjacent (muted teal)
  hosting: "5EADB0",
  dns: "5EADB0",
  "reverse-proxy": "5EADB0",
  database: "5EADB0",
  "ci-cd": "5EADB0",
  deployment: "5EADB0",
  staging: "5EADB0",
  storage: "5EADB0",
  translation: "5EADB0",
  monitoring: "5EADB0",
  backups: "5EADB0",
  configuration: "5EADB0",

  // Product-adjacent (soft blue)
  "mobile-ux": "7CB9E8",
  mobile: "7CB9E8",
  messaging: "7CB9E8",
  gamification: "7CB9E8",
  impact: "7CB9E8",
  sustainability: "7CB9E8",

  // Process/meta (warm gray)
  testing: "FBCA04",
  documentation: "A1887F",
  research: "A1887F",
  design: "A1887F",
  privacy: "A1887F",
  analytics: "A1887F",
  "business-setup": "A1887F",
  dependencies: "A1887F",
  "external-api": "A1887F",

  // Modifier
  optional: "CFD8DC",
};

// ---------------------------------------------------------------------------
// Phase -> milestone name mapping
// ---------------------------------------------------------------------------
const PHASE_TO_MILESTONE = {
  "pre-phase-1": "Pre-Phase 1: Legal & Decisions",
  "phase-1": "Phase 1: Alpha Staging",
  "phase-1.5": "Phase 1.5: Production Infrastructure",
  "phase-2": "Phase 2: Beta Public Launch",
  "phase-3": "Phase 3: Guerrilla Marketing & Scale",
  "phase-4": "Phase 4 & Beyond",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function gh(args, { ignoreError = false, retries = MAX_RETRIES } = {}) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = execSync(`gh ${args}`, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 30000,
      });
      return result.trim();
    } catch (err) {
      const stderr = (err.stderr || "").toString();
      const isRetryable =
        stderr.includes("rate limit") ||
        stderr.includes("403") ||
        stderr.includes("429") ||
        stderr.includes("5") ||
        stderr.includes("ETIMEDOUT") ||
        stderr.includes("ECONNRESET");

      if (isRetryable && attempt < retries) {
        const backoff = Math.pow(2, attempt) * 1000;
        console.log(
          `  [retry ${attempt}/${retries}] Waiting ${backoff / 1000}s...`
        );
        execSync(`powershell -c "Start-Sleep -Milliseconds ${backoff}"`, {
          stdio: "ignore",
        });
        continue;
      }

      if (ignoreError) return "";
      throw new Error(
        `gh ${args.slice(0, 60)}... failed: ${stderr || err.message}`
      );
    }
  }
}

function escapeForShell(str) {
  return str.replace(/"/g, '\\"').replace(/`/g, "``");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  const yamlPath = path.join(__dirname, "..", "backlog.yaml");
  if (!fs.existsSync(yamlPath)) {
    console.error(`ERROR: ${yamlPath} not found`);
    process.exit(1);
  }

  const data = yaml.load(fs.readFileSync(yamlPath, "utf-8"));
  const issues = data.issues;

  console.log(`\nLoaded ${issues.length} issues from backlog.yaml\n`);

  // Collect unique labels
  const allLabels = new Set();
  for (const issue of issues) {
    for (const label of issue.labels || []) {
      allLabels.add(label);
    }
  }

  // Collect phases for milestones
  const phases = new Set();
  for (const issue of issues) {
    phases.add(issue.phase);
  }

  // --- DRY RUN ---
  if (dryRun) {
    console.log("=== DRY RUN (no changes will be made) ===\n");

    console.log(`Milestones to create (${phases.size}):`);
    for (const phase of phases) {
      console.log(`  - ${PHASE_TO_MILESTONE[phase] || phase}`);
    }

    console.log(`\nLabels to create (${allLabels.size}):`);
    for (const label of [...allLabels].sort()) {
      const color = LABEL_COLORS[label] || "EDEDED";
      console.log(`  - ${label} (#${color})`);
    }

    // Check which issues already exist
    let existingTitles = new Set();
    try {
      const existingJson = gh(
        `issue list --repo ${REPO} --state all --json title --limit 200`
      );
      const existing = JSON.parse(existingJson);
      existingTitles = new Set(existing.map((e) => e.title));
    } catch {
      console.log("\n(Could not fetch existing issues for comparison)\n");
    }

    console.log(`\nIssues (${issues.length}):`);
    for (const issue of issues) {
      const milestone = PHASE_TO_MILESTONE[issue.phase] || issue.phase;
      const labels = (issue.labels || []).join(", ");
      const exists = existingTitles.has(issue.title);
      const status = exists ? "SKIP (exists)" : "CREATE";
      console.log(`  [${status}] #${issue.id}: ${issue.title}`);
      console.log(`           Milestone: ${milestone}`);
      console.log(`           Labels: ${labels}`);
      if (issue.dependencies) {
        console.log(
          `           Dependencies: ${issue.dependencies.join(", ")}`
        );
      }
    }

    const toCreate = issues.filter((i) => !existingTitles.has(i.title));
    const toSkip = issues.filter((i) => existingTitles.has(i.title));
    console.log(`\nSummary: ${toCreate.length} to create, ${toSkip.length} to skip\n`);
    return;
  }

  // --- LIVE IMPORT ---
  const stats = {
    milestonesCreated: 0,
    milestonesExisted: 0,
    labelsCreated: 0,
    labelsExisted: 0,
    issuesCreated: 0,
    issuesSkipped: 0,
    issuesFailed: 0,
    dependenciesPatched: 0,
    failed: [],
  };

  // Step 1: Create milestones
  console.log("--- Step 1: Creating milestones ---\n");
  for (const phase of phases) {
    const name = PHASE_TO_MILESTONE[phase];
    if (!name) continue;
    const desc = data.phases?.[phase]?.description || "";

    try {
      gh(
        `api repos/${REPO}/milestones -f title="${escapeForShell(name)}" -f description="${escapeForShell(desc)}" -f state="open"`,
        { ignoreError: false }
      );
      console.log(`  + Created milestone: ${name}`);
      stats.milestonesCreated++;
    } catch (err) {
      if (
        err.message.includes("already_exists") ||
        err.message.includes("Validation Failed")
      ) {
        console.log(`  = Milestone exists: ${name}`);
        stats.milestonesExisted++;
      } else {
        console.log(`  ! Milestone error: ${name} - ${err.message}`);
      }
    }
    await sleep(500);
  }

  // Step 2: Create labels
  console.log("\n--- Step 2: Creating labels ---\n");
  for (const label of [...allLabels].sort()) {
    const color = LABEL_COLORS[label] || "EDEDED";
    try {
      gh(
        `label create "${escapeForShell(label)}" --repo ${REPO} --color "${color}" --force`,
        { ignoreError: false }
      );
      console.log(`  + Label: ${label} (#${color})`);
      stats.labelsCreated++;
    } catch {
      console.log(`  = Label exists or error: ${label}`);
      stats.labelsExisted++;
    }
    await sleep(300);
  }

  // Step 3: Create issues (pass 1 - without dependency links)
  console.log("\n--- Step 3: Creating issues ---\n");

  // Fetch existing issues to build title -> number map
  let existingIssues = [];
  try {
    const existingJson = gh(
      `issue list --repo ${REPO} --state all --json title,number --limit 200`
    );
    existingIssues = JSON.parse(existingJson);
  } catch {
    console.log("  (Could not fetch existing issues)\n");
  }
  const titleToNumber = {};
  for (const ei of existingIssues) {
    titleToNumber[ei.title] = ei.number;
  }

  const idToGhNumber = {};

  for (const issue of issues) {
    if (titleToNumber[issue.title]) {
      const num = titleToNumber[issue.title];
      console.log(`  = Skipped (exists as #${num}): ${issue.title}`);
      idToGhNumber[issue.id] = num;
      stats.issuesSkipped++;
      continue;
    }

    const milestone = PHASE_TO_MILESTONE[issue.phase] || "";
    const labels = (issue.labels || []).join(",");
    const body = (issue.description || "").trim();

    // Write body to temp file to avoid shell escaping issues
    const tmpFile = path.join(
      process.env.TEMP || "/tmp",
      `gh-issue-${issue.id}.md`
    );
    fs.writeFileSync(tmpFile, body, "utf-8");

    try {
      const result = gh(
        `issue create --repo ${REPO} --title "${escapeForShell(issue.title)}" --body-file "${tmpFile}" --label "${labels}" --milestone "${escapeForShell(milestone)}"`
      );

      // Extract issue number from URL (e.g. https://github.com/knectardev/lot/issues/5)
      const match = result.match(/\/issues\/(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        idToGhNumber[issue.id] = num;
        titleToNumber[issue.title] = num;
        console.log(`  + Created #${num}: ${issue.title}`);
      } else {
        console.log(`  + Created: ${issue.title} (could not parse number)`);
      }
      stats.issuesCreated++;
    } catch (err) {
      console.log(`  ! FAILED: ${issue.title} - ${err.message}`);
      stats.issuesFailed++;
      stats.failed.push(issue.title);
    }

    // Clean up temp file
    try {
      fs.unlinkSync(tmpFile);
    } catch {}

    await sleep(DELAY_MS);
  }

  // Step 4: Patch dependency links (pass 2)
  const issuesWithDeps = issues.filter(
    (i) => i.dependencies && i.dependencies.length > 0
  );

  if (issuesWithDeps.length > 0) {
    console.log("\n--- Step 4: Patching dependency links ---\n");

    // Rebuild map from GitHub state for resilience
    try {
      const freshJson = gh(
        `issue list --repo ${REPO} --state all --json title,number --limit 200`
      );
      const freshIssues = JSON.parse(freshJson);
      for (const fi of freshIssues) {
        const matchingYaml = issues.find((i) => i.title === fi.title);
        if (matchingYaml) {
          idToGhNumber[matchingYaml.id] = fi.number;
        }
      }
    } catch {
      console.log("  (Could not refresh issue map, using in-memory map)\n");
    }

    for (const issue of issuesWithDeps) {
      const ghNum = idToGhNumber[issue.id];
      if (!ghNum) {
        console.log(
          `  ! Cannot patch deps for YAML #${issue.id} - no GitHub issue found`
        );
        continue;
      }

      const depRefs = issue.dependencies
        .map((depId) => {
          const depNum = idToGhNumber[depId];
          return depNum ? `#${depNum}` : `(YAML #${depId} - not found)`;
        })
        .join(", ");

      // Get current body
      let currentBody = "";
      try {
        const issueJson = gh(
          `issue view ${ghNum} --repo ${REPO} --json body`
        );
        currentBody = JSON.parse(issueJson).body || "";
      } catch {
        currentBody = (issue.description || "").trim();
      }

      if (currentBody.includes("**Dependencies:**")) {
        console.log(`  = Dependencies already set for #${ghNum}`);
        continue;
      }

      const newBody = `${currentBody}\n\n---\n**Dependencies:** Depends on ${depRefs}`;
      const tmpFile = path.join(
        process.env.TEMP || "/tmp",
        `gh-dep-${issue.id}.md`
      );
      fs.writeFileSync(tmpFile, newBody, "utf-8");

      try {
        gh(`issue edit ${ghNum} --repo ${REPO} --body-file "${tmpFile}"`);
        console.log(`  + Patched #${ghNum}: depends on ${depRefs}`);
        stats.dependenciesPatched++;
      } catch (err) {
        console.log(
          `  ! Failed to patch #${ghNum}: ${err.message}`
        );
      }

      try {
        fs.unlinkSync(tmpFile);
      } catch {}

      await sleep(DELAY_MS);
    }
  }

  // Summary
  console.log("\n=== Import Complete ===");
  console.log(
    `Issues:       ${stats.issuesCreated} created, ${stats.issuesSkipped} skipped, ${stats.issuesFailed} failed`
  );
  console.log(
    `Labels:       ${stats.labelsCreated} created, ${stats.labelsExisted} already existed`
  );
  console.log(
    `Milestones:   ${stats.milestonesCreated} created, ${stats.milestonesExisted} already existed`
  );
  console.log(`Dependencies: ${stats.dependenciesPatched} patched`);

  if (stats.failed.length > 0) {
    console.log(`\nFailed issues:`);
    for (const title of stats.failed) {
      console.log(`  - ${title}`);
    }
  }

  console.log("\nNext steps:");
  console.log("  - Spot-check issues at https://github.com/knectardev/lot/issues");
  console.log("  - Filter by milestone or label to verify metadata");
  console.log("");
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});

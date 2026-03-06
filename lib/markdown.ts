import type { Mode, TestCasesResult, BugReportResult, ApiIdeasResult } from "./types";

export function resultToMarkdown(mode: Mode, result: unknown): string {
  if (mode === "testcases") {
    return testCasesToMarkdown(result as TestCasesResult);
  }
  if (mode === "bugreport") {
    return bugReportToMarkdown(result as BugReportResult);
  }
  return apiIdeasToMarkdown(result as ApiIdeasResult);
}

function testCasesToMarkdown(r: TestCasesResult): string {
  const lines: string[] = [];

  lines.push(`# ${r.feature || "Test Cases"}`);
  lines.push("");

  if (r.assumptions?.length) {
    lines.push("## Assumptions");
    r.assumptions.forEach((a) => lines.push(`- ${a}`));
    lines.push("");
  }

  lines.push("## Test Cases");
  lines.push("");

  lines.push("| ID | Priority | Type | Title |");
  lines.push("|---|---|---|---|");

  r.test_cases?.forEach((tc) => {
    lines.push(`| ${tc.id} | ${tc.priority} | ${tc.type} | ${tc.title} |`);
  });
  lines.push("");

  r.test_cases?.forEach((tc) => {
    lines.push(`### ${tc.id}: ${tc.title}`);
    lines.push("");
    lines.push(`**Priority:** ${tc.priority} | **Type:** ${tc.type}`);
    if (tc.tags?.length) {
      lines.push(`**Tags:** ${tc.tags.join(", ")}`);
    }
    lines.push("");

    if (tc.preconditions?.length) {
      lines.push("**Preconditions:**");
      tc.preconditions.forEach((p) => lines.push(`- ${p}`));
      lines.push("");
    }

    if (tc.steps?.length) {
      lines.push("**Steps:**");
      tc.steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
      lines.push("");
    }

    lines.push(`**Expected:** ${tc.expected}`);
    lines.push("");
    lines.push("---");
    lines.push("");
  });

  if (r.coverage_notes?.length) {
    lines.push("## Coverage Notes");
    r.coverage_notes.forEach((n) => lines.push(`- ${n}`));
    lines.push("");
  }

  if (r.missing_information?.length) {
    lines.push("## Missing Information");
    r.missing_information.forEach((m) => lines.push(`- ${m}`));
    lines.push("");
  }

  return lines.join("\n");
}

function bugReportToMarkdown(r: BugReportResult): string {
  const lines: string[] = [];

  lines.push(`# Bug Report: ${r.summary || "Untitled"}`);
  lines.push("");

  lines.push(`**Severity:** ${r.severity} | **Priority:** ${r.priority}`);
  lines.push("");

  lines.push("## Environment");
  if (r.environment) {
    lines.push(`- **App Version:** ${r.environment.app_version || "N/A"}`);
    lines.push(`- **OS:** ${r.environment.os || "N/A"}`);
    lines.push(`- **Browser:** ${r.environment.browser || "N/A"}`);
    lines.push(`- **Device:** ${r.environment.device || "N/A"}`);
    lines.push(`- **Environment:** ${r.environment.env || "UNKNOWN"}`);
  }
  lines.push("");

  if (r.preconditions?.length) {
    lines.push("## Preconditions");
    r.preconditions.forEach((p) => lines.push(`- ${p}`));
    lines.push("");
  }

  if (r.steps_to_reproduce?.length) {
    lines.push("## Steps to Reproduce");
    r.steps_to_reproduce.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
    lines.push("");
  }

  lines.push("## Actual Result");
  lines.push(r.actual_result || "N/A");
  lines.push("");

  lines.push("## Expected Result");
  lines.push(r.expected_result || "N/A");
  lines.push("");

  if (r.suspected_area) {
    lines.push(`**Suspected Area:** ${r.suspected_area}`);
    lines.push("");
  }

  if (r.attachments_suggestions?.length) {
    lines.push("## Suggested Attachments");
    r.attachments_suggestions.forEach((a) => lines.push(`- ${a}`));
    lines.push("");
  }

  if (r.missing_information?.length) {
    lines.push("## Missing Information");
    r.missing_information.forEach((m) => lines.push(`- ${m}`));
    lines.push("");
  }

  return lines.join("\n");
}

function apiIdeasToMarkdown(r: ApiIdeasResult): string {
  const lines: string[] = [];

  const ep = r.endpoint || { method: "UNKNOWN", path: "/unknown", description: "" };
  lines.push(`# API Test Ideas: ${ep.method} ${ep.path}`);
  lines.push("");
  if (ep.description) {
    lines.push(`> ${ep.description}`);
    lines.push("");
  }

  if (r.preconditions?.length) {
    lines.push("## Preconditions");
    r.preconditions.forEach((p) => lines.push(`- ${p}`));
    lines.push("");
  }

  if (r.happy_path) {
    lines.push("## Happy Path");
    lines.push("");
    lines.push("```bash");
    lines.push(r.happy_path.request_example || "# No example provided");
    lines.push("```");
    lines.push("");
    if (r.happy_path.checks?.length) {
      lines.push("**Checks:**");
      r.happy_path.checks.forEach((c) => lines.push(`- ${c}`));
      lines.push("");
    }
  }

  if (r.test_ideas?.length) {
    lines.push("## Test Ideas");
    lines.push("");

    r.test_ideas.forEach((idea, idx) => {
      lines.push(`### ${idx + 1}. ${idea.name}`);
      lines.push("");
      lines.push("```bash");
      lines.push(idea.request_example || "# No example provided");
      lines.push("```");
      lines.push("");

      if (idea.checks?.length) {
        lines.push("**Checks:**");
        idea.checks.forEach((c) => lines.push(`- ${c}`));
        lines.push("");
      }

      if (idea.negative_cases?.length) {
        lines.push("**Negative Cases:**");
        idea.negative_cases.forEach((n) => lines.push(`- ${n}`));
        lines.push("");
      }
    });
  }

  if (r.test_data_suggestions?.length) {
    lines.push("## Test Data Suggestions");
    r.test_data_suggestions.forEach((s) => lines.push(`- ${s}`));
    lines.push("");
  }

  if (r.missing_information?.length) {
    lines.push("## Missing Information");
    r.missing_information.forEach((m) => lines.push(`- ${m}`));
    lines.push("");
  }

  return lines.join("\n");
}

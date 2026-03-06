import type { Mode } from "./types";

export const SYSTEM_PROMPT = `You are a senior QA assistant that produces structured, practical artifacts for software testing.
You must follow these rules:

1) Output MUST be valid JSON only. No markdown, no explanations, no code fences.
2) Use the provided Project Context if available. If it is empty, make minimal neutral assumptions.
3) If the user input is missing critical details, still produce a best-effort result AND include missing_information questions in the JSON (where the schema allows it).
4) Do not invent product features not implied by the input/context. Prefer generic test ideas over fictional specifics.
5) Keep content concise and actionable: short steps, clear expected results.
6) Prefer test design techniques: equivalence partitioning, boundary values, negative testing, security basics, and error handling.
7) Use consistent severity/priority scales from Project Context when present; otherwise default:
   - severity: S1 Blocker, S2 Critical, S3 Major, S4 Minor
   - priority: P0, P1, P2, P3
8) Avoid personal data. If input contains sensitive data, redact it in outputs.
`;

function asTextBlock(fields: Record<string, unknown>) {
  return Object.entries(fields)
    .map(([k, v]) => {
      if (v === null || v === undefined) return `${k}:`;
      if (Array.isArray(v)) return `${k}:\n- ${v.join("\n- ")}`;
      if (typeof v === "object") return `${k}:\n${JSON.stringify(v, null, 2)}`;
      return `${k}: ${String(v)}`;
    })
    .join("\n\n");
}

export function buildUserPrompt(mode: Mode, projectContext: string, fields: Record<string, unknown>) {
  const inputBlock = asTextBlock(fields);

  if (mode === "testcases") {
    return `TASK: Generate test cases from a user story / requirement.

INPUT:
- Project Context:
${projectContext || "(empty)"}

- Structured feature input:
${inputBlock}

OUTPUT JSON SCHEMA:
{
  "feature": "string",
  "assumptions": ["string"],
  "test_cases": [
    {
      "id": "TC-001",
      "title": "string",
      "preconditions": ["string"],
      "steps": ["string"],
      "expected": "string",
      "priority": "P0|P1|P2|P3",
      "type": "positive|negative",
      "tags": ["string"]
    }
  ],
  "coverage_notes": ["string"],
  "missing_information": ["string"]
}

REQUIREMENTS:
- Provide 10–18 test cases unless the feature is extremely small.
- Include at least: 30% negative cases, boundary values, validation, error messages, permissions/roles if relevant.
- Use stable IDs (TC-001, TC-002, ...).
`;
  }

  if (mode === "bugreport") {
    return `TASK: Convert a raw bug description into a high-quality bug report.

INPUT:
- Project Context:
${projectContext || "(empty)"}

- Structured bug input:
${inputBlock}

OUTPUT JSON SCHEMA:
{
  "summary": "string",
  "severity": "S1 Blocker|S2 Critical|S3 Major|S4 Minor",
  "priority": "P0|P1|P2|P3",
  "environment": {
    "app_version": "string",
    "os": "string",
    "browser": "string",
    "device": "string",
    "env": "DEV|STAGE|PROD|UNKNOWN"
  },
  "preconditions": ["string"],
  "steps_to_reproduce": ["string"],
  "actual_result": "string",
  "expected_result": "string",
  "suspected_area": "frontend|backend|api|data|infrastructure|unknown",
  "attachments_suggestions": ["string"],
  "missing_information": ["string"]
}

REQUIREMENTS:
- Summary must be one sentence: <Where> <What> <Impact>.
- Steps should be detailed but not verbose.
- If severity/priority unclear, pick conservative defaults and add missing_information.
`;
  }

  return `TASK: Generate API test ideas and examples for an endpoint.

INPUT:
- Project Context:
${projectContext || "(empty)"}

- Structured API input:
${inputBlock}

OUTPUT JSON SCHEMA:
{
  "endpoint": {
    "method": "GET|POST|PUT|PATCH|DELETE|UNKNOWN",
    "path": "string",
    "description": "string"
  },
  "preconditions": ["string"],
  "happy_path": {
    "request_example": "string",
    "checks": ["string"]
  },
  "test_ideas": [
    {
      "name": "string",
      "request_example": "string",
      "checks": ["string"],
      "negative_cases": ["string"]
    }
  ],
  "test_data_suggestions": ["string"],
  "missing_information": ["string"]
}

REQUIREMENTS:
- Include: auth/permissions, validation, boundary values, error codes, idempotency (when applicable),
  rate limiting (if applicable), pagination/sorting (if applicable), contract/schema checks, security basics.
- request_example: prefer curl with headers and JSON payload when relevant.
`;
}
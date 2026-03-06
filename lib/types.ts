export type Mode = "testcases" | "bugreport" | "api_ideas";

export type GenerateRequest = {
  mode: Mode;
  project_context: string;
  input: {
    fields: Record<string, unknown>;
  };
  output_format: "json";
};

export type GenerateSuccessResponse = {
  mode: Mode;
  model: string;
  created_at: string; // ISO
  result: unknown;
  raw_llm_text: string;
};

export type GenerateErrorResponse = {
  error: {
    code: "LLM_UNAVAILABLE" | "INVALID_JSON" | "VALIDATION_FAILED" | "INTERNAL";
    message: string;
    details?: unknown;
  };
};

export type HistoryItem = {
  id: string;
  created_at: string;
  mode: Mode;
  input_fields: Record<string, unknown>;
  output: unknown;
};

export type TestCase = {
  id: string;
  title: string;
  preconditions: string[];
  steps: string[];
  expected: string;
  priority: "P0" | "P1" | "P2" | "P3";
  type: "positive" | "negative";
  tags: string[];
};

export type TestCasesResult = {
  feature: string;
  assumptions: string[];
  test_cases: TestCase[];
  coverage_notes: string[];
  missing_information: string[];
};

export type BugReportResult = {
  summary: string;
  severity: "S1 Blocker" | "S2 Critical" | "S3 Major" | "S4 Minor";
  priority: "P0" | "P1" | "P2" | "P3";
  environment: {
    app_version: string;
    os: string;
    browser: string;
    device: string;
    env: "DEV" | "STAGE" | "PROD" | "UNKNOWN";
  };
  preconditions: string[];
  steps_to_reproduce: string[];
  actual_result: string;
  expected_result: string;
  suspected_area: string;
  attachments_suggestions: string[];
  missing_information: string[];
};

export type ApiTestIdea = {
  name: string;
  request_example: string;
  checks: string[];
  negative_cases: string[];
};

export type ApiIdeasResult = {
  endpoint: { method: string; path: string; description: string };
  preconditions: string[];
  happy_path: { request_example: string; checks: string[] };
  test_ideas: ApiTestIdea[];
  test_data_suggestions: string[];
  missing_information: string[];
};

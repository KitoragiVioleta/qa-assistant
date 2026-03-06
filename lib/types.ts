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
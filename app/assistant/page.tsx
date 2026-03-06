"use client";

import { useState } from "react";
import Link from "next/link";
import type { Mode } from "@/lib/types";

type TabKey = Mode;

interface TestCaseFields {
  featureName: string;
  featureDescription: string;
  acceptanceCriteria: string;
  userRoles: string;
  inScope: string;
  outOfScope: string;
  testDataNotes: string;
  platforms: string;
  browsers: string;
  priorityFocus: string;
  constraints: string;
}

interface BugReportFields {
  where: string;
  what: string;
  steps: string;
  expected: string;
  actual: string;
  frequency: string;
  severityHint: string;
  priorityHint: string;
  env: string;
  appVersion: string;
  os: string;
  browser: string;
  device: string;
  logs: string;
  attachments: string;
  notes: string;
}

interface ApiTestFields {
  httpMethod: string;
  endpointPath: string;
  endpointPurpose: string;
  authType: string;
  rolesPermissions: string;
  requestSchema: string;
  responseSchema: string;
  statusCodes: string;
  pagination: string;
  idempotency: string;
  rateLimits: string;
  dataConstraints: string;
  relatedEndpoints: string;
}

const initialTestCaseFields: TestCaseFields = {
  featureName: "",
  featureDescription: "",
  acceptanceCriteria: "",
  userRoles: "",
  inScope: "",
  outOfScope: "",
  testDataNotes: "",
  platforms: "",
  browsers: "",
  priorityFocus: "",
  constraints: "",
};

const initialBugReportFields: BugReportFields = {
  where: "",
  what: "",
  steps: "",
  expected: "",
  actual: "",
  frequency: "",
  severityHint: "",
  priorityHint: "",
  env: "",
  appVersion: "",
  os: "",
  browser: "",
  device: "",
  logs: "",
  attachments: "",
  notes: "",
};

const initialApiTestFields: ApiTestFields = {
  httpMethod: "GET",
  endpointPath: "",
  endpointPurpose: "",
  authType: "",
  rolesPermissions: "",
  requestSchema: "",
  responseSchema: "",
  statusCodes: "",
  pagination: "",
  idempotency: "",
  rateLimits: "",
  dataConstraints: "",
  relatedEndpoints: "",
};

export default function AssistantPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("testcases");
  const [projectContext, setProjectContext] = useState("");
  const [testCaseFields, setTestCaseFields] = useState<TestCaseFields>(initialTestCaseFields);
  const [bugReportFields, setBugReportFields] = useState<BugReportFields>(initialBugReportFields);
  const [apiTestFields, setApiTestFields] = useState<ApiTestFields>(initialApiTestFields);
  const [result, setResult] = useState<string>("");

  const tabs: { key: TabKey; label: string }[] = [
    { key: "testcases", label: "Тест-кейси" },
    { key: "bugreport", label: "Баг-репорт" },
    { key: "api_ideas", label: "API тест-ідеї" },
  ];

  const handleSaveContext = () => {
    // Placeholder: save context to local storage or state
    alert("Контекст збережено (placeholder)");
  };

  const handleGenerate = () => {
    // Placeholder: generate result based on active tab
    const mockResult = {
      mode: activeTab,
      generated_at: new Date().toISOString(),
      data: activeTab === "testcases" 
        ? testCaseFields 
        : activeTab === "bugreport" 
        ? bugReportFields 
        : apiTestFields,
    };
    setResult(JSON.stringify(mockResult, null, 2));
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(result);
    alert("JSON скопійовано");
  };

  const handleCopyMarkdown = () => {
    // Simple markdown conversion
    const markdown = "```json\n" + result + "\n```";
    navigator.clipboard.writeText(markdown);
    alert("Markdown скопійовано");
  };

  const updateTestCaseField = (field: keyof TestCaseFields, value: string) => {
    setTestCaseFields((prev) => ({ ...prev, [field]: value }));
  };

  const updateBugReportField = (field: keyof BugReportFields, value: string) => {
    setBugReportFields((prev) => ({ ...prev, [field]: value }));
  };

  const updateApiTestField = (field: keyof ApiTestFields, value: string) => {
    setApiTestFields((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-foreground/10 px-6 py-4">
        <h1 className="text-xl font-semibold">QA Асистент (MVP)</h1>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-6">
        {/* Tabs */}
        <div className="mb-6 flex gap-1 border-b border-foreground/10">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-b-2 border-foreground text-foreground"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Section 1: Project Context */}
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium">Контекст проєкту</h2>
          <textarea
            value={projectContext}
            onChange={(e) => setProjectContext(e.target.value)}
            placeholder="Опишіть контекст вашого проєкту..."
            className="mb-3 h-32 w-full resize-y rounded border border-foreground/20 bg-background px-3 py-2 text-sm focus:border-foreground/40 focus:outline-none"
          />
          <div className="flex items-center gap-4">
            <button
              onClick={handleSaveContext}
              className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Зберегти контекст
            </button>
            <Link
              href="/context"
              className="text-sm text-foreground/70 underline hover:text-foreground"
            >
              Відкрити сторінку контексту
            </Link>
          </div>
        </section>

        {/* Section 2: Input Data */}
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium">Вхідні дані</h2>

          {/* Test Cases Form */}
          {activeTab === "testcases" && (
            <div className="space-y-4">
              <InputField
                label="Назва фічі"
                value={testCaseFields.featureName}
                onChange={(v) => updateTestCaseField("featureName", v)}
              />
              <TextareaField
                label="Опис фічі"
                value={testCaseFields.featureDescription}
                onChange={(v) => updateTestCaseField("featureDescription", v)}
              />
              <TextareaField
                label="Acceptance Criteria"
                value={testCaseFields.acceptanceCriteria}
                onChange={(v) => updateTestCaseField("acceptanceCriteria", v)}
              />
              <InputField
                label="Ролі користувачів"
                value={testCaseFields.userRoles}
                onChange={(v) => updateTestCaseField("userRoles", v)}
              />
              <TextareaField
                label="In scope"
                value={testCaseFields.inScope}
                onChange={(v) => updateTestCaseField("inScope", v)}
              />
              <TextareaField
                label="Out of scope"
                value={testCaseFields.outOfScope}
                onChange={(v) => updateTestCaseField("outOfScope", v)}
              />
              <TextareaField
                label="Нотатки по тест-даним"
                value={testCaseFields.testDataNotes}
                onChange={(v) => updateTestCaseField("testDataNotes", v)}
              />
              <InputField
                label="Платформи"
                value={testCaseFields.platforms}
                onChange={(v) => updateTestCaseField("platforms", v)}
              />
              <InputField
                label="Браузери"
                value={testCaseFields.browsers}
                onChange={(v) => updateTestCaseField("browsers", v)}
              />
              <InputField
                label="Фокус пріоритетів"
                value={testCaseFields.priorityFocus}
                onChange={(v) => updateTestCaseField("priorityFocus", v)}
              />
              <TextareaField
                label="Обмеження/правила"
                value={testCaseFields.constraints}
                onChange={(v) => updateTestCaseField("constraints", v)}
              />
              <button
                onClick={handleGenerate}
                className="mt-2 rounded bg-foreground px-6 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Generate
              </button>
            </div>
          )}

          {/* Bug Report Form */}
          {activeTab === "bugreport" && (
            <div className="space-y-4">
              <InputField
                label="Де сталося"
                value={bugReportFields.where}
                onChange={(v) => updateBugReportField("where", v)}
              />
              <TextareaField
                label="Що сталося"
                value={bugReportFields.what}
                onChange={(v) => updateBugReportField("what", v)}
              />
              <TextareaField
                label="Кроки (чернетка)"
                value={bugReportFields.steps}
                onChange={(v) => updateBugReportField("steps", v)}
              />
              <TextareaField
                label="Очікуваний результат"
                value={bugReportFields.expected}
                onChange={(v) => updateBugReportField("expected", v)}
              />
              <TextareaField
                label="Фактичний результат"
                value={bugReportFields.actual}
                onChange={(v) => updateBugReportField("actual", v)}
              />
              <InputField
                label="Частота"
                value={bugReportFields.frequency}
                onChange={(v) => updateBugReportField("frequency", v)}
              />
              <InputField
                label="Severity hint"
                value={bugReportFields.severityHint}
                onChange={(v) => updateBugReportField("severityHint", v)}
              />
              <InputField
                label="Priority hint"
                value={bugReportFields.priorityHint}
                onChange={(v) => updateBugReportField("priorityHint", v)}
              />

              {/* Environment Subsection */}
              <div className="rounded border border-foreground/10 p-4">
                <h3 className="mb-3 text-sm font-medium">Environment</h3>
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="Env"
                    value={bugReportFields.env}
                    onChange={(v) => updateBugReportField("env", v)}
                  />
                  <InputField
                    label="App version"
                    value={bugReportFields.appVersion}
                    onChange={(v) => updateBugReportField("appVersion", v)}
                  />
                  <InputField
                    label="OS"
                    value={bugReportFields.os}
                    onChange={(v) => updateBugReportField("os", v)}
                  />
                  <InputField
                    label="Browser"
                    value={bugReportFields.browser}
                    onChange={(v) => updateBugReportField("browser", v)}
                  />
                  <InputField
                    label="Device"
                    value={bugReportFields.device}
                    onChange={(v) => updateBugReportField("device", v)}
                    className="col-span-2 sm:col-span-1"
                  />
                </div>
              </div>

              <TextareaField
                label="Логи/stacktrace"
                value={bugReportFields.logs}
                onChange={(v) => updateBugReportField("logs", v)}
              />
              <InputField
                label="Attachments available"
                value={bugReportFields.attachments}
                onChange={(v) => updateBugReportField("attachments", v)}
              />
              <TextareaField
                label="Додаткові нотатки"
                value={bugReportFields.notes}
                onChange={(v) => updateBugReportField("notes", v)}
              />
              <button
                onClick={handleGenerate}
                className="mt-2 rounded bg-foreground px-6 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Generate
              </button>
            </div>
          )}

          {/* API Test Ideas Form */}
          {activeTab === "api_ideas" && (
            <div className="space-y-4">
              <InputField
                label="HTTP method"
                value={apiTestFields.httpMethod}
                onChange={(v) => updateApiTestField("httpMethod", v)}
              />
              <InputField
                label="Endpoint path"
                value={apiTestFields.endpointPath}
                onChange={(v) => updateApiTestField("endpointPath", v)}
              />
              <TextareaField
                label="Призначення endpoint"
                value={apiTestFields.endpointPurpose}
                onChange={(v) => updateApiTestField("endpointPurpose", v)}
              />
              <InputField
                label="Auth type"
                value={apiTestFields.authType}
                onChange={(v) => updateApiTestField("authType", v)}
              />
              <TextareaField
                label="Roles/permissions"
                value={apiTestFields.rolesPermissions}
                onChange={(v) => updateApiTestField("rolesPermissions", v)}
              />
              <TextareaField
                label="Request schema/example JSON"
                value={apiTestFields.requestSchema}
                onChange={(v) => updateApiTestField("requestSchema", v)}
              />
              <TextareaField
                label="Response schema/example JSON"
                value={apiTestFields.responseSchema}
                onChange={(v) => updateApiTestField("responseSchema", v)}
              />
              <InputField
                label="Відомі статус-коди"
                value={apiTestFields.statusCodes}
                onChange={(v) => updateApiTestField("statusCodes", v)}
              />
              <TextareaField
                label="Pagination/sorting"
                value={apiTestFields.pagination}
                onChange={(v) => updateApiTestField("pagination", v)}
              />
              <InputField
                label="Idempotency"
                value={apiTestFields.idempotency}
                onChange={(v) => updateApiTestField("idempotency", v)}
              />
              <TextareaField
                label="Rate limits"
                value={apiTestFields.rateLimits}
                onChange={(v) => updateApiTestField("rateLimits", v)}
              />
              <TextareaField
                label="Data constraints"
                value={apiTestFields.dataConstraints}
                onChange={(v) => updateApiTestField("dataConstraints", v)}
              />
              <TextareaField
                label="Related endpoints"
                value={apiTestFields.relatedEndpoints}
                onChange={(v) => updateApiTestField("relatedEndpoints", v)}
              />
              <button
                onClick={handleGenerate}
                className="mt-2 rounded bg-foreground px-6 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Generate
              </button>
            </div>
          )}
        </section>

        {/* Section 3: Result */}
        <section>
          <h2 className="mb-3 text-lg font-medium">Результат</h2>
          <div className="mb-3 flex gap-2">
            <button
              onClick={handleCopyJson}
              disabled={!result}
              className="rounded border border-foreground/20 px-4 py-2 text-sm transition-colors hover:bg-foreground/5 disabled:opacity-50"
            >
              Скопіювати JSON
            </button>
            <button
              onClick={handleCopyMarkdown}
              disabled={!result}
              className="rounded border border-foreground/20 px-4 py-2 text-sm transition-colors hover:bg-foreground/5 disabled:opacity-50"
            >
              Скопіювати Markdown
            </button>
          </div>
          <pre className="min-h-[200px] overflow-auto rounded border border-foreground/20 bg-foreground/5 p-4 font-mono text-sm">
            {result || "// Результат з'явиться тут після натискання Generate"}
          </pre>
        </section>
      </main>
    </div>
  );
}

// Reusable Input Field Component
function InputField({
  label,
  value,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-foreground/80">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-foreground/20 bg-background px-3 py-2 text-sm focus:border-foreground/40 focus:outline-none"
      />
    </div>
  );
}

// Reusable Textarea Field Component
function TextareaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-foreground/80">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full resize-y rounded border border-foreground/20 bg-background px-3 py-2 text-sm focus:border-foreground/40 focus:outline-none"
      />
    </div>
  );
}

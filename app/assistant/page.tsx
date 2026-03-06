"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { Mode } from "@/lib/types";
import { Loader2, Copy, Check, FileText, Sparkles } from "lucide-react";

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

interface HistoryItem {
  id: string;
  created_at: string;
  mode: TabKey;
  input_fields: Record<string, unknown>;
  output: unknown;
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

const CONTEXT_STORAGE_KEY = "qa_assistant_project_context_v1";
const HISTORY_STORAGE_KEY = "qa_assistant_history_v1";
const MAX_HISTORY_ITEMS = 50;

const tabLabels: Record<TabKey, string> = {
  testcases: "Тест-кейси",
  bugreport: "Баг-репорт",
  api_ideas: "API тест-ідеї",
};

export default function AssistantPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("testcases");
  const [projectContext, setProjectContext] = useState("");
  const [testCaseFields, setTestCaseFields] = useState<TestCaseFields>(initialTestCaseFields);
  const [bugReportFields, setBugReportFields] = useState<BugReportFields>(initialBugReportFields);
  const [apiTestFields, setApiTestFields] = useState<ApiTestFields>(initialApiTestFields);
  const [result, setResult] = useState<unknown>(null);
  const [resultMeta, setResultMeta] = useState<{ mode: TabKey; timestamp: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contextSaved, setContextSaved] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);
  const [markdownCopied, setMarkdownCopied] = useState(false);

  // Load context from localStorage on mount
  useEffect(() => {
    const savedContext = localStorage.getItem(CONTEXT_STORAGE_KEY);
    if (savedContext) {
      setProjectContext(savedContext);
    }
  }, []);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "testcases", label: "Тест-кейси" },
    { key: "bugreport", label: "Баг-репорт" },
    { key: "api_ideas", label: "API тест-ідеї" },
  ];

  const handleSaveContext = () => {
    localStorage.setItem(CONTEXT_STORAGE_KEY, projectContext);
    setContextSaved(true);
    setTimeout(() => setContextSaved(false), 2000);
  };

  const saveToHistory = useCallback((mode: TabKey, inputFields: Record<string, unknown>, output: unknown) => {
    const historyItem: HistoryItem = {
      id: Math.random().toString(36).substring(2, 15),
      created_at: new Date().toISOString(),
      mode,
      input_fields: inputFields,
      output,
    };

    const existingHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
    let history: HistoryItem[] = existingHistory ? JSON.parse(existingHistory) : [];
    history = [historyItem, ...history].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  }, []);

  const getCurrentFields = useCallback((): Record<string, unknown> => {
    switch (activeTab) {
      case "testcases":
        return testCaseFields as unknown as Record<string, unknown>;
      case "bugreport":
        return bugReportFields as unknown as Record<string, unknown>;
      case "api_ideas":
        return apiTestFields as unknown as Record<string, unknown>;
    }
  }, [activeTab, testCaseFields, bugReportFields, apiTestFields]);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);

    const requestBody = {
      mode: activeTab,
      project_context: projectContext,
      input: { fields: getCurrentFields() },
      output_format: "json",
    };

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        // API returns { error: { code, message } }
        const errorMessage = data?.error?.message || `Помилка: ${response.status}`;
        throw new Error(errorMessage);
      }

      // API returns { mode, model, created_at, result, raw_llm_text }
      const resultData = data.result || data;
      setResult(resultData);
      setResultMeta({ mode: activeTab, timestamp: data.created_at || new Date().toISOString() });
      saveToHistory(activeTab, getCurrentFields(), resultData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Невідома помилка");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyJson = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setJsonCopied(true);
    setTimeout(() => setJsonCopied(false), 2000);
  };

  const convertToMarkdown = (data: unknown, mode: TabKey): string => {
    const modeTitle = tabLabels[mode];
    let md = `# ${modeTitle}\n\n`;
    md += `*Згенеровано: ${new Date().toLocaleString("uk-UA")}*\n\n`;

    if (typeof data === "object" && data !== null) {
      const formatObject = (obj: Record<string, unknown>, indent = ""): string => {
        let result = "";
        for (const [key, value] of Object.entries(obj)) {
          if (Array.isArray(value)) {
            result += `${indent}**${key}:**\n`;
            value.forEach((item, i) => {
              if (typeof item === "object" && item !== null) {
                result += `${indent}- Item ${i + 1}:\n`;
                result += formatObject(item as Record<string, unknown>, indent + "  ");
              } else {
                result += `${indent}- ${item}\n`;
              }
            });
          } else if (typeof value === "object" && value !== null) {
            result += `${indent}**${key}:**\n`;
            result += formatObject(value as Record<string, unknown>, indent + "  ");
          } else {
            result += `${indent}**${key}:** ${value}\n`;
          }
        }
        return result;
      };
      md += formatObject(data as Record<string, unknown>);
    } else {
      md += String(data);
    }

    return md;
  };

  const handleCopyMarkdown = async () => {
    if (!result || !resultMeta) return;
    const markdown = convertToMarkdown(result, resultMeta.mode);
    await navigator.clipboard.writeText(markdown);
    setMarkdownCopied(true);
    setTimeout(() => setMarkdownCopied(false), 2000);
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

  const formatTimestamp = (iso: string) => {
    return new Date(iso).toLocaleString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">QA Асистент (MVP)</h1>
          <Link
            href="/context"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Контекст проєкту
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Tabs */}
        <div className="mb-8 flex gap-2 rounded-2xl bg-card p-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? "bg-primary text-white shadow-lg shadow-primary/25"
                  : "text-muted hover:bg-input hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Section 1: Project Context */}
        <section className="mb-8 overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          <div className="border-l-4 border-l-context-accent">
            <div className="p-6">
              <h2 className="mb-1 text-lg font-bold text-foreground">Контекст проєкту</h2>
              <p className="mb-4 text-xs uppercase tracking-wider text-muted">
                Загальна інформація про ваш проєкт
              </p>
              <div className="relative">
                <textarea
                  value={projectContext}
                  onChange={(e) => setProjectContext(e.target.value)}
                  placeholder="Опишіть ваш проєкт: назва, основні функції, цільова аудиторія, технічний стек..."
                  className="mb-2 h-32 w-full resize-y rounded-xl border border-input-border bg-input px-4 py-3 text-sm text-foreground placeholder-muted transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <div className="text-right text-xs text-muted">
                  {projectContext.length} символів
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <button
                  onClick={handleSaveContext}
                  className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:border-primary hover:bg-input"
                >
                  {contextSaved ? (
                    <>
                      <Check className="h-4 w-4 text-success" />
                      <span className="text-success">Збережено</span>
                    </>
                  ) : (
                    "Зберегти контекст"
                  )}
                </button>
                <Link
                  href="/context"
                  className="text-sm text-muted transition-colors hover:text-primary"
                >
                  Відкрити сторінку контексту
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Input Data */}
        <section className="mb-8 overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          <div className="border-l-4 border-l-input-accent">
            <div className="p-6">
              <h2 className="mb-1 text-lg font-bold text-foreground">Вхідні дані</h2>
              <p className="mb-6 text-xs uppercase tracking-wider text-muted">
                {tabLabels[activeTab]} - заповніть форму
              </p>

              {/* Test Cases Form */}
              {activeTab === "testcases" && (
                <div className="space-y-5">
                  <InputField
                    label="Назва фічі"
                    value={testCaseFields.featureName}
                    onChange={(v) => updateTestCaseField("featureName", v)}
                    placeholder="Наприклад: Авторизація через Google"
                  />
                  <TextareaField
                    label="Опис фічі"
                    value={testCaseFields.featureDescription}
                    onChange={(v) => updateTestCaseField("featureDescription", v)}
                    placeholder="Детальний опис функціоналу, який потрібно протестувати..."
                  />
                  <TextareaField
                    label="Acceptance Criteria"
                    value={testCaseFields.acceptanceCriteria}
                    onChange={(v) => updateTestCaseField("acceptanceCriteria", v)}
                    placeholder="Критерії прийняття у форматі Given/When/Then або списком..."
                  />
                  <InputField
                    label="Ролі користувачів"
                    value={testCaseFields.userRoles}
                    onChange={(v) => updateTestCaseField("userRoles", v)}
                    placeholder="Наприклад: Admin, User, Guest"
                  />
                  <TextareaField
                    label="In scope"
                    value={testCaseFields.inScope}
                    onChange={(v) => updateTestCaseField("inScope", v)}
                    placeholder="Що входить у scope тестування..."
                  />
                  <TextareaField
                    label="Out of scope"
                    value={testCaseFields.outOfScope}
                    onChange={(v) => updateTestCaseField("outOfScope", v)}
                    placeholder="Що НЕ входить у scope тестування..."
                  />
                  <TextareaField
                    label="Нотатки по тест-даним"
                    value={testCaseFields.testDataNotes}
                    onChange={(v) => updateTestCaseField("testDataNotes", v)}
                    placeholder="Особливості тестових даних, обмеження..."
                  />
                  <InputField
                    label="Платформи"
                    value={testCaseFields.platforms}
                    onChange={(v) => updateTestCaseField("platforms", v)}
                    placeholder="Наприклад: Web, iOS, Android"
                  />
                  <InputField
                    label="Браузери"
                    value={testCaseFields.browsers}
                    onChange={(v) => updateTestCaseField("browsers", v)}
                    placeholder="Наприклад: Chrome, Firefox, Safari"
                  />
                  <InputField
                    label="Фокус пріоритетів"
                    value={testCaseFields.priorityFocus}
                    onChange={(v) => updateTestCaseField("priorityFocus", v)}
                    placeholder="Наприклад: Critical paths, Edge cases"
                  />
                  <TextareaField
                    label="Обмеження/правила"
                    value={testCaseFields.constraints}
                    onChange={(v) => updateTestCaseField("constraints", v)}
                    placeholder="Технічні або бізнес-обмеження..."
                  />
                </div>
              )}

              {/* Bug Report Form */}
              {activeTab === "bugreport" && (
                <div className="space-y-5">
                  <InputField
                    label="Де сталося"
                    value={bugReportFields.where}
                    onChange={(v) => updateBugReportField("where", v)}
                    placeholder="Сторінка, модуль, компонент..."
                  />
                  <TextareaField
                    label="Що сталося"
                    value={bugReportFields.what}
                    onChange={(v) => updateBugReportField("what", v)}
                    placeholder="Короткий опис проблеми..."
                  />
                  <TextareaField
                    label="Кроки (чернетка)"
                    value={bugReportFields.steps}
                    onChange={(v) => updateBugReportField("steps", v)}
                    placeholder="1. Відкрити сторінку...&#10;2. Натиснути на кнопку...&#10;3. Ввести дані..."
                  />
                  <TextareaField
                    label="Очікуваний результат"
                    value={bugReportFields.expected}
                    onChange={(v) => updateBugReportField("expected", v)}
                    placeholder="Що мало статися..."
                  />
                  <TextareaField
                    label="Фактичний результат"
                    value={bugReportFields.actual}
                    onChange={(v) => updateBugReportField("actual", v)}
                    placeholder="Що насправді сталося..."
                  />
                  <InputField
                    label="Частота"
                    value={bugReportFields.frequency}
                    onChange={(v) => updateBugReportField("frequency", v)}
                    placeholder="Наприклад: Завжди, Іноді, Рідко"
                  />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <InputField
                      label="Severity hint"
                      value={bugReportFields.severityHint}
                      onChange={(v) => updateBugReportField("severityHint", v)}
                      placeholder="Critical, Major, Minor..."
                    />
                    <InputField
                      label="Priority hint"
                      value={bugReportFields.priorityHint}
                      onChange={(v) => updateBugReportField("priorityHint", v)}
                      placeholder="High, Medium, Low..."
                    />
                  </div>

                  {/* Environment Subsection */}
                  <div className="rounded-xl border border-border bg-input/50 p-4">
                    <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted">
                      Environment
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <InputField
                        label="Env"
                        value={bugReportFields.env}
                        onChange={(v) => updateBugReportField("env", v)}
                        placeholder="Production, Staging..."
                      />
                      <InputField
                        label="App version"
                        value={bugReportFields.appVersion}
                        onChange={(v) => updateBugReportField("appVersion", v)}
                        placeholder="1.2.3"
                      />
                      <InputField
                        label="OS"
                        value={bugReportFields.os}
                        onChange={(v) => updateBugReportField("os", v)}
                        placeholder="Windows 11, macOS 14..."
                      />
                      <InputField
                        label="Browser"
                        value={bugReportFields.browser}
                        onChange={(v) => updateBugReportField("browser", v)}
                        placeholder="Chrome 120, Firefox 121..."
                      />
                      <InputField
                        label="Device"
                        value={bugReportFields.device}
                        onChange={(v) => updateBugReportField("device", v)}
                        placeholder="Desktop, iPhone 15..."
                      />
                    </div>
                  </div>

                  <TextareaField
                    label="Логи/stacktrace"
                    value={bugReportFields.logs}
                    onChange={(v) => updateBugReportField("logs", v)}
                    placeholder="Вставте логи або stacktrace..."
                  />
                  <InputField
                    label="Attachments available"
                    value={bugReportFields.attachments}
                    onChange={(v) => updateBugReportField("attachments", v)}
                    placeholder="Screenshot, Video, HAR..."
                  />
                  <TextareaField
                    label="Додаткові нотатки"
                    value={bugReportFields.notes}
                    onChange={(v) => updateBugReportField("notes", v)}
                    placeholder="Будь-яка додаткова інформація..."
                  />
                </div>
              )}

              {/* API Test Ideas Form */}
              {activeTab === "api_ideas" && (
                <div className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <InputField
                      label="HTTP method"
                      value={apiTestFields.httpMethod}
                      onChange={(v) => updateApiTestField("httpMethod", v)}
                      placeholder="GET, POST, PUT, DELETE..."
                    />
                    <InputField
                      label="Endpoint path"
                      value={apiTestFields.endpointPath}
                      onChange={(v) => updateApiTestField("endpointPath", v)}
                      placeholder="/api/v1/users/{id}"
                    />
                  </div>
                  <TextareaField
                    label="Призначення endpoint"
                    value={apiTestFields.endpointPurpose}
                    onChange={(v) => updateApiTestField("endpointPurpose", v)}
                    placeholder="Опис що робить цей endpoint..."
                  />
                  <InputField
                    label="Auth type"
                    value={apiTestFields.authType}
                    onChange={(v) => updateApiTestField("authType", v)}
                    placeholder="Bearer token, API key, OAuth2..."
                  />
                  <TextareaField
                    label="Roles/permissions"
                    value={apiTestFields.rolesPermissions}
                    onChange={(v) => updateApiTestField("rolesPermissions", v)}
                    placeholder="Які ролі мають доступ до endpoint..."
                  />
                  <TextareaField
                    label="Request schema/example JSON"
                    value={apiTestFields.requestSchema}
                    onChange={(v) => updateApiTestField("requestSchema", v)}
                    placeholder='{"name": "string", "email": "string"}'
                  />
                  <TextareaField
                    label="Response schema/example JSON"
                    value={apiTestFields.responseSchema}
                    onChange={(v) => updateApiTestField("responseSchema", v)}
                    placeholder='{"id": 1, "name": "string", "created_at": "ISO8601"}'
                  />
                  <InputField
                    label="Відомі статус-коди"
                    value={apiTestFields.statusCodes}
                    onChange={(v) => updateApiTestField("statusCodes", v)}
                    placeholder="200, 201, 400, 401, 404, 500..."
                  />
                  <TextareaField
                    label="Pagination/sorting"
                    value={apiTestFields.pagination}
                    onChange={(v) => updateApiTestField("pagination", v)}
                    placeholder="Параметри пагінації та сортування..."
                  />
                  <InputField
                    label="Idempotency"
                    value={apiTestFields.idempotency}
                    onChange={(v) => updateApiTestField("idempotency", v)}
                    placeholder="Так/Ні, деталі..."
                  />
                  <TextareaField
                    label="Rate limits"
                    value={apiTestFields.rateLimits}
                    onChange={(v) => updateApiTestField("rateLimits", v)}
                    placeholder="Обмеження по кількості запитів..."
                  />
                  <TextareaField
                    label="Data constraints"
                    value={apiTestFields.dataConstraints}
                    onChange={(v) => updateApiTestField("dataConstraints", v)}
                    placeholder="Валідація, обмеження полів..."
                  />
                  <TextareaField
                    label="Related endpoints"
                    value={apiTestFields.relatedEndpoints}
                    onChange={(v) => updateApiTestField("relatedEndpoints", v)}
                    placeholder="Пов'язані endpoints для інтеграційних тестів..."
                  />
                </div>
              )}

              {/* Generate Button */}
              <div className="mt-6">
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="group relative flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Генерація...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Generate</span>
                    </>
                  )}
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 animate-fade-in rounded-xl border border-error/30 bg-error/10 p-4">
                  <p className="text-sm font-medium text-error">{error}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 3: Result */}
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          <div className="border-l-4 border-l-result-accent">
            <div className="p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-foreground">Результат</h2>
                  {resultMeta && (
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-result-accent/20 px-2 py-1 text-xs font-medium text-result-accent">
                        {tabLabels[resultMeta.mode]}
                      </span>
                      <span className="text-xs text-muted">
                        {formatTimestamp(resultMeta.timestamp)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyJson}
                    disabled={!result}
                    className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-all hover:border-primary hover:bg-input disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {jsonCopied ? (
                      <>
                        <Check className="h-4 w-4 text-success" />
                        <span className="text-success">Скопійовано</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Скопіювати JSON</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCopyMarkdown}
                    disabled={!result}
                    className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-all hover:border-primary hover:bg-input disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {markdownCopied ? (
                      <>
                        <Check className="h-4 w-4 text-success" />
                        <span className="text-success">Скопійовано</span>
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        <span>Скопіювати Markdown</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Result Display */}
              {result ? (
                <div className="animate-fade-in overflow-hidden rounded-xl border border-border bg-code-bg">
                  <div className="max-h-[500px] overflow-auto">
                    <pre className="p-4 font-mono text-sm leading-relaxed">
                      <code>
                        {JSON.stringify(result, null, 2).split("\n").map((line, i) => (
                          <div key={i} className="flex">
                            <span className="mr-4 inline-block w-8 select-none text-right text-muted/50">
                              {i + 1}
                            </span>
                            <span className="text-foreground">{line}</span>
                          </div>
                        ))}
                      </code>
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-input/30 py-16">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-card">
                    <FileText className="h-8 w-8 text-muted" />
                  </div>
                  <p className="text-center text-sm text-muted">
                    Заповніть форму та натисніть Generate
                  </p>
                </div>
              )}
            </div>
          </div>
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
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-input-border bg-input px-4 py-2.5 text-sm text-foreground placeholder-muted/60 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}

// Reusable Textarea Field Component
function TextareaField({
  label,
  value,
  onChange,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const lineCount = value.split("\n").length;

  return (
    <div>
      <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-y rounded-xl border border-input-border bg-input px-4 py-2.5 text-sm text-foreground placeholder-muted/60 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      <div className="mt-1 flex justify-end gap-3 text-xs text-muted/70">
        <span>{value.length} символів</span>
        <span>{lineCount} {lineCount === 1 ? "рядок" : lineCount < 5 ? "рядки" : "рядків"}</span>
      </div>
    </div>
  );
}

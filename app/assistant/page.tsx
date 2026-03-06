"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import type { Mode, HistoryItem, TestCasesResult, BugReportResult, ApiIdeasResult } from "@/lib/types";
import { loadHistory, addHistoryItem, loadContext, saveContext, loadDraft, saveDraft, removeHistoryItem, clearHistory } from "@/lib/history";
import { resultToMarkdown } from "@/lib/markdown";
import { Loader2, Copy, Check, FileText, Sparkles, ChevronDown, ChevronRight, Clock, Trash2, Eye, X } from "lucide-react";

type TabKey = Mode;

interface TestCaseFields {
  feature_title: string;
  feature_description: string;
  acceptance_criteria: string;
  user_roles: string;
  in_scope: string;
  out_of_scope: string;
  test_data_notes: string;
  platforms: string;
  browsers: string;
  priority_focus: string;
  constraints: string;
}

interface BugReportFields {
  where_happened: string;
  what_happened: string;
  steps_draft: string;
  expected_result: string;
  actual_result: string;
  frequency: string;
  severity_hint: string;
  priority_hint: string;
  env: string;
  app_version: string;
  os: string;
  browser: string;
  device: string;
  logs_stacktrace: string;
  attachments_available: string;
  additional_notes: string;
}

interface ApiTestFields {
  http_method: string;
  endpoint_path: string;
  endpoint_purpose: string;
  auth_type: string;
  roles_permissions: string;
  request_schema: string;
  response_schema: string;
  status_codes: string;
  pagination_sorting: string;
  idempotency: string;
  rate_limits: string;
  data_constraints: string;
  related_endpoints: string;
}

interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

const initialTestCaseFields: TestCaseFields = {
  feature_title: "",
  feature_description: "",
  acceptance_criteria: "",
  user_roles: "",
  in_scope: "",
  out_of_scope: "",
  test_data_notes: "",
  platforms: "",
  browsers: "",
  priority_focus: "",
  constraints: "",
};

const initialBugReportFields: BugReportFields = {
  where_happened: "",
  what_happened: "",
  steps_draft: "",
  expected_result: "",
  actual_result: "",
  frequency: "",
  severity_hint: "",
  priority_hint: "",
  env: "",
  app_version: "",
  os: "",
  browser: "",
  device: "",
  logs_stacktrace: "",
  attachments_available: "",
  additional_notes: "",
};

const initialApiTestFields: ApiTestFields = {
  http_method: "GET",
  endpoint_path: "",
  endpoint_purpose: "",
  auth_type: "",
  roles_permissions: "",
  request_schema: "",
  response_schema: "",
  status_codes: "",
  pagination_sorting: "",
  idempotency: "",
  rate_limits: "",
  data_constraints: "",
  related_endpoints: "",
};

const tabLabels: Record<TabKey, string> = {
  testcases: "Тест-кейси",
  bugreport: "Баг-репорт",
  api_ideas: "API тест-ідеї",
};

const tabIcons: Record<TabKey, string> = {
  testcases: "🧪",
  bugreport: "🐛",
  api_ideas: "🔌",
};

const EXAMPLE_CONTEXT = `Назва: ShopSwift – E-commerce платформа
Тип: Web + Mobile додаток (iOS/Android)
Технічний стек: React, Node.js, PostgreSQL, Redis

Ролі користувачів:
- Guest: перегляд каталогу, пошук, додавання в кошик
- User: все що Guest + оформлення замовлення, історія покупок, wishlist
- Seller: створення/редагування товарів, перегляд продажів
- Admin: управління користувачами, модерація товарів, аналітика

Середовища:
- DEV: dev.shopswift.local
- STAGE: stage.shopswift.com  
- PROD: shopswift.com

Severity/Priority правила:
- S1/P0: Неможливо оформити замовлення, втрата даних
- S2/P1: Функціонал не працює, але є workaround
- S3/P2: UI баги, некритичні помилки
- S4/P3: Косметичні проблеми, покращення

Технічні обмеження:
- Максимальний розмір зображення: 5MB
- Підтримувані формати: JPG, PNG, WebP
- Кошик зберігається 30 днів для Guest`;

export default function AssistantPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("testcases");
  const [projectContext, setProjectContext] = useState("");
  const [testCaseFields, setTestCaseFields] = useState<TestCaseFields>(initialTestCaseFields);
  const [bugReportFields, setBugReportFields] = useState<BugReportFields>(initialBugReportFields);
  const [apiTestFields, setApiTestFields] = useState<ApiTestFields>(initialApiTestFields);
  const [result, setResult] = useState<TestCasesResult | BugReportResult | ApiIdeasResult | null>(null);
  const [resultMode, setResultMode] = useState<TabKey | null>(null);
  const [resultTimestamp, setResultTimestamp] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [autoSaveIndicator, setAutoSaveIndicator] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [expandedTestCase, setExpandedTestCase] = useState<string | null>(null);
  const [testCaseFilter, setTestCaseFilter] = useState<"all" | "positive" | "negative" | "high-priority">("all");
  const [expandedApiIdeas, setExpandedApiIdeas] = useState<Record<number, boolean>>({ 0: true });
  
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const resultRef = useRef<HTMLElement>(null);

  // Load data on mount
  useEffect(() => {
    setProjectContext(loadContext());
    setHistoryItems(loadHistory().slice(0, 5));
  }, []);

  // Auto-save context with debounce
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      if (projectContext) {
        saveContext(projectContext);
        setAutoSaveIndicator(true);
        setTimeout(() => setAutoSaveIndicator(false), 2000);
      }
    }, 1000);
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [projectContext]);

  const addToast = useCallback((type: Toast["type"], message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  }, []);

  const todayCount = historyItems.filter((item) => {
    const today = new Date().toDateString();
    return new Date(item.created_at).toDateString() === today;
  }).length;

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: "testcases", label: "Тест-кейси", icon: "🧪" },
    { key: "bugreport", label: "Баг-репорт", icon: "🐛" },
    { key: "api_ideas", label: "API тест-ідеї", icon: "🔌" },
  ];

  const handleSaveContext = () => {
    saveContext(projectContext);
    addToast("success", "Контекст збережено");
  };

  const handleClearContext = () => {
    if (confirm("Очистити контекст проєкту?")) {
      setProjectContext("");
      saveContext("");
      addToast("info", "Контекст очищено");
    }
  };

  const handleFillExample = () => {
    setProjectContext(EXAMPLE_CONTEXT);
    addToast("info", "Приклад контексту завантажено");
  };

  const handleCopyContext = async () => {
    await navigator.clipboard.writeText(projectContext);
    addToast("success", "Скопійовано");
  };

  const handleSaveDraft = () => {
    const fields = getCurrentFields();
    saveDraft(activeTab, fields);
    addToast("success", "Чернетку збережено");
  };

  const handleRestoreDraft = () => {
    const draft = loadDraft();
    if (!draft) {
      addToast("warning", "Чернетка не знайдена");
      return;
    }
    if (draft.mode !== activeTab) {
      addToast("warning", `Чернетка для іншого режиму (${tabLabels[draft.mode]})`);
      return;
    }
    applyFields(draft.fields);
    addToast("success", "Чернетку відновлено");
  };

  const handleClearForm = () => {
    if (confirm("Очистити всі поля форми?")) {
      switch (activeTab) {
        case "testcases":
          setTestCaseFields(initialTestCaseFields);
          break;
        case "bugreport":
          setBugReportFields(initialBugReportFields);
          break;
        case "api_ideas":
          setApiTestFields(initialApiTestFields);
          break;
      }
      setValidationErrors({});
      addToast("info", "Форму очищено");
    }
  };

  const applyFields = (fields: Record<string, unknown>) => {
    switch (activeTab) {
      case "testcases":
        setTestCaseFields({ ...initialTestCaseFields, ...fields } as TestCaseFields);
        break;
      case "bugreport":
        setBugReportFields({ ...initialBugReportFields, ...fields } as BugReportFields);
        break;
      case "api_ideas":
        setApiTestFields({ ...initialApiTestFields, ...fields } as ApiTestFields);
        break;
    }
  };

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

  const validateFields = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (activeTab === "testcases" && !testCaseFields.feature_title.trim()) {
      errors.feature_title = "Обов'язкове поле";
    }
    if (activeTab === "bugreport" && !bugReportFields.where_happened.trim()) {
      errors.where_happened = "Обов'язкове поле";
    }
    if (activeTab === "api_ideas" && !apiTestFields.endpoint_path.trim()) {
      errors.endpoint_path = "Обов'язкове поле";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGenerate = async () => {
    if (!validateFields()) {
      addToast("error", "Заповніть обов'язкові поля");
      return;
    }

    setIsLoading(true);
    setErrorText("");
    setResult(null);

    const requestBody = {
      mode: activeTab,
      project_context: projectContext,
      input: { fields: getCurrentFields() },
      output_format: "json" as const,
    };

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data?.error?.message || `Помилка: ${response.status}`;
        throw new Error(errorMessage);
      }

      const resultData = data.result || data;
      setResult(resultData);
      setResultMode(activeTab);
      setResultTimestamp(data.created_at || new Date().toISOString());
      
      // Add to history
      const historyItem: HistoryItem = {
        id: Math.random().toString(36).substring(2, 15),
        created_at: new Date().toISOString(),
        mode: activeTab,
        input_fields: getCurrentFields(),
        output: resultData,
      };
      addHistoryItem(historyItem);
      setHistoryItems(loadHistory().slice(0, 5));
      
      addToast("success", "Генерацію завершено");
      
      // Scroll to result
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Невідома помилка";
      setErrorText(message);
      addToast("error", message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearResult = () => {
    setResult(null);
    setResultMode(null);
    setResultTimestamp(null);
  };

  const handleCopyJson = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    addToast("success", "JSON скопійовано");
  };

  const handleCopyMarkdown = async () => {
    if (!result || !resultMode) return;
    const markdown = resultToMarkdown(resultMode, result);
    await navigator.clipboard.writeText(markdown);
    addToast("success", "Markdown скопійовано");
  };

  const handleViewHistoryItem = (item: HistoryItem) => {
    setResult(item.output);
    setResultMode(item.mode);
    setResultTimestamp(item.created_at);
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleDeleteHistoryItem = (id: string) => {
    removeHistoryItem(id);
    setHistoryItems(loadHistory().slice(0, 5));
    addToast("info", "Видалено з історії");
  };

  const handleClearHistory = () => {
    if (confirm("Очистити всю історію?")) {
      clearHistory();
      setHistoryItems([]);
      addToast("info", "Історію очищено");
    }
  };

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setErrorText("");
    setValidationErrors({});
  };

  const updateTestCaseField = (field: keyof TestCaseFields, value: string) => {
    setTestCaseFields((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const updateBugReportField = (field: keyof BugReportFields, value: string) => {
    setBugReportFields((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const updateApiTestField = (field: keyof ApiTestFields, value: string) => {
    setApiTestFields((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: "" }));
    }
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

  const getPreviewText = (item: HistoryItem): string => {
    const fields = item.input_fields;
    if (item.mode === "testcases") return String(fields.feature_title || "Без назви");
    if (item.mode === "bugreport") return String(fields.where_happened || "Без локації");
    return String(fields.endpoint_path || "/endpoint");
  };

  // Filter test cases
  const getFilteredTestCases = (testCases: TestCasesResult["test_cases"]) => {
    if (!testCases) return [];
    switch (testCaseFilter) {
      case "positive":
        return testCases.filter((tc) => tc.type === "positive");
      case "negative":
        return testCases.filter((tc) => tc.type === "negative");
      case "high-priority":
        return testCases.filter((tc) => tc.priority === "P0" || tc.priority === "P1");
      default:
        return testCases;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Toast Container */}
      <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`animate-slide-in-right flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
              toast.type === "success" ? "bg-success/20 text-success border border-success/30" :
              toast.type === "error" ? "bg-error/20 text-error border border-error/30" :
              toast.type === "warning" ? "bg-warning/20 text-warning border border-warning/30" :
              "bg-primary/20 text-primary border border-primary/30"
            }`}
          >
            {toast.type === "success" && <Check className="h-4 w-4" />}
            {toast.type === "error" && <X className="h-4 w-4" />}
            {toast.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground">QA Асистент</h1>
            <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">BETA</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-sm text-muted">
              Генерацій сьогодні: <span className="font-semibold text-foreground">{todayCount}</span>
            </span>
            <Link href="/history" className="text-sm text-muted transition-colors hover:text-foreground">
              Історія
            </Link>
            <Link href="/context" className="text-sm text-muted transition-colors hover:text-foreground">
              Контекст
            </Link>
          </div>
        </div>
        <div className="h-[2px] bg-gradient-to-r from-primary via-accent to-primary" />
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Tabs */}
        <div className="mb-8 flex gap-2 rounded-2xl bg-card p-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg"
                  : "text-muted hover:bg-input hover:text-foreground"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Section 1: Project Context */}
        <section className="mb-8 overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          <div className="border-l-4 border-l-context-accent">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Контекст проєкту</h2>
                  <p className="text-xs uppercase tracking-wider text-muted">Загальна інформація</p>
                </div>
                {autoSaveIndicator && (
                  <span className="text-xs text-success animate-fade-in">Автозбережено</span>
                )}
              </div>
              <div className="relative">
                <textarea
                  value={projectContext}
                  onChange={(e) => setProjectContext(e.target.value)}
                  placeholder="Опишіть ваш проєкт: назва, основні функції, цільова аудиторія, технічний стек, ролі користувачів..."
                  className="mb-2 h-36 w-full resize-y rounded-xl border border-input-border bg-input px-4 py-3 text-sm text-foreground placeholder-muted transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <div className="text-right text-xs text-muted">
                  {projectContext.length} символів
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button onClick={handleSaveContext} className="btn-secondary">
                  💾 Зберегти контекст
                </button>
                <button onClick={handleFillExample} className="btn-secondary">
                  ✨ Приклад
                </button>
                <button onClick={handleCopyContext} className="btn-secondary">
                  📋 Скопіювати
                </button>
                <button onClick={handleClearContext} className="btn-danger">
                  🗑 Очистити
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Input Data */}
        <section className="mb-8 overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          <div className="border-l-4 border-l-input-accent">
            <div className="p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Вхідні дані</h2>
                  <p className="text-xs uppercase tracking-wider text-muted">{tabLabels[activeTab]}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={handleSaveDraft} className="btn-secondary text-xs">
                    💾 Чернетку
                  </button>
                  <button onClick={handleRestoreDraft} className="btn-secondary text-xs">
                    🔄 Відновити
                  </button>
                  <button onClick={handleClearForm} className="btn-danger text-xs">
                    🗑 Очистити форму
                  </button>
                </div>
              </div>

              {/* Test Cases Form */}
              {activeTab === "testcases" && (
                <div className="space-y-5">
                  <InputField
                    label="Назва фічі"
                    value={testCaseFields.feature_title}
                    onChange={(v) => updateTestCaseField("feature_title", v)}
                    placeholder="Наприклад: Авторизація через Google"
                    required
                    error={validationErrors.feature_title}
                  />
                  <TextareaField
                    label="Опис фічі"
                    value={testCaseFields.feature_description}
                    onChange={(v) => updateTestCaseField("feature_description", v)}
                    placeholder="Детальний опис функціоналу, який потрібно протестувати..."
                  />
                  <TextareaField
                    label="Acceptance Criteria"
                    value={testCaseFields.acceptance_criteria}
                    onChange={(v) => updateTestCaseField("acceptance_criteria", v)}
                    placeholder="Критерії прийняття у форматі Given/When/Then або списком..."
                  />
                  <InputField
                    label="Ролі користувачів"
                    value={testCaseFields.user_roles}
                    onChange={(v) => updateTestCaseField("user_roles", v)}
                    placeholder="Наприклад: Admin, User, Guest"
                  />
                  <TextareaField
                    label="In scope"
                    value={testCaseFields.in_scope}
                    onChange={(v) => updateTestCaseField("in_scope", v)}
                    placeholder="Що входить у scope тестування..."
                  />
                  <TextareaField
                    label="Out of scope"
                    value={testCaseFields.out_of_scope}
                    onChange={(v) => updateTestCaseField("out_of_scope", v)}
                    placeholder="Що НЕ входить у scope тестування..."
                  />
                  <TextareaField
                    label="Нотатки по тест-даним"
                    value={testCaseFields.test_data_notes}
                    onChange={(v) => updateTestCaseField("test_data_notes", v)}
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
                    value={testCaseFields.priority_focus}
                    onChange={(v) => updateTestCaseField("priority_focus", v)}
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
                    value={bugReportFields.where_happened}
                    onChange={(v) => updateBugReportField("where_happened", v)}
                    placeholder="Сторінка, модуль, компонент..."
                    required
                    error={validationErrors.where_happened}
                  />
                  <TextareaField
                    label="Що сталося"
                    value={bugReportFields.what_happened}
                    onChange={(v) => updateBugReportField("what_happened", v)}
                    placeholder="Короткий опис проблеми..."
                  />
                  <TextareaField
                    label="Кроки (чернетка)"
                    value={bugReportFields.steps_draft}
                    onChange={(v) => updateBugReportField("steps_draft", v)}
                    placeholder="1. Відкрити сторінку...&#10;2. Натиснути на кнопку...&#10;3. Ввести дані..."
                  />
                  <TextareaField
                    label="Очікуваний результат"
                    value={bugReportFields.expected_result}
                    onChange={(v) => updateBugReportField("expected_result", v)}
                    placeholder="Що мало статися..."
                  />
                  <TextareaField
                    label="Фактичний результат"
                    value={bugReportFields.actual_result}
                    onChange={(v) => updateBugReportField("actual_result", v)}
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
                      value={bugReportFields.severity_hint}
                      onChange={(v) => updateBugReportField("severity_hint", v)}
                      placeholder="Critical, Major, Minor..."
                    />
                    <InputField
                      label="Priority hint"
                      value={bugReportFields.priority_hint}
                      onChange={(v) => updateBugReportField("priority_hint", v)}
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
                        value={bugReportFields.app_version}
                        onChange={(v) => updateBugReportField("app_version", v)}
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
                    value={bugReportFields.logs_stacktrace}
                    onChange={(v) => updateBugReportField("logs_stacktrace", v)}
                    placeholder="Вставте логи або stacktrace..."
                  />
                  <InputField
                    label="Attachments available"
                    value={bugReportFields.attachments_available}
                    onChange={(v) => updateBugReportField("attachments_available", v)}
                    placeholder="Screenshot, Video, HAR..."
                  />
                  <TextareaField
                    label="Додаткові нотатки"
                    value={bugReportFields.additional_notes}
                    onChange={(v) => updateBugReportField("additional_notes", v)}
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
                      value={apiTestFields.http_method}
                      onChange={(v) => updateApiTestField("http_method", v)}
                      placeholder="GET, POST, PUT, DELETE..."
                    />
                    <InputField
                      label="Endpoint path"
                      value={apiTestFields.endpoint_path}
                      onChange={(v) => updateApiTestField("endpoint_path", v)}
                      placeholder="/api/v1/users/{id}"
                      required
                      error={validationErrors.endpoint_path}
                    />
                  </div>
                  <TextareaField
                    label="Призначення endpoint"
                    value={apiTestFields.endpoint_purpose}
                    onChange={(v) => updateApiTestField("endpoint_purpose", v)}
                    placeholder="Опис що робить цей endpoint..."
                  />
                  <InputField
                    label="Auth type"
                    value={apiTestFields.auth_type}
                    onChange={(v) => updateApiTestField("auth_type", v)}
                    placeholder="Bearer token, API key, OAuth2..."
                  />
                  <TextareaField
                    label="Roles/permissions"
                    value={apiTestFields.roles_permissions}
                    onChange={(v) => updateApiTestField("roles_permissions", v)}
                    placeholder="Які ролі мають доступ до endpoint..."
                  />
                  <TextareaField
                    label="Request schema/example JSON"
                    value={apiTestFields.request_schema}
                    onChange={(v) => updateApiTestField("request_schema", v)}
                    placeholder='{"name": "string", "email": "string"}'
                  />
                  <TextareaField
                    label="Response schema/example JSON"
                    value={apiTestFields.response_schema}
                    onChange={(v) => updateApiTestField("response_schema", v)}
                    placeholder='{"id": 1, "name": "string", "created_at": "ISO8601"}'
                  />
                  <InputField
                    label="Відомі статус-коди"
                    value={apiTestFields.status_codes}
                    onChange={(v) => updateApiTestField("status_codes", v)}
                    placeholder="200, 201, 400, 401, 404, 500..."
                  />
                  <TextareaField
                    label="Pagination/sorting"
                    value={apiTestFields.pagination_sorting}
                    onChange={(v) => updateApiTestField("pagination_sorting", v)}
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
                    value={apiTestFields.rate_limits}
                    onChange={(v) => updateApiTestField("rate_limits", v)}
                    placeholder="Обмеження по кількості запитів..."
                  />
                  <TextareaField
                    label="Data constraints"
                    value={apiTestFields.data_constraints}
                    onChange={(v) => updateApiTestField("data_constraints", v)}
                    placeholder="Валідація, обмеження полів..."
                  />
                  <TextareaField
                    label="Related endpoints"
                    value={apiTestFields.related_endpoints}
                    onChange={(v) => updateApiTestField("related_endpoints", v)}
                    placeholder="Пов'язані endpoints для інтеграційних тестів..."
                  />
                </div>
              )}

              {/* Generate Button Row */}
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="group relative flex min-w-[200px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
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
                {result && (
                  <button onClick={handleClearResult} className="btn-secondary">
                    🗑 Очистити результат
                  </button>
                )}
              </div>

              {/* Error Message */}
              {errorText && (
                <div className="mt-4 animate-fade-in rounded-xl border border-error/30 bg-error/10 p-4">
                  <p className="mb-2 text-sm font-medium text-error">{errorText}</p>
                  <button
                    onClick={handleGenerate}
                    className="text-sm text-error underline hover:no-underline"
                  >
                    🔄 Спробувати ще раз
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 3: Result */}
        <section ref={resultRef} className="mb-8 overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          <div className="border-l-4 border-l-result-accent">
            <div className="p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-foreground">Результат</h2>
                  {resultMode && (
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-result-accent/20 px-2 py-1 text-xs font-medium text-result-accent">
                        {tabIcons[resultMode]} {tabLabels[resultMode]}
                      </span>
                      {resultTimestamp && (
                        <span className="text-xs text-muted">
                          {formatTimestamp(resultTimestamp)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={handleCopyJson} disabled={!result} className="btn-secondary disabled:opacity-50">
                    <Copy className="h-4 w-4" />
                    <span>JSON</span>
                  </button>
                  <button onClick={handleCopyMarkdown} disabled={!result} className="btn-secondary disabled:opacity-50">
                    <FileText className="h-4 w-4" />
                    <span>Markdown</span>
                  </button>
                </div>
              </div>

              {/* Loading skeleton */}
              {isLoading && (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-12 animate-pulse rounded-lg bg-input" />
                  ))}
                </div>
              )}

              {/* Result Display */}
              {!isLoading && result && resultMode === "testcases" && (
                <TestCasesResultView
                  data={result as TestCasesResult}
                  filter={testCaseFilter}
                  onFilterChange={setTestCaseFilter}
                  expandedId={expandedTestCase}
                  onToggleExpand={setExpandedTestCase}
                  getFilteredTestCases={getFilteredTestCases}
                />
              )}

              {!isLoading && result && resultMode === "bugreport" && (
                <BugReportResultView data={result as BugReportResult} />
              )}

              {!isLoading && result && resultMode === "api_ideas" && (
                <ApiIdeasResultView
                  data={result as ApiIdeasResult}
                  expandedIdeas={expandedApiIdeas}
                  onToggleIdea={(idx) => setExpandedApiIdeas((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                />
              )}

              {/* Empty State */}
              {!isLoading && !result && (
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

        {/* Section 4: History Panel */}
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          <div className="border-l-4 border-l-warning">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <button
                  onClick={() => setHistoryOpen(!historyOpen)}
                  className="flex items-center gap-2 text-lg font-bold text-foreground hover:text-primary transition-colors"
                >
                  {historyOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  <Clock className="h-5 w-5" />
                  <span>Останні генерації</span>
                </button>
                {historyItems.length > 0 && (
                  <button onClick={handleClearHistory} className="btn-danger text-xs">
                    Очистити все
                  </button>
                )}
              </div>

              {historyOpen && (
                <div className="space-y-3">
                  {historyItems.length === 0 ? (
                    <p className="text-sm text-muted">Історія порожня</p>
                  ) : (
                    historyItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-xl border border-border bg-input/50 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{tabIcons[item.mode]}</span>
                          <div>
                            <p className="text-sm font-medium text-foreground">{getPreviewText(item)}</p>
                            <p className="text-xs text-muted">{formatTimestamp(item.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewHistoryItem(item)}
                            className="rounded-lg p-2 text-muted hover:bg-card hover:text-foreground transition-colors"
                            title="Переглянути"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteHistoryItem(item.id)}
                            className="rounded-lg p-2 text-muted hover:bg-error/20 hover:text-error transition-colors"
                            title="Видалити"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                  {historyItems.length > 0 && (
                    <Link href="/history" className="block text-center text-sm text-primary hover:underline">
                      Переглянути всю історію
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <style jsx global>{`
        .btn-secondary {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 0.75rem;
          border: 1px solid var(--border);
          background: var(--card);
          color: var(--foreground);
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
        }
        .btn-secondary:hover {
          border-color: var(--primary);
          background: var(--input);
        }
        .btn-danger {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 0.75rem;
          border: 1px solid var(--error);
          background: transparent;
          color: var(--error);
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
        }
        .btn-danger:hover {
          background: var(--error);
          color: white;
        }
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// ========================
// Result View Components
// ========================

function TestCasesResultView({
  data,
  filter,
  onFilterChange,
  expandedId,
  onToggleExpand,
  getFilteredTestCases,
}: {
  data: TestCasesResult;
  filter: "all" | "positive" | "negative" | "high-priority";
  onFilterChange: (f: "all" | "positive" | "negative" | "high-priority") => void;
  expandedId: string | null;
  onToggleExpand: (id: string | null) => void;
  getFilteredTestCases: (tc: TestCasesResult["test_cases"]) => TestCasesResult["test_cases"];
}) {
  const filtered = getFilteredTestCases(data.test_cases || []);

  return (
    <div className="animate-fade-in space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-foreground">{data.feature || "Тест-кейси"}</h3>
        <span className="rounded-full bg-primary/20 px-3 py-1 text-sm font-medium text-primary">
          Тест-кейсів: {data.test_cases?.length || 0}
        </span>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {(["all", "positive", "negative", "high-priority"] as const).map((f) => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              filter === f
                ? "bg-primary text-white"
                : "bg-input text-muted hover:bg-card hover:text-foreground"
            }`}
          >
            {f === "all" && "Всі"}
            {f === "positive" && "Positive"}
            {f === "negative" && "Negative"}
            {f === "high-priority" && "P0-P1"}
          </button>
        ))}
      </div>

      {/* Test cases table */}
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-input">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">Пріоритет</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">Тип</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">Назва</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((tc) => (
              <>
                <tr
                  key={tc.id}
                  className="cursor-pointer hover:bg-input/50 transition-colors"
                  onClick={() => onToggleExpand(expandedId === tc.id ? null : tc.id)}
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted">{tc.id}</td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={tc.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <TypeBadge type={tc.type} />
                  </td>
                  <td className="px-4 py-3 text-foreground">{tc.title}</td>
                  <td className="px-4 py-3">
                    {expandedId === tc.id ? (
                      <ChevronDown className="h-4 w-4 text-muted" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted" />
                    )}
                  </td>
                </tr>
                {expandedId === tc.id && (
                  <tr key={`${tc.id}-details`}>
                    <td colSpan={5} className="bg-input/30 px-4 py-4">
                      <div className="space-y-3">
                        {tc.preconditions?.length > 0 && (
                          <div>
                            <span className="text-xs font-medium uppercase text-muted">Передумови:</span>
                            <ul className="mt-1 list-disc pl-5 text-sm text-foreground">
                              {tc.preconditions.map((p, i) => <li key={i}>{p}</li>)}
                            </ul>
                          </div>
                        )}
                        {tc.steps?.length > 0 && (
                          <div>
                            <span className="text-xs font-medium uppercase text-muted">Кроки:</span>
                            <ol className="mt-1 list-decimal pl-5 text-sm text-foreground">
                              {tc.steps.map((s, i) => <li key={i}>{s}</li>)}
                            </ol>
                          </div>
                        )}
                        <div>
                          <span className="text-xs font-medium uppercase text-muted">Очікуваний результат:</span>
                          <p className="mt-1 text-sm text-foreground">{tc.expected}</p>
                        </div>
                        {tc.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {tc.tags.map((tag, i) => (
                              <span key={i} className="rounded bg-card px-2 py-0.5 text-xs text-muted">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Assumptions */}
      {data.assumptions?.length > 0 && (
        <div className="rounded-xl border border-border bg-input/30 p-4">
          <h4 className="mb-2 text-xs font-medium uppercase text-muted">Припущення</h4>
          <ul className="list-disc pl-5 text-sm text-foreground">
            {data.assumptions.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}

      {/* Coverage notes */}
      {data.coverage_notes?.length > 0 && (
        <div className="rounded-xl border border-border bg-input/30 p-4">
          <h4 className="mb-2 text-xs font-medium uppercase text-muted">Примітки щодо покриття</h4>
          <ul className="list-disc pl-5 text-sm text-foreground">
            {data.coverage_notes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </div>
      )}

      {/* Missing information */}
      {data.missing_information?.length > 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
          <h4 className="mb-2 text-xs font-medium uppercase text-warning">Відсутня інформація</h4>
          <ul className="list-disc pl-5 text-sm text-warning">
            {data.missing_information.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function BugReportResultView({ data }: { data: BugReportResult }) {
  return (
    <div className="animate-fade-in space-y-4">
      {/* Summary */}
      <h3 className="text-xl font-bold text-foreground">{data.summary}</h3>

      {/* Severity & Priority badges */}
      <div className="flex gap-2">
        <SeverityBadge severity={data.severity} />
        <PriorityBadge priority={data.priority} />
      </div>

      {/* Environment */}
      {data.environment && (
        <div className="rounded-xl border border-border bg-input/30 p-4">
          <h4 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase text-muted">
            <span>🌍</span> Environment
          </h4>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            <div><span className="text-xs text-muted">App Version:</span> <span className="text-sm text-foreground">{data.environment.app_version || "N/A"}</span></div>
            <div><span className="text-xs text-muted">OS:</span> <span className="text-sm text-foreground">{data.environment.os || "N/A"}</span></div>
            <div><span className="text-xs text-muted">Browser:</span> <span className="text-sm text-foreground">{data.environment.browser || "N/A"}</span></div>
            <div><span className="text-xs text-muted">Device:</span> <span className="text-sm text-foreground">{data.environment.device || "N/A"}</span></div>
            <div><span className="text-xs text-muted">Env:</span> <span className="text-sm text-foreground">{data.environment.env || "UNKNOWN"}</span></div>
          </div>
        </div>
      )}

      {/* Preconditions */}
      {data.preconditions?.length > 0 && (
        <div className="rounded-xl border border-border bg-input/30 p-4">
          <h4 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase text-muted">
            <span>📋</span> Передумови
          </h4>
          <ul className="list-disc pl-5 text-sm text-foreground">
            {data.preconditions.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
      )}

      {/* Steps to reproduce */}
      {data.steps_to_reproduce?.length > 0 && (
        <div className="rounded-xl border border-border bg-input/30 p-4">
          <h4 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase text-muted">
            <span>🔢</span> Кроки для відтворення
          </h4>
          <ol className="list-decimal pl-5 text-sm text-foreground">
            {data.steps_to_reproduce.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </div>
      )}

      {/* Actual vs Expected */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border-l-4 border-l-error border border-border bg-input/30 p-4">
          <h4 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase text-error">
            <span>❌</span> Фактичний результат
          </h4>
          <p className="text-sm text-foreground">{data.actual_result}</p>
        </div>
        <div className="rounded-xl border-l-4 border-l-success border border-border bg-input/30 p-4">
          <h4 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase text-success">
            <span>✅</span> Очікуваний результат
          </h4>
          <p className="text-sm text-foreground">{data.expected_result}</p>
        </div>
      </div>

      {/* Suspected area */}
      {data.suspected_area && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">🔍 Підозрювана область:</span>
          <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent">
            {data.suspected_area}
          </span>
        </div>
      )}

      {/* Attachments suggestions */}
      {data.attachments_suggestions?.length > 0 && (
        <div className="rounded-xl border border-border bg-input/30 p-4">
          <h4 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase text-muted">
            <span>📎</span> Рекомендовані вкладення
          </h4>
          <ul className="list-disc pl-5 text-sm text-foreground">
            {data.attachments_suggestions.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}

      {/* Missing information */}
      {data.missing_information?.length > 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
          <h4 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase text-warning">
            <span>❓</span> Відсутня інформація
          </h4>
          <ul className="list-disc pl-5 text-sm text-warning">
            {data.missing_information.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function ApiIdeasResultView({
  data,
  expandedIdeas,
  onToggleIdea,
}: {
  data: ApiIdeasResult;
  expandedIdeas: Record<number, boolean>;
  onToggleIdea: (idx: number) => void;
}) {
  return (
    <div className="animate-fade-in space-y-4">
      {/* Endpoint header */}
      <div className="flex flex-wrap items-center gap-3">
        <MethodBadge method={data.endpoint?.method || "UNKNOWN"} />
        <code className="text-lg font-semibold text-foreground">{data.endpoint?.path || "/endpoint"}</code>
      </div>
      {data.endpoint?.description && (
        <p className="text-sm text-muted">{data.endpoint.description}</p>
      )}

      {/* Preconditions */}
      {data.preconditions?.length > 0 && (
        <div className="rounded-xl border border-border bg-input/30 p-4">
          <h4 className="mb-2 text-xs font-medium uppercase text-muted">Передумови</h4>
          <ul className="list-disc pl-5 text-sm text-foreground">
            {data.preconditions.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
      )}

      {/* Happy path */}
      {data.happy_path && (
        <div className="rounded-xl border border-success/30 bg-success/5 p-4">
          <h4 className="mb-3 text-xs font-medium uppercase text-success">Happy Path</h4>
          <div className="overflow-x-auto rounded-lg bg-code-bg p-3">
            <pre className="font-mono text-xs text-foreground whitespace-pre-wrap">
              {data.happy_path.request_example || "# No example"}
            </pre>
          </div>
          {data.happy_path.checks?.length > 0 && (
            <div className="mt-3">
              <span className="text-xs text-muted">Перевірки:</span>
              <ul className="mt-1 list-disc pl-5 text-sm text-foreground">
                {data.happy_path.checks.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Test ideas */}
      {data.test_ideas?.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium uppercase text-muted">Тест-ідеї ({data.test_ideas.length})</h4>
          {data.test_ideas.map((idea, idx) => (
            <div key={idx} className="rounded-xl border border-border bg-input/30 overflow-hidden">
              <button
                onClick={() => onToggleIdea(idx)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-input/50 transition-colors"
              >
                <span className="font-medium text-foreground">{idea.name}</span>
                {expandedIdeas[idx] ? (
                  <ChevronDown className="h-4 w-4 text-muted" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted" />
                )}
              </button>
              {expandedIdeas[idx] && (
                <div className="border-t border-border p-4 space-y-3">
                  <div className="overflow-x-auto rounded-lg bg-code-bg p-3">
                    <pre className="font-mono text-xs text-foreground whitespace-pre-wrap">
                      {idea.request_example || "# No example"}
                    </pre>
                  </div>
                  {idea.checks?.length > 0 && (
                    <div>
                      <span className="text-xs text-muted">Перевірки:</span>
                      <ul className="mt-1 list-disc pl-5 text-sm text-foreground">
                        {idea.checks.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                  )}
                  {idea.negative_cases?.length > 0 && (
                    <div>
                      <span className="text-xs text-error">Негативні кейси:</span>
                      <ul className="mt-1 list-disc pl-5 text-sm text-foreground">
                        {idea.negative_cases.map((n, i) => <li key={i}>{n}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Test data suggestions */}
      {data.test_data_suggestions?.length > 0 && (
        <div className="rounded-xl border border-border bg-input/30 p-4">
          <h4 className="mb-2 text-xs font-medium uppercase text-muted">Пропозиції тестових даних</h4>
          <ul className="list-disc pl-5 text-sm text-foreground">
            {data.test_data_suggestions.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}

      {/* Missing information */}
      {data.missing_information?.length > 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
          <h4 className="mb-2 text-xs font-medium uppercase text-warning">Відсутня інформація</h4>
          <ul className="list-disc pl-5 text-sm text-warning">
            {data.missing_information.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

// ========================
// Badge Components
// ========================

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    P0: "bg-error/20 text-error",
    P1: "bg-warning/20 text-warning",
    P2: "bg-yellow-500/20 text-yellow-400",
    P3: "bg-muted/20 text-muted",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${colors[priority] || colors.P3}`}>
      {priority}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
      type === "positive" ? "bg-success/20 text-success" : "bg-error/20 text-error"
    }`}>
      {type}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    "S1 Blocker": "bg-error/20 text-error",
    "S2 Critical": "bg-warning/20 text-warning",
    "S3 Major": "bg-yellow-500/20 text-yellow-400",
    "S4 Minor": "bg-muted/20 text-muted",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${colors[severity] || colors["S4 Minor"]}`}>
      {severity}
    </span>
  );
}

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-success/20 text-success",
    POST: "bg-primary/20 text-primary",
    PUT: "bg-warning/20 text-warning",
    PATCH: "bg-yellow-500/20 text-yellow-400",
    DELETE: "bg-error/20 text-error",
  };
  return (
    <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${colors[method] || "bg-muted/20 text-muted"}`}>
      {method}
    </span>
  );
}

// ========================
// Form Field Components
// ========================

function InputField({
  label,
  value,
  onChange,
  placeholder = "",
  required = false,
  error = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted">
        {label}
        {required && <span className="text-error">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border bg-input px-4 py-2.5 text-sm text-foreground placeholder-muted/60 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 ${
          error ? "border-error focus:border-error" : "border-input-border focus:border-primary"
        }`}
      />
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder = "",
  required = false,
  error = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}) {
  const lineCount = value.split("\n").length;

  return (
    <div>
      <label className="mb-2 flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted">
        {label}
        {required && <span className="text-error">*</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className={`w-full resize-y rounded-xl border bg-input px-4 py-2.5 text-sm text-foreground placeholder-muted/60 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 ${
          error ? "border-error focus:border-error" : "border-input-border focus:border-primary"
        }`}
      />
      <div className="mt-1 flex justify-between text-xs text-muted/70">
        {error ? <span className="text-error">{error}</span> : <span />}
        <div className="flex gap-3">
          <span>{value.length} символів</span>
          <span>{lineCount} {lineCount === 1 ? "рядок" : lineCount < 5 ? "рядки" : "рядків"}</span>
        </div>
      </div>
    </div>
  );
}

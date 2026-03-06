"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Mode, HistoryItem, TestCasesResult, BugReportResult, ApiIdeasResult } from "@/lib/types";
import { loadHistory, removeHistoryItem, clearHistory } from "@/lib/history";
import { resultToMarkdown } from "@/lib/markdown";
import { ArrowLeft, Trash2, Eye, X, Copy, FileText, Check } from "lucide-react";

const tabLabels: Record<Mode, string> = {
  testcases: "Тест-кейси",
  bugreport: "Баг-репорт",
  api_ideas: "API тест-ідеї",
};

const tabIcons: Record<Mode, string> = {
  testcases: "🧪",
  bugreport: "🐛",
  api_ideas: "🔌",
};

const modeColors: Record<Mode, string> = {
  testcases: "border-l-primary",
  bugreport: "border-l-error",
  api_ideas: "border-l-accent",
};

type FilterMode = "all" | Mode;

export default function HistoryPage() {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>(() => loadHistory());
  const [filter, setFilter] = useState<FilterMode>("all");
  const [viewingItem, setViewingItem] = useState<HistoryItem | null>(null);
  const [jsonCopied, setJsonCopied] = useState(false);
  const [mdCopied, setMdCopied] = useState(false);

  const filteredItems = filter === "all"
    ? historyItems
    : historyItems.filter((item) => item.mode === filter);

  const handleDelete = (id: string) => {
    removeHistoryItem(id);
    setHistoryItems(loadHistory());
  };

  const handleClearAll = () => {
    if (confirm("Очистити всю історію генерацій?")) {
      clearHistory();
      setHistoryItems([]);
    }
  };

  const handleView = (item: HistoryItem) => {
    setViewingItem(item);
  };

  const handleCloseModal = () => {
    setViewingItem(null);
    setJsonCopied(false);
    setMdCopied(false);
  };

  const handleCopyJson = async () => {
    if (!viewingItem) return;
    await navigator.clipboard.writeText(JSON.stringify(viewingItem.output, null, 2));
    setJsonCopied(true);
    setTimeout(() => setJsonCopied(false), 2000);
  };

  const handleCopyMarkdown = async () => {
    if (!viewingItem) return;
    const md = resultToMarkdown(viewingItem.mode, viewingItem.output);
    await navigator.clipboard.writeText(md);
    setMdCopied(true);
    setTimeout(() => setMdCopied(false), 2000);
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
    if (item.mode === "testcases") return String(fields.feature_title || fields.featureName || "Без назви");
    if (item.mode === "bugreport") return String(fields.where_happened || fields.where || "Без локації");
    return String(fields.endpoint_path || fields.endpointPath || "/endpoint");
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseModal();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/assistant"
            className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Назад до асистента</span>
          </Link>
          {historyItems.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 rounded-xl border border-error bg-transparent px-3 py-2 text-sm font-medium text-error transition-all hover:bg-error hover:text-white"
            >
              <Trash2 className="h-4 w-4" />
              Очистити все
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="mb-2 text-2xl font-bold text-foreground">Історія генерацій</h1>
        <p className="mb-6 text-sm text-muted">
          Переглядайте та керуйте результатами попередніх генерацій
        </p>

        {/* Filter tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {(["all", "testcases", "bugreport", "api_ideas"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                filter === f
                  ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg"
                  : "bg-card text-muted hover:bg-input hover:text-foreground"
              }`}
            >
              {f === "all" && "Всі"}
              {f === "testcases" && `${tabIcons.testcases} Тест-кейси`}
              {f === "bugreport" && `${tabIcons.bugreport} Баг-репорти`}
              {f === "api_ideas" && `${tabIcons.api_ideas} API ідеї`}
            </button>
          ))}
        </div>

        {/* History list */}
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-input">
              <FileText className="h-8 w-8 text-muted" />
            </div>
            <p className="mb-4 text-center text-sm text-muted">
              {filter === "all" ? "Історія порожня" : `Немає записів для ${tabLabels[filter as Mode]}`}
            </p>
            <Link
              href="/assistant"
              className="text-sm text-primary hover:underline"
            >
              Перейти до асистента
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between rounded-xl border border-border bg-card p-4 border-l-4 ${modeColors[item.mode]}`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{tabIcons[item.mode]}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-input px-2 py-0.5 text-xs font-medium text-muted">
                        {tabLabels[item.mode]}
                      </span>
                      <span className="text-xs text-muted">{formatTimestamp(item.created_at)}</span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-foreground">{getPreviewText(item)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleView(item)}
                    className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-input hover:text-foreground"
                  >
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">Переглянути</span>
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="rounded-lg p-2 text-muted transition-colors hover:bg-error/20 hover:text-error"
                    title="Видалити"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* View Modal */}
      {viewingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={handleCloseModal}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{tabIcons[viewingItem.mode]}</span>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{tabLabels[viewingItem.mode]}</h2>
                  <p className="text-xs text-muted">{formatTimestamp(viewingItem.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyJson}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-input"
                >
                  {jsonCopied ? (
                    <>
                      <Check className="h-4 w-4 text-success" />
                      <span className="text-success">JSON</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      JSON
                    </>
                  )}
                </button>
                <button
                  onClick={handleCopyMarkdown}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-input"
                >
                  {mdCopied ? (
                    <>
                      <Check className="h-4 w-4 text-success" />
                      <span className="text-success">MD</span>
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      MD
                    </>
                  )}
                </button>
                <button
                  onClick={handleCloseModal}
                  className="rounded-lg p-2 text-muted transition-colors hover:bg-input hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal content */}
            <div className="max-h-[70vh] overflow-auto p-6">
              {viewingItem.mode === "testcases" && (
                <TestCasesView data={viewingItem.output as TestCasesResult} />
              )}
              {viewingItem.mode === "bugreport" && (
                <BugReportView data={viewingItem.output as BugReportResult} />
              )}
              {viewingItem.mode === "api_ideas" && (
                <ApiIdeasView data={viewingItem.output as ApiIdeasResult} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ========================
// Result View Components
// ========================

function TestCasesView({ data }: { data: TestCasesResult }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">{data.feature || "Тест-кейси"}</h3>
      
      {data.assumptions?.length > 0 && (
        <div className="rounded-xl bg-input/50 p-4">
          <h4 className="mb-2 text-xs font-medium uppercase text-muted">Припущення</h4>
          <ul className="list-disc pl-5 text-sm text-foreground">
            {data.assumptions.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        {data.test_cases?.map((tc) => (
          <div key={tc.id} className="rounded-xl border border-border bg-input/30 p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="font-mono text-xs text-muted">{tc.id}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                tc.priority === "P0" ? "bg-error/20 text-error" :
                tc.priority === "P1" ? "bg-warning/20 text-warning" :
                "bg-muted/20 text-muted"
              }`}>{tc.priority}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                tc.type === "positive" ? "bg-success/20 text-success" : "bg-error/20 text-error"
              }`}>{tc.type}</span>
            </div>
            <h4 className="mb-2 font-medium text-foreground">{tc.title}</h4>
            
            {tc.preconditions?.length > 0 && (
              <div className="mb-2">
                <span className="text-xs text-muted">Передумови: </span>
                <span className="text-sm text-foreground">{tc.preconditions.join("; ")}</span>
              </div>
            )}
            
            {tc.steps?.length > 0 && (
              <ol className="mb-2 list-decimal pl-5 text-sm text-foreground">
                {tc.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            )}
            
            <div className="text-sm">
              <span className="text-success">Очікувано: </span>
              <span className="text-foreground">{tc.expected}</span>
            </div>
          </div>
        ))}
      </div>

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

function BugReportView({ data }: { data: BugReportResult }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">{data.summary}</h3>
      
      <div className="flex gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
          data.severity === "S1 Blocker" ? "bg-error/20 text-error" :
          data.severity === "S2 Critical" ? "bg-warning/20 text-warning" :
          "bg-muted/20 text-muted"
        }`}>{data.severity}</span>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
          data.priority === "P0" ? "bg-error/20 text-error" :
          data.priority === "P1" ? "bg-warning/20 text-warning" :
          "bg-muted/20 text-muted"
        }`}>{data.priority}</span>
      </div>

      {data.environment && (
        <div className="rounded-xl bg-input/50 p-4">
          <h4 className="mb-2 text-xs font-medium uppercase text-muted">Environment</h4>
          <div className="grid gap-2 sm:grid-cols-2 text-sm">
            <div><span className="text-muted">App:</span> <span className="text-foreground">{data.environment.app_version}</span></div>
            <div><span className="text-muted">OS:</span> <span className="text-foreground">{data.environment.os}</span></div>
            <div><span className="text-muted">Browser:</span> <span className="text-foreground">{data.environment.browser}</span></div>
            <div><span className="text-muted">Device:</span> <span className="text-foreground">{data.environment.device}</span></div>
          </div>
        </div>
      )}

      {data.steps_to_reproduce?.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-medium uppercase text-muted">Кроки для відтворення</h4>
          <ol className="list-decimal pl-5 text-sm text-foreground">
            {data.steps_to_reproduce.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border-l-4 border-l-error border border-border p-4">
          <h4 className="mb-2 text-xs font-medium uppercase text-error">Фактичний результат</h4>
          <p className="text-sm text-foreground">{data.actual_result}</p>
        </div>
        <div className="rounded-xl border-l-4 border-l-success border border-border p-4">
          <h4 className="mb-2 text-xs font-medium uppercase text-success">Очікуваний результат</h4>
          <p className="text-sm text-foreground">{data.expected_result}</p>
        </div>
      </div>

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

function ApiIdeasView({ data }: { data: ApiIdeasResult }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className={`rounded-lg px-3 py-1 text-xs font-bold ${
          data.endpoint?.method === "GET" ? "bg-success/20 text-success" :
          data.endpoint?.method === "POST" ? "bg-primary/20 text-primary" :
          data.endpoint?.method === "DELETE" ? "bg-error/20 text-error" :
          "bg-warning/20 text-warning"
        }`}>{data.endpoint?.method}</span>
        <code className="text-lg font-semibold text-foreground">{data.endpoint?.path}</code>
      </div>
      
      {data.endpoint?.description && (
        <p className="text-sm text-muted">{data.endpoint.description}</p>
      )}

      {data.happy_path && (
        <div className="rounded-xl border border-success/30 bg-success/5 p-4">
          <h4 className="mb-2 text-xs font-medium uppercase text-success">Happy Path</h4>
          <pre className="overflow-x-auto rounded-lg bg-code-bg p-3 font-mono text-xs text-foreground">
            {data.happy_path.request_example}
          </pre>
          {data.happy_path.checks?.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-sm text-foreground">
              {data.happy_path.checks.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          )}
        </div>
      )}

      {data.test_ideas?.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-medium uppercase text-muted">Тест-ідеї</h4>
          {data.test_ideas.map((idea, i) => (
            <div key={i} className="rounded-xl bg-input/50 p-4">
              <h5 className="mb-2 font-medium text-foreground">{idea.name}</h5>
              <pre className="mb-2 overflow-x-auto rounded-lg bg-code-bg p-3 font-mono text-xs text-foreground">
                {idea.request_example}
              </pre>
              {idea.checks?.length > 0 && (
                <ul className="list-disc pl-5 text-sm text-foreground">
                  {idea.checks.map((c, j) => <li key={j}>{c}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

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

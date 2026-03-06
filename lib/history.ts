import type { HistoryItem, Mode } from "./types";

const HISTORY_KEY = "qa_assistant_history_v1";
const CONTEXT_KEY = "qa_assistant_project_context_v1";
const DRAFT_KEY = "qa_assistant_draft_v1";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function loadHistory(): HistoryItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistory(items: HistoryItem[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage errors
  }
}

export function addHistoryItem(item: HistoryItem): void {
  if (!isBrowser()) return;
  try {
    const items = loadHistory();
    items.unshift(item);
    // Keep max 50 items
    if (items.length > 50) {
      items.length = 50;
    }
    saveHistory(items);
  } catch {
    // Ignore errors
  }
}

export function clearHistory(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // Ignore errors
  }
}

export function removeHistoryItem(id: string): void {
  if (!isBrowser()) return;
  try {
    const items = loadHistory();
    const filtered = items.filter((item) => item.id !== id);
    saveHistory(filtered);
  } catch {
    // Ignore errors
  }
}

export function loadContext(): string {
  if (!isBrowser()) return "";
  try {
    return localStorage.getItem(CONTEXT_KEY) || "";
  } catch {
    return "";
  }
}

export function saveContext(ctx: string): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(CONTEXT_KEY, ctx);
  } catch {
    // Ignore errors
  }
}

export function loadDraft(): { mode: Mode; fields: Record<string, unknown> } | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { mode: Mode; fields: Record<string, unknown> };
  } catch {
    return null;
  }
}

export function saveDraft(mode: Mode, fields: Record<string, unknown>): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ mode, fields }));
  } catch {
    // Ignore errors
  }
}

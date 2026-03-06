import type { Mode } from "./types";

export type HistoryItem = {
  id: string;
  created_at: string; // ISO
  mode: Mode;
  input_fields: Record<string, unknown>;
  output: unknown;
};

const KEY = "qa_assistant_history_v1";

export function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistory(items: HistoryItem[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

export function addHistoryItem(item: HistoryItem) {
  const items = loadHistory();
  items.unshift(item);
  saveHistory(items.slice(0, 50));
}
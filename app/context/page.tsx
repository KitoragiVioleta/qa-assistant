"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { loadContext, saveContext } from "@/lib/history";
import { ArrowLeft, Save, Sparkles, Copy, Trash2, ChevronDown, ChevronRight, Check } from "lucide-react";

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
- Кошик зберігається 30 днів для Guest

Бізнес-правила:
- Мінімальна сума замовлення: 100 грн
- Безкоштовна доставка від 500 грн
- Максимум 99 товарів одного типу в кошику`;

const TIPS = [
  "Назва та тип продукту (web, mobile, API)",
  "Ролі користувачів та їх права",
  "Середовища (DEV / STAGE / PROD) та їх особливості",
  "Правила Severity та Priority для вашої команди",
  "Технічні обмеження (розміри файлів, формати, ліміти)",
  "Бізнес-правила та бізнес-логіка",
  "Інтеграції та залежності з іншими системами",
  "Критичні user flows які потрібно тестувати",
];

export default function ContextPage() {
  const [projectContext, setProjectContext] = useState(() => loadContext());
  const [autoSaveIndicator, setAutoSaveIndicator] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save with debounce
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

  const handleSave = () => {
    saveContext(projectContext);
    setAutoSaveIndicator(true);
    setTimeout(() => setAutoSaveIndicator(false), 2000);
  };

  const handleFillExample = () => {
    setProjectContext(EXAMPLE_CONTEXT);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(projectContext);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    if (confirm("Очистити контекст проєкту?")) {
      setProjectContext("");
      saveContext("");
    }
  };

  const lineCount = projectContext.split("\n").length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/assistant"
              className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Назад до асистента</span>
            </Link>
          </div>
          {autoSaveIndicator && (
            <span className="flex items-center gap-1 text-xs text-success animate-fade-in">
              <Check className="h-3 w-3" />
              Автозбережено
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="mb-2 text-2xl font-bold text-foreground">Контекст проєкту</h1>
        <p className="mb-6 text-sm text-muted">
          Опишіть контекст вашого проєкту детально. Ця інформація буде використовуватися
          для генерації більш точних тест-кейсів, баг-репортів та API тест-ідей.
        </p>

        {/* Textarea */}
        <div className="mb-4 overflow-hidden rounded-2xl border border-border bg-card">
          <textarea
            value={projectContext}
            onChange={(e) => setProjectContext(e.target.value)}
            placeholder="Введіть контекст проєкту: опис продукту, технічний стек, ролі користувачів, бізнес-логіка, обмеження..."
            className="min-h-[400px] w-full resize-y border-none bg-input px-4 py-4 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-0"
          />
          <div className="flex items-center justify-between border-t border-border bg-card px-4 py-2">
            <div className="flex gap-4 text-xs text-muted">
              <span>{projectContext.length} символів</span>
              <span>{lineCount} {lineCount === 1 ? "рядок" : lineCount < 5 ? "рядки" : "рядків"}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mb-8 flex flex-wrap gap-3">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] hover:shadow-xl"
          >
            <Save className="h-4 w-4" />
            Зберегти
          </button>
          <button
            onClick={handleFillExample}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:border-primary hover:bg-input"
          >
            <Sparkles className="h-4 w-4" />
            Приклад
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:border-primary hover:bg-input"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-success" />
                <span className="text-success">Скопійовано</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Скопіювати
              </>
            )}
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-2 rounded-xl border border-error bg-transparent px-4 py-2.5 text-sm font-medium text-error transition-all hover:bg-error hover:text-white"
          >
            <Trash2 className="h-4 w-4" />
            Очистити
          </button>
        </div>

        {/* Tips section */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <button
            onClick={() => setTipsOpen(!tipsOpen)}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-input transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              <span className="text-lg">💡</span>
              Що писати в контексті?
            </span>
            {tipsOpen ? (
              <ChevronDown className="h-5 w-5 text-muted" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted" />
            )}
          </button>
          {tipsOpen && (
            <div className="border-t border-border p-4">
              <ul className="space-y-2">
                {TIPS.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="text-primary">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

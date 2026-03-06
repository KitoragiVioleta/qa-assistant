"use client";

import { useState } from "react";
import Link from "next/link";

export default function ContextPage() {
  const [projectContext, setProjectContext] = useState("");

  const handleSave = () => {
    // Placeholder: persist context
    alert("Контекст збережено (placeholder)");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-foreground/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Контекст проєкту</h1>
          <Link
            href="/assistant"
            className="text-sm text-foreground/70 underline hover:text-foreground"
          >
            Назад до асистента
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-6">
        <p className="mb-4 text-sm text-foreground/70">
          Опишіть контекст вашого проєкту детально. Ця інформація буде використовуватися
          для генерації тест-кейсів, баг-репортів та API тест-ідей.
        </p>

        <textarea
          value={projectContext}
          onChange={(e) => setProjectContext(e.target.value)}
          placeholder="Введіть контекст проєкту: опис продукту, технічний стек, основні функції, бізнес-логіка тощо..."
          className="mb-4 h-96 w-full resize-y rounded border border-foreground/20 bg-background px-4 py-3 text-sm focus:border-foreground/40 focus:outline-none"
        />

        <button
          onClick={handleSave}
          className="rounded bg-foreground px-6 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Зберегти контекст
        </button>
      </main>
    </div>
  );
}

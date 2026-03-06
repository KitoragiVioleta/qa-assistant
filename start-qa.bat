@echo off
echo Запуск QA Асистента...

:: Запуск Ollama
start "Ollama" cmd /k "ollama serve"

:: Невелика пауза
timeout /t 3 /nobreak

:: Запуск Gateway
start "Gateway" cmd /k "cd /d D:\Users\bimzl\OneDrive\QA_Agent\qa-assistant\llm-gateway && set LLM_GATEWAY_TOKEN=qa-assistant-secret-2026 && set OLLAMA_BASE_URL=http://127.0.0.1:11434 && set PORT=8787 && npm run dev"

:: Невелика пауза
timeout /t 3 /nobreak

:: Запуск Next.js
start "QA Assistant" cmd /k "cd /d D:\Users\bimzl\OneDrive\QA_Agent\qa-assistant && npm run dev"

:: Відкрити браузер
timeout /t 5 /nobreak
start chrome http://localhost:3000

echo Готово! Відкриваю браузер...
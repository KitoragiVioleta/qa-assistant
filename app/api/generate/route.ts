import { NextResponse } from "next/server";
import type { GenerateRequest } from "@/lib/types";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/prompts";
import { llmChatViaGateway } from "@/lib/llmClient";

const LLM_GATEWAY_URL = process.env.LLM_GATEWAY_URL || "";
const LLM_GATEWAY_TOKEN = process.env.LLM_GATEWAY_TOKEN || "";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:7b-instruct";

function tryParseJson(raw: string) {
  return JSON.parse(raw.trim());
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GenerateRequest;

    if (!body?.mode || !body?.input?.fields) {
      return NextResponse.json(
        { error: { code: "VALIDATION_FAILED", message: "Invalid request body" } },
        { status: 400 }
      );
    }

    if (!LLM_GATEWAY_URL || !LLM_GATEWAY_TOKEN) {
      return NextResponse.json(
        { error: { code: "LLM_UNAVAILABLE", message: "Gateway not configured (set env vars on Vercel)" } },
        { status: 500 }
      );
    }

    const userPrompt = buildUserPrompt(body.mode, body.project_context || "", body.input.fields);

    let llm;
    try {
      llm = await llmChatViaGateway({
        gatewayUrl: LLM_GATEWAY_URL,
        token: LLM_GATEWAY_TOKEN,
        model: OLLAMA_MODEL,
        system: SYSTEM_PROMPT,
        user: userPrompt
      });
    } catch (e: any) {
      return NextResponse.json(
        { error: { code: "LLM_UNAVAILABLE", message: e?.message || "LLM unavailable" } },
        { status: 502 }
      );
    }

    const rawText = llm.message?.content ?? "";

    let result: unknown;
    try {
      result = tryParseJson(rawText);
    } catch {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_JSON",
            message: "Model returned non-JSON output",
            details: { raw: rawText.slice(0, 2000) }
          }
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      mode: body.mode,
      model: llm.model,
      created_at: llm.created_at,
      result,
      raw_llm_text: rawText
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: { code: "INTERNAL", message: e?.message || "Internal error" } },
      { status: 500 }
    );
  }
}
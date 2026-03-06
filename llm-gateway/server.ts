import { createServer, IncomingMessage, ServerResponse } from "node:http";

const PORT = parseInt(process.env.PORT || "8787", 10);
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const LLM_GATEWAY_TOKEN = process.env.LLM_GATEWAY_TOKEN;

if (!LLM_GATEWAY_TOKEN) {
  console.error("ERROR: LLM_GATEWAY_TOKEN environment variable is required");
  process.exit(1);
}

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type, authorization",
};

function sendJson(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { "content-type": "application/json", ...CORS_HEADERS });
  res.end(JSON.stringify(data));
}

async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

const server = createServer(async (req, res) => {
  const method = req.method || "GET";
  const url = req.url || "/";

  // Handle CORS preflight
  if (method === "OPTIONS") {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  // Only handle POST /ollama-chat
  if (method === "POST" && url === "/ollama-chat") {
    // Check authorization
    const authHeader = req.headers["authorization"] || "";
    if (authHeader !== `Bearer ${LLM_GATEWAY_TOKEN}`) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    try {
      const body = await readBody(req);
      const parsed = JSON.parse(body);

      // Forward to Ollama
      const ollamaUrl = `${OLLAMA_BASE_URL}/api/chat`;
      const ollamaRes = await fetch(ollamaUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed),
      });

      if (!ollamaRes.ok) {
        const errorText = await ollamaRes.text();
        sendJson(res, 502, {
          error: "Ollama error",
          status: ollamaRes.status,
          details: errorText.slice(0, 1000),
        });
        return;
      }

      const ollamaData = await ollamaRes.json();
      sendJson(res, 200, ollamaData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      sendJson(res, 502, { error: "Gateway error", message });
    }
    return;
  }

  // 404 for all other routes
  sendJson(res, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  console.log(`LLM Gateway listening on http://localhost:${PORT}`);
  console.log(`Forwarding to Ollama at ${OLLAMA_BASE_URL}`);
});

export async function llmChatViaGateway(opts: {
  gatewayUrl: string;
  token: string;
  model: string;
  system: string;
  user: string;
}) {
  const res = await fetch(opts.gatewayUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${opts.token}`
    },
    body: JSON.stringify({
      model: opts.model,
      stream: false,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user }
      ]
    })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gateway error: ${res.status} ${text}`);
  }

  return (await res.json()) as {
    model: string;
    created_at: string;
    message: { role: string; content: string };
    done: boolean;
  };
}
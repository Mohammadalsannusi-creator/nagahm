// عميل بسيط للنداء الـ Vercel Function /api/chat
// يحمي مفتاح Anthropic (لا يُرسل من المتصفح أبداً).

export async function callProfessor({ messages, system, useWebSearch = true }) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, system, useWebSearch }),
  });
  if (!res.ok) {
    let detail = `${res.status}`;
    try {
      const j = await res.json();
      detail = j?.error || detail;
    } catch {}
    throw new Error(`تعذّر استدعاء بروفيسور زكي: ${detail}`);
  }
  const data = await res.json();
  // نستخرج النص الأول من content blocks
  const text =
    data?.content
      ?.filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n\n") || "";
  const citations = (data?.content || [])
    .flatMap((b) => b.citations || [])
    .map((c) => ({ title: c.title, url: c.url, source: c.cited_text }));
  return { text, citations, raw: data };
}

// عميل بسيط للنداء الـ Vercel Function /api/chat
// يحمي مفتاح Google AI (لا يُرسل من المتصفح أبداً).

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

  // الاستجابة: { text, citations }
  return {
    text: data.text || "",
    citations: data.citations || [],
    raw: data,
  };
}

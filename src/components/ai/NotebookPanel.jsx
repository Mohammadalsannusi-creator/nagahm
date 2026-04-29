import { useState, useRef } from "react";
import { Send, Loader2, BookOpen, FileText, X, Plus, Eye } from "lucide-react";
import { extractTextFromUrl } from "../../lib/pdfText.js";
import { callProfessor } from "../../lib/api.js";
import { getFileUrl } from "../../lib/storage.js";
import { useUI } from "../../store/ui.js";
import MessageBubble from "./MessageBubble.jsx";
import InlineViewer from "../files/InlineViewer.jsx";

// بناء system prompt يشمل محتوى الملفات
function buildNotebookSystem(sources) {
  if (!sources.length) return null;
  const context = sources
    .map((s) => `=== المصدر: "${s.name}" ===\n${s.text.slice(0, 6000)}`)
    .join("\n\n");
  return `أنت مساعد دراسي ذكي. إليكِ محتوى الملفات التالية — أجيبي على أسئلة الطالبة بناءً عليها فقط، مع ذكر رقم الصفحة عند الاقتباس.

${context}

تذكري: أجيبي بالعربية، وحددي من أي مصدر وصفحة استخرجتِ المعلومة.`;
}

export default function NotebookPanel({ files }) {
  const { pushToast } = useUI();
  const [sources, setSources]     = useState([]);   // [{ name, text, file }]
  const [loading, setLoading]     = useState(null); // اسم الملف قيد المعالجة
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState("");
  const [sending, setSending]     = useState(false);
  const [preview, setPreview]     = useState(null); // file object لعرض PDF بجانب المحادثة
  const bottomRef = useRef(null);

  // ── إضافة ملف من المكتبة ───────────────────────────────────────────────────
  async function addSourceFromLibrary(file) {
    if (sources.find((s) => s.name === file.name)) {
      pushToast("هذا الملف موجود بالفعل في الدفتر", "info");
      return;
    }
    setLoading(file.name);
    try {
      let url = file.downloadURL;
      if (!url || url.startsWith("blob:")) {
        url = (await getFileUrl(file.storagePath).catch(() => null)) ?? url;
      }
      if (!url) throw new Error("الملف غير موجود في التخزين المحلي");
      const { pages } = await extractTextFromUrl(url);
      const text = pages.map((p) => `[صفحة ${p.page}]\n${p.text}`).join("\n\n");
      setSources((s) => [...s, { name: file.name, text, file }]);
      pushToast(`أُضيف "${file.name}" إلى الدفتر ✅`, "success");
    } catch (e) {
      pushToast(`تعذّر استخراج النص: ${e.message}`, "error");
    } finally {
      setLoading(null);
    }
  }

  // ── إرسال سؤال ─────────────────────────────────────────────────────────────
  async function handleSend() {
    const q = input.trim();
    if (!q || sending || sources.length === 0) return;
    setInput("");
    setSending(true);

    const userMsg = { id: Date.now(), role: "user", content: q, citations: [] };
    setMessages((m) => [...m, userMsg]);

    const history = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: q },
    ];

    try {
      const { text, citations } = await callProfessor({
        messages: history,
        system: buildNotebookSystem(sources),
        useWebSearch: false,
      });
      setMessages((m) => [
        ...m,
        { id: Date.now() + 1, role: "assistant", content: text, citations: citations || [] },
      ]);
    } catch (e) {
      pushToast(`تعذّر الرد: ${e.message}`, "error");
      setMessages((m) => [
        ...m,
        { id: Date.now() + 1, role: "assistant", content: `⚠️ ${e.message}`, citations: [] },
      ]);
    } finally {
      setSending(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }

  // ── إزالة مصدر — يغلق المعاينة لو كانت لنفس الملف ──────────────────────────
  function removeSource(name) {
    setSources((src) => src.filter((x) => x.name !== name));
    if (preview?.name === name) setPreview(null);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* ── لوحة المصادر ── */}
      <div className="lg:w-72 shrink-0 space-y-4">
        <div className="card p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <BookOpen className="size-4 text-medical-500" />
            مصادر الدفتر ({sources.length})
          </h3>

          {/* المصادر المضافة — مع زر معاينة */}
          {sources.length > 0 && (
            <div className="space-y-2 mb-4">
              {sources.map((s) => {
                const isPreviewing = preview?.name === s.name;
                return (
                  <div
                    key={s.name}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors ${
                      isPreviewing
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 ring-1 ring-blue-400"
                        : "bg-medical-50 dark:bg-medical-900/20 text-medical-700 dark:text-medical-300"
                    }`}
                  >
                    <FileText className="size-3.5 shrink-0" />
                    <span className="flex-1 truncate" title={s.name}>{s.name}</span>
                    <button
                      onClick={() => setPreview(isPreviewing ? null : s.file)}
                      className="shrink-0 hover:text-blue-600"
                      title={isPreviewing ? "إغلاق المعاينة" : "معاينة"}
                    >
                      <Eye className="size-3.5" />
                    </button>
                    <button
                      onClick={() => removeSource(s.name)}
                      className="shrink-0 hover:text-red-500"
                      title="إزالة"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* قائمة الملفات المتاحة */}
          <p className="text-xs text-slate-400 mb-2">أضيفي ملفات من مكتبتك:</p>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {files.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                ارفعي ملفات PDF أولاً من صفحات المواد.
              </p>
            ) : (
              files
                .filter((f) => f.mimeType === "application/pdf" && !sources.find((s) => s.name === f.name))
                .map((file) => (
                  <button
                    key={file.id}
                    onClick={() => addSourceFromLibrary(file)}
                    disabled={loading === file.name}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-start disabled:opacity-60"
                  >
                    {loading === file.name ? (
                      <Loader2 className="size-3.5 shrink-0 animate-spin" />
                    ) : (
                      <Plus className="size-3.5 shrink-0 text-slate-400" />
                    )}
                    <span className="truncate">{file.name}</span>
                  </button>
                ))
            )}
          </div>
        </div>
      </div>

      {/* ── المعاينة + المحادثة ── */}
      <div className="flex-1 flex flex-col xl:flex-row gap-4 min-w-0">
        {/* معاينة PDF — تظهر فقط عند اختيار مصدر */}
        {preview && (
          <div className="xl:flex-1 min-w-0">
            <InlineViewer
              file={preview}
              onClose={() => setPreview(null)}
              onDownload={() => {
                // تنزيل المصدر المُعاينة
                const url = preview.downloadURL;
                if (!url) return;
                const a = document.createElement("a");
                a.href = url;
                a.download = preview.name;
                a.click();
              }}
            />
          </div>
        )}

        {/* منطقة المحادثة */}
        <div className={`flex flex-col min-h-0 card overflow-hidden ${
          preview ? "xl:flex-1" : "flex-1"
        }`}>
          {/* الرسائل */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[60vh]">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-8">
                <BookOpen className="size-10 text-slate-300" />
                {sources.length === 0 ? (
                  <p className="text-slate-400 text-sm max-w-xs">
                    أضيفي ملفاً واحداً على الأقل من قائمة المصادر، ثم اطرحي أسئلتك.
                  </p>
                ) : (
                  <p className="text-slate-400 text-sm max-w-xs">
                    الدفتر جاهز! اطرحي سؤالاً عن محتوى الملفات المضافة.
                  </p>
                )}
              </div>
            ) : (
              messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
            )}
            {sending && (
              <div className="flex gap-3">
                <div className="size-8 rounded-xl bg-medical-500 grid place-items-center text-white shrink-0">
                  <Loader2 className="size-4 animate-spin" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 text-sm">
                  يجلب الإجابة من الملفات…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* حقل الإدخال */}
          <div className="border-t border-slate-200 dark:border-slate-800 p-3 flex gap-2">
            <textarea
              className="flex-1 resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 max-h-32"
              rows={2}
              placeholder={sources.length === 0 ? "أضيفي ملفاً أولاً…" : "اطرحي سؤالاً عن محتوى الملفات…"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
              disabled={sending || sources.length === 0}
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim() || sources.length === 0}
              className="p-2.5 rounded-xl bg-medical-500 hover:bg-medical-600 text-white disabled:opacity-50 transition-colors self-end"
            >
              <Send className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

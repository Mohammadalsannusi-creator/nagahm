import { useEffect, useRef, useState } from "react";
import { Send, Paperclip, Loader2, Bot } from "lucide-react";
import { watchMessages, addMessage } from "../../lib/db.js";
import { callProfessor } from "../../lib/api.js";
import { extractTextFromUrl } from "../../lib/pdfText.js";
import { useUI } from "../../store/ui.js";
import MessageBubble from "./MessageBubble.jsx";
import Skeleton from "../ui/Skeleton.jsx";

export default function ChatWindow({ uid, chatId, allFiles }) {
  const { pushToast } = useUI();
  const [messages, setMessages] = useState([]);
  const [msgsLoading, setMsgsLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null); // { name, text }
  const [attaching, setAttaching] = useState(false);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // مراقبة الرسائل
  useEffect(() => {
    if (!chatId) { setMessages([]); setMsgsLoading(false); return; }
    setMsgsLoading(true);
    const off = watchMessages(uid, chatId, (msgs) => {
      setMessages(msgs);
      setMsgsLoading(false);
    });
    return () => off && off();
  }, [uid, chatId]);

  // تمرير تلقائي للأسفل
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // إرسال رسالة
  async function handleSend() {
    const text = input.trim();
    if (!text || sending || !chatId) return;

    setInput("");
    setSending(true);

    // نبني محتوى الرسالة (نص + ملف مرفق اختياري)
    let userContent = text;
    if (attachedFile) {
      userContent = `${text}\n\n---\n📎 محتوى الملف: "${attachedFile.name}"\n\n${attachedFile.text.slice(0, 8000)}`;
      setAttachedFile(null);
    }

    // حفظ رسالة المستخدمة
    await addMessage(uid, chatId, { role: "user", content: userContent, citations: [] });

    // بناء تاريخ المحادثة لـ Claude
    const history = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: userContent },
    ];

    try {
      const { text: reply, citations } = await callProfessor({ messages: history });
      await addMessage(uid, chatId, {
        role: "assistant",
        content: reply,
        citations: citations || [],
      });
    } catch (e) {
      pushToast(`تعذّر الاتصال بالأستاذ زكي: ${e.message}`, "error");
      // رسالة خطأ في المحادثة
      await addMessage(uid, chatId, {
        role: "assistant",
        content: `⚠️ تعذّر الرد: ${e.message}`,
        citations: [],
      });
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }

  // إرفاق ملف PDF
  async function handleAttach() {
    if (!allFiles?.length) {
      pushToast("لا توجد ملفات مرفوعة بعد", "info");
      return;
    }
    // نعرض picker بسيط: نختار الملف الأول المتاح من القائمة
    // (يمكن تطوير هذا لـ modal picker لاحقاً)
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf";
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setAttaching(true);
      try {
        // إنشاء Object URL مؤقت لاستخراج النص
        const url = URL.createObjectURL(file);
        const { pages } = await extractTextFromUrl(url);
        URL.revokeObjectURL(url);
        const fullText = pages.map((p) => `[صفحة ${p.page}]\n${p.text}`).join("\n\n");
        setAttachedFile({ name: file.name, text: fullText });
        pushToast(`تم استخراج نص "${file.name}" ✅`, "success");
      } catch (err) {
        pushToast(`تعذّر استخراج النص: ${err.message}`, "error");
      } finally {
        setAttaching(false);
      }
    };
    input.click();
  }

  // حالة: لا توجد محادثة مختارة
  if (!chatId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
        <div className="size-16 grid place-items-center rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 text-white">
          <Bot className="size-8" />
        </div>
        <h2 className="text-xl font-bold">بروفيسور زكي</h2>
        <p className="text-slate-400 text-sm max-w-xs">
          اختاري محادثة من القائمة أو أنشئي محادثة جديدة لتبدئي الاستشارة الطبية.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* منطقة الرسائل */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {msgsLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`flex gap-3 ${i % 2 === 0 ? "" : "flex-row-reverse"}`}>
                <Skeleton className="size-8 rounded-xl shrink-0" />
                <Skeleton className={`h-16 rounded-2xl ${i % 2 === 0 ? "w-2/3" : "w-1/2"}`} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 h-full text-center py-16">
            <Bot className="size-10 text-slate-300" />
            <p className="text-slate-400 text-sm">لا توجد رسائل بعد. اكتبي سؤالاً لتبدئي.</p>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
        )}
        {sending && (
          <div className="flex gap-3">
            <div className="size-8 shrink-0 rounded-xl grid place-items-center bg-gradient-to-br from-teal-500 to-blue-600 text-white">
              <Bot className="size-4" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-slate-400 text-sm">
              <Loader2 className="size-4 animate-spin" />
              بروفيسور زكي يفكّر…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* شريط الإرسال */}
      <div className="border-t border-slate-200 dark:border-slate-800 p-3 space-y-2">
        {/* ملف مرفق */}
        {attachedFile && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs">
            <Paperclip className="size-3.5 shrink-0" />
            <span className="truncate flex-1">{attachedFile.name}</span>
            <button
              onClick={() => setAttachedFile(null)}
              className="text-blue-400 hover:text-blue-600"
            >✕</button>
          </div>
        )}

        <div className="flex gap-2">
          {/* زر إرفاق */}
          <button
            onClick={handleAttach}
            disabled={attaching}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            title="إرفاق ملف PDF"
          >
            {attaching ? <Loader2 className="size-5 animate-spin" /> : <Paperclip className="size-5" />}
          </button>

          {/* حقل النص */}
          <textarea
            ref={textareaRef}
            className="flex-1 resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 max-h-40"
            rows={2}
            placeholder="اكتبي سؤالاً طبياً… (Shift+Enter لسطر جديد)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={sending}
          />

          {/* زر الإرسال */}
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="p-2.5 rounded-xl bg-medical-500 hover:bg-medical-600 text-white disabled:opacity-50 transition-colors shrink-0 self-end"
          >
            <Send className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

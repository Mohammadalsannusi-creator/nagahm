import { useEffect, useState, useMemo } from "react";
import { Layers, Plus, Trash2, RotateCcw, Check, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
import { useUI } from "../store/ui.js";
import { watchFlashcards, addFlashcard, updateFlashcard, deleteFlashcard } from "../lib/db.js";
import { initialCard, review, dueNow } from "../lib/flashcards.js";
import Modal from "../components/ui/Modal.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";

// ─── component ───────────────────────────────────────────────────────────────
export default function Flashcards() {
  const { user } = useAuth();
  const { pushToast } = useUI();

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  // حالة جلسة المراجعة
  const [session, setSession] = useState(null); // { queue: [card,...], idx, flipped }

  // مودال إنشاء بطاقة
  const [addOpen, setAddOpen] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack]   = useState("");
  const [saving, setSaving] = useState(false);

  // مراقبة البطاقات
  useEffect(() => {
    if (!user?.uid) { setLoading(false); return; }
    setLoading(true);
    const off = watchFlashcards(user.uid, (items) => {
      setCards(items);
      setLoading(false);
    });
    return () => off && off();
  }, [user?.uid]);

  // البطاقات المستحقة الآن
  const dueCards = useMemo(() => cards.filter(dueNow), [cards]);

  // ── إضافة بطاقة ──────────────────────────────────────────────────────────
  async function handleAdd() {
    if (!front.trim() || !back.trim()) return;
    setSaving(true);
    try {
      await addFlashcard(user.uid, initialCard({ front: front.trim(), back: back.trim() }));
      setFront(""); setBack("");
      setAddOpen(false);
      pushToast("تمت إضافة البطاقة ✅", "success");
    } catch (e) {
      pushToast(`فشل الحفظ: ${e.message}`, "error");
    } finally {
      setSaving(false);
    }
  }

  // ── حذف بطاقة ────────────────────────────────────────────────────────────
  async function handleDelete(id) {
    try {
      await deleteFlashcard(user.uid, id);
      pushToast("حُذفت البطاقة", "info");
    } catch (e) {
      pushToast(`فشل الحذف: ${e.message}`, "error");
    }
  }

  // ── بدء جلسة المراجعة ────────────────────────────────────────────────────
  function startSession() {
    if (dueCards.length === 0) return;
    setSession({ queue: [...dueCards], idx: 0, flipped: false });
  }

  // ── تقييم بطاقة ──────────────────────────────────────────────────────────
  async function rate(rating) {
    if (!session) return;
    const card = session.queue[session.idx];
    const updated = review(card, rating);
    try {
      await updateFlashcard(user.uid, card.id, {
        ease: updated.ease,
        interval: updated.interval,
        repetitions: updated.repetitions,
        dueDate: updated.dueDate,
      });
    } catch (e) {
      pushToast(`فشل الحفظ: ${e.message}`, "error");
    }
    const nextIdx = session.idx + 1;
    if (nextIdx >= session.queue.length) {
      setSession(null);
      pushToast("🎉 أتممتِ كل البطاقات المستحقة!", "success");
    } else {
      setSession({ ...session, idx: nextIdx, flipped: false });
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <Header />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  // ── جلسة المراجعة ────────────────────────────────────────────────────────
  if (session) {
    const card = session.queue[session.idx];
    const total = session.queue.length;
    const current = session.idx + 1;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Header />
          <button onClick={() => setSession(null)} className="btn-ghost flex items-center gap-2 text-slate-500">
            <X className="size-4" /> إنهاء الجلسة
          </button>
        </div>

        {/* شريط التقدم */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2 text-sm text-slate-500">
            <span>البطاقة {current} من {total}</span>
            <span>{Math.round((current / total) * 100)}%</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-medical-500 rounded-full transition-all"
              style={{ width: `${(current / total) * 100}%` }}
            />
          </div>
        </div>

        {/* البطاقة */}
        <div
          className="card min-h-[260px] flex flex-col items-center justify-center p-8 text-center cursor-pointer select-none hover:shadow-lg transition-shadow"
          onClick={() => setSession((s) => ({ ...s, flipped: !s.flipped }))}
        >
          {!session.flipped ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 uppercase tracking-wide">السؤال</p>
              <p className="text-xl font-bold leading-relaxed">{card.front}</p>
              <p className="text-sm text-slate-400 mt-6">اضغطي لرؤية الإجابة</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 uppercase tracking-wide">الإجابة</p>
              <p className="text-xl font-bold leading-relaxed text-medical-600 dark:text-medical-400">
                {card.back}
              </p>
            </div>
          )}
        </div>

        {/* أزرار التقييم */}
        {session.flipped && (
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "مرة أخرى", rating: 0, cls: "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50" },
              { label: "صعب",      rating: 1, cls: "bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50" },
              { label: "جيد",      rating: 2, cls: "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50" },
              { label: "سهل",      rating: 3, cls: "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50" },
            ].map(({ label, rating, cls }) => (
              <button
                key={label}
                onClick={() => rate(rating)}
                className={`py-3 rounded-xl font-medium text-sm transition-colors ${cls}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── عرض المكتبة ──────────────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Header />
          <button
            onClick={() => setAddOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="size-4" /> بطاقة جديدة
          </button>
        </div>

        {/* شريط الإجراءات */}
        <div className="card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="font-semibold">
              {dueCards.length > 0 ? (
                <span className="text-medical-600 dark:text-medical-400">
                  {dueCards.length} بطاقة مستحقة للمراجعة الآن
                </span>
              ) : (
                <span className="text-green-600 dark:text-green-400">
                  ✓ لا توجد بطاقات مستحقة — أحسنتِ!
                </span>
              )}
            </p>
            <p className="text-sm text-slate-400">إجمالي البطاقات: {cards.length}</p>
          </div>
          {dueCards.length > 0 && (
            <button onClick={startSession} className="btn-primary flex items-center gap-2 shrink-0">
              <RotateCcw className="size-4" /> ابدئي المراجعة
            </button>
          )}
        </div>

        {/* شبكة البطاقات */}
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="size-16 grid place-items-center rounded-2xl bg-purple-100 dark:bg-purple-900/20 text-purple-500">
              <Layers className="size-8" />
            </div>
            <p className="text-lg font-bold text-slate-600 dark:text-slate-300">لا توجد بطاقات بعد</p>
            <p className="text-sm text-slate-400 max-w-xs">
              أنشئي بطاقات استذكار من أي محتوى طبي — أسئلة وإجابات تساعدك على المراجعة الفعّالة.
            </p>
            <button onClick={() => setAddOpen(true)} className="btn-primary flex items-center gap-2">
              <Plus className="size-4" /> أنشئي أول بطاقة
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card) => (
              <CardItem key={card.id} card={card} onDelete={() => handleDelete(card.id)} />
            ))}
          </div>
        )}
      </div>

      {/* مودال إضافة بطاقة */}
      <Modal open={addOpen} onClose={() => !saving && setAddOpen(false)} title="بطاقة استذكار جديدة" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">السؤال (الوجه الأمامي)</label>
            <textarea
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-medical-500"
              rows={3}
              placeholder="اكتبي السؤال أو المصطلح…"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">الإجابة (الوجه الخلفي)</label>
            <textarea
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-medical-500"
              rows={4}
              placeholder="اكتبي الإجابة أو الشرح…"
              value={back}
              onChange={(e) => setBack(e.target.value)}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button className="btn-ghost" onClick={() => setAddOpen(false)} disabled={saving}>إلغاء</button>
            <button
              className="btn-primary flex items-center gap-2"
              onClick={handleAdd}
              disabled={saving || !front.trim() || !back.trim()}
            >
              <Check className="size-4" />
              {saving ? "جارٍ الحفظ…" : "حفظ البطاقة"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ── بطاقة في الشبكة ──────────────────────────────────────────────────────────
function CardItem({ card, onDelete }) {
  const isDue = dueNow(card);
  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold line-clamp-2">{card.front}</p>
        {isDue && (
          <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-medical-50 dark:bg-medical-900/20 text-medical-600 dark:text-medical-400 font-medium">
            مستحقة
          </span>
        )}
      </div>
      <p className="text-xs text-slate-400 line-clamp-3">{card.back}</p>
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
        <span>
          {card.repetitions > 0 ? `${card.repetitions} مراجعة` : "لم تُراجَع"}
        </span>
        <button
          onClick={onDelete}
          className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-center gap-4">
      <div className="size-14 grid place-items-center rounded-2xl bg-purple-500 text-white">
        <Layers className="size-7" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">بطاقات الاستذكار</h1>
        <p className="text-slate-500 text-sm">نظام التكرار المتباعد SM-2</p>
      </div>
    </div>
  );
}

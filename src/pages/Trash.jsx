import { useState } from "react";
import { Trash2, RotateCcw, AlertTriangle, FileText, Package } from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
import { useFiles } from "../hooks/useFiles.js";
import { useUI } from "../store/ui.js";
import { restoreFile, hardDeleteFile } from "../lib/db.js";
import { deleteFileObject } from "../lib/storage.js";
import { getSection } from "../data/subjects.js";
import { fmtBytes, fmtDate } from "../utils/format.js";
import Modal from "../components/ui/Modal.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";

// حساب عدد الأيام المتبقية قبل الحذف النهائي (30 يوماً)
function daysLeft(deletedAt) {
  if (!deletedAt) return 30;
  const deleted = deletedAt?.toDate ? deletedAt.toDate() : new Date(deletedAt);
  const diff = Math.floor((Date.now() - deleted.getTime()) / 86_400_000);
  return Math.max(0, 30 - diff);
}

function DaysLeftBadge({ deletedAt }) {
  const n = daysLeft(deletedAt);
  if (n === 0) return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
      انتهت المهلة
    </span>
  );
  const color =
    n <= 5
      ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
      : n <= 14
      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400";
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
      يُحذف خلال {n} يوم
    </span>
  );
}

// ─── component ──────────────────────────────────────────────────────────────
export default function Trash() {
  const { user } = useAuth();
  const { pushToast } = useUI();
  const { files, loading } = useFiles(user?.uid, { includeTrashed: true });

  const [confirmFile, setConfirmFile] = useState(null); // ملف معلّق للحذف النهائي
  const [confirmAll, setConfirmAll] = useState(false);  // تأكيد حذف الكل
  const [working, setWorking] = useState(false);

  // ── استرجاع ملف ──────────────────────────────────────────────────────────
  async function handleRestore(file) {
    try {
      await restoreFile(user.uid, file.id);
      pushToast(`"${file.name}" استُرجع بنجاح ✅`, "success");
    } catch (e) {
      pushToast(`فشل الاسترجاع: ${e.message}`, "error");
    }
  }

  // ── حذف نهائي لملف واحد ──────────────────────────────────────────────────
  async function handleHardDelete(file) {
    setWorking(true);
    try {
      if (file.storagePath) await deleteFileObject(file.storagePath);
      await hardDeleteFile(user.uid, file.id);
      pushToast(`"${file.name}" حُذف نهائياً 🗑️`, "info");
    } catch (e) {
      pushToast(`فشل الحذف النهائي: ${e.message}`, "error");
    } finally {
      setWorking(false);
      setConfirmFile(null);
    }
  }

  // ── حذف كل الملفات في السلة ──────────────────────────────────────────────
  async function handleDeleteAll() {
    setWorking(true);
    let failed = 0;
    for (const file of files) {
      try {
        if (file.storagePath) await deleteFileObject(file.storagePath);
        await hardDeleteFile(user.uid, file.id);
      } catch {
        failed++;
      }
    }
    setWorking(false);
    setConfirmAll(false);
    if (failed > 0) {
      pushToast(`تعذّر حذف ${failed} ملف`, "error");
    } else {
      pushToast("تم تفريغ السلة بالكامل 🗑️", "info");
    }
  }

  // ── حالة التحميل ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <TrashHeader count={0} onDeleteAll={null} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // ── حالة فارغة ───────────────────────────────────────────────────────────
  if (files.length === 0) {
    return (
      <div className="space-y-6">
        <TrashHeader count={0} onDeleteAll={null} />
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <div className="size-20 grid place-items-center rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400">
            <Package className="size-10" />
          </div>
          <p className="text-xl font-bold text-slate-600 dark:text-slate-300">السلة فارغة</p>
          <p className="text-sm text-slate-400 max-w-xs">
            لا توجد ملفات محذوفة. عندما تحذف ملفاً ستجده هنا لمدة 30 يوماً.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* ── Header ── */}
        <TrashHeader
          count={files.length}
          onDeleteAll={() => setConfirmAll(true)}
        />

        {/* ── تنبيه ── */}
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
          <AlertTriangle className="size-5 shrink-0 mt-0.5" />
          <p className="text-sm">
            الملفات في السلة تُحذف تلقائياً بعد <strong>30 يوماً</strong> من تاريخ الحذف.
            استرجعها قبل انتهاء المهلة.
          </p>
        </div>

        {/* ── شبكة الملفات ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <TrashCard
              key={file.id}
              file={file}
              onRestore={() => handleRestore(file)}
              onDelete={() => setConfirmFile(file)}
            />
          ))}
        </div>
      </div>

      {/* ── مودال تأكيد حذف ملف واحد ── */}
      <Modal
        open={!!confirmFile}
        onClose={() => !working && setConfirmFile(null)}
        title="حذف نهائي"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-300">
            سيُحذف{" "}
            <strong className="text-slate-900 dark:text-white">"{confirmFile?.name}"</strong>{" "}
            نهائياً ولا يمكن التراجع عن هذا الإجراء.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              className="btn-ghost"
              onClick={() => setConfirmFile(null)}
              disabled={working}
            >
              إلغاء
            </button>
            <button
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50 transition-colors"
              onClick={() => handleHardDelete(confirmFile)}
              disabled={working}
            >
              {working ? "جارٍ الحذف…" : "حذف نهائي"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── مودال تأكيد حذف الكل ── */}
      <Modal
        open={confirmAll}
        onClose={() => !working && setConfirmAll(false)}
        title="تفريغ السلة"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-300">
            سيُحذف <strong className="text-red-600">{files.length} ملف</strong> نهائياً.
            هذا الإجراء لا يمكن التراجع عنه.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              className="btn-ghost"
              onClick={() => setConfirmAll(false)}
              disabled={working}
            >
              إلغاء
            </button>
            <button
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50 transition-colors"
              onClick={handleDeleteAll}
              disabled={working}
            >
              {working ? "جارٍ الحذف…" : `حذف ${files.length} ملف نهائياً`}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ── مكوّن العنوان ────────────────────────────────────────────────────────────
function TrashHeader({ count, onDeleteAll }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="size-14 grid place-items-center rounded-2xl bg-red-600 text-white">
          <Trash2 className="size-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">سلة المهملات</h1>
          <p className="text-slate-500 text-sm">
            {count > 0 ? `${count} ملف محذوف` : "لا توجد ملفات محذوفة"}
          </p>
        </div>
      </div>
      {count > 0 && onDeleteAll && (
        <button
          onClick={onDeleteAll}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <Trash2 className="size-4" />
          تفريغ السلة
        </button>
      )}
    </div>
  );
}

// ── بطاقة ملف محذوف ──────────────────────────────────────────────────────────
function TrashCard({ file, onRestore, onDelete }) {
  const section = getSection(file.sectionId);

  return (
    <div className="card p-4 flex flex-col gap-3 opacity-80 hover:opacity-100 transition-opacity">
      {/* أيقونة + اسم */}
      <div className="flex items-start gap-3">
        <div className="size-10 grid place-items-center rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
          <FileText className="size-5 text-slate-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate" title={file.name}>
            {file.name}
          </p>
          {section && (
            <p className="text-xs text-slate-500 mt-0.5">{section.name}</p>
          )}
        </div>
      </div>

      {/* تفاصيل */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{fmtBytes(file.sizeBytes)}</span>
        <span>حُذف {fmtDate(file.deletedAt)}</span>
      </div>

      {/* شارة الأيام المتبقية */}
      <DaysLeftBadge deletedAt={file.deletedAt} />

      {/* أزرار */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onRestore}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-medical-50 dark:bg-medical-900/20 text-medical-600 dark:text-medical-400 text-sm font-medium hover:bg-medical-100 dark:hover:bg-medical-900/40 transition-colors"
        >
          <RotateCcw className="size-4" />
          استرجاع
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-2 rounded-xl border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="حذف نهائي"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}

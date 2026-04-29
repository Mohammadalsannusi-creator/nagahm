import { useCallback, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getSection } from "../data/subjects.js";
import { useAuth } from "../hooks/useAuth.js";
import { useFiles } from "../hooks/useFiles.js";
import { useUI } from "../store/ui.js";
import { createFileDoc, updateFileDoc, trashFile } from "../lib/db.js";
import { uploadFile, getFileUrl } from "../lib/storage.js";
import DropZone from "../components/files/DropZone.jsx";
import FileGrid from "../components/files/FileGrid.jsx";
import PDFViewer from "../components/files/PDFViewer.jsx";
import InlineViewer from "../components/files/InlineViewer.jsx";
import { Upload, X, Plus } from "lucide-react";

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function Subject() {
  const { sectionId }     = useParams();
  const [searchParams]    = useSearchParams();
  const section           = getSection(sectionId);
  const { user }          = useAuth();
  const { pushToast }     = useUI();

  const { files, loading } = useFiles(user?.uid, { sectionId });

  const [uploads, setUploads]   = useState([]);
  const [selected, setSelected] = useState(null); // ملف مختار للعرض المدمج
  const [expanded, setExpanded] = useState(null); // ملف للعارض الكامل (PDFViewer)
  const compactInputRef         = useRef(null);   // input مخفي للرفع السريع في وضع الانقسام

  // auto-open file from URL param (?file=xxx)
  const autoFileId = searchParams.get("file");

  // إغلاق المعاينة + تنظيف ?file=xxx من الـ URL
  function closeInline() {
    setSelected(null);
    if (autoFileId) {
      window.history.replaceState({}, "", `/section/${sectionId}`);
    }
  }

  // ── رفع ملفات ──────────────────────────────────────────────────────────────
  const handleDrop = useCallback(
    async (acceptedFiles) => {
      if (!user) return;
      for (const file of acceptedFiles) {
        const fileId = makeId();
        setUploads((q) => [...q, { id: fileId, name: file.name, progress: 0, done: false }]);
        try {
          const { url, path } = await uploadFile({
            uid: user.uid,
            fileId,
            file,
            onProgress: (p) =>
              setUploads((q) => q.map((u) => (u.id === fileId ? { ...u, progress: p } : u))),
          });
          await createFileDoc(user.uid, {
            name: file.name,
            sectionId,
            sizeBytes: file.size,
            mimeType: file.type,
            storagePath: path,
            downloadURL: url,
          });
          setUploads((q) => q.map((u) => (u.id === fileId ? { ...u, done: true } : u)));
          setTimeout(() => setUploads((q) => q.filter((u) => u.id !== fileId)), 2000);
          pushToast(`تم رفع "${file.name}" بنجاح 🎉`, "success");
        } catch (err) {
          setUploads((q) => q.map((u) => (u.id === fileId ? { ...u, error: err.message } : u)));
          pushToast(`فشل رفع "${file.name}": ${err.message}`, "error");
        }
      }
    },
    [user, sectionId, pushToast]
  );

  // ── عمليات الملفات ─────────────────────────────────────────────────────────
  function handleOpen(file) {
    // PDF / PPTX / GLB → عارض مدمج; غير ذلك → تنزيل
    const isPdf  = /\.pdf$/i.test(file.name) || file.mimeType === "application/pdf";
    const isPptx = /\.(pptx|ppt)$/i.test(file.name) || /presentationml/.test(file.mimeType);
    const isGlb  = /\.(glb|gltf)$/i.test(file.name);
    if (isPdf || isPptx || isGlb) {
      setSelected(file);
    } else {
      handleDownload(file);
    }
  }

  async function handleDownload(file) {
    try {
      const url = file.downloadURL || (await getFileUrl(file.storagePath));
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
    } catch (e) {
      pushToast(`تعذّر تنزيل الملف: ${e.message}`, "error");
    }
  }

  async function handleRename(file, newName) {
    try {
      await updateFileDoc(user.uid, file.id, { name: newName });
      pushToast("تم تغيير الاسم ✅", "success");
    } catch (e) {
      pushToast(`فشل تغيير الاسم: ${e.message}`, "error");
    }
  }

  async function handleDelete(file) {
    try {
      await trashFile(user.uid, file.id);
      if (selected?.id === file.id) setSelected(null);
      pushToast(`"${file.name}" نُقل لسلة المهملات`, "info");
    } catch (e) {
      pushToast(`فشل الحذف: ${e.message}`, "error");
    }
  }

  async function handleTagsChange(file, tags) {
    try {
      await updateFileDoc(user.uid, file.id, { tags });
    } catch (e) {
      pushToast(`فشل حفظ الوسوم: ${e.message}`, "error");
    }
  }

  if (!section) {
    return <div className="text-center py-20 text-slate-500">القسم غير موجود.</div>;
  }

  const Icon = section.icon;

  // auto-open من URL param
  const autoFile = autoFileId ? files.find((f) => f.id === autoFileId) : null;
  const activeSelected = selected || autoFile;

  // العارض الكامل (sticky notes)
  const fullViewer = expanded;

  return (
    <>
      {/* ── عارض PDF الكامل مع sticky notes ── */}
      {fullViewer && (
        <PDFViewer
          file={fullViewer}
          onClose={() => setExpanded(null)}
        />
      )}

      <div className="space-y-5">
        {/* ── Header ── */}
        <div className="flex items-center gap-4">
          <div className={`size-14 grid place-items-center rounded-2xl ${section.bg} text-white`}>
            <Icon className="size-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{section.name}</h1>
            <p className="text-slate-500 text-sm">{files.length} ملف</p>
          </div>
        </div>

        {/* ── منطقة الرفع — تُخفى في وضع الانقسام لتوفير مساحة ── */}
        {!activeSelected && (
          <DropZone
            onFiles={handleDrop}
            accept={section.accept}
            hint={`صيغ مقبولة: ${Object.values(section.accept).flat().join("، ")}`}
          />
        )}

        {/* ── قائمة الرفع الجارية ── */}
        {uploads.length > 0 && (
          <div className="space-y-2">
            {uploads.map((u) => (
              <div key={u.id} className="card px-4 py-3 flex items-center gap-3">
                <Upload className="size-4 text-medical-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate">{u.name}</span>
                    <span className="text-xs text-slate-500 ms-2 shrink-0">
                      {u.error ? (
                        <span className="text-red-500">فشل</span>
                      ) : u.done ? (
                        <span className="text-green-600">✓ تم</span>
                      ) : (
                        `${Math.round(u.progress * 100)}%`
                      )}
                    </span>
                  </div>
                  {!u.done && !u.error && (
                    <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-medical-500 transition-all rounded-full"
                        style={{ width: `${Math.round(u.progress * 100)}%` }}
                      />
                    </div>
                  )}
                  {u.error && <div className="text-xs text-red-500 mt-0.5">{u.error}</div>}
                </div>
                {(u.done || u.error) && (
                  <button
                    onClick={() => setUploads((q) => q.filter((x) => x.id !== u.id))}
                    className="btn-ghost !p-1"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── تخطيط انقسام: قائمة | معاينة ── */}
        {activeSelected ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
            {/* قائمة الملفات — مضغوطة */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  الملفات ({files.length})
                </p>
                {/* زر رفع سريع داخل وضع الانقسام */}
                <button
                  onClick={() => compactInputRef.current?.click()}
                  className="btn-ghost !px-2 !py-1 text-xs gap-1"
                  title="رفع ملف جديد"
                >
                  <Plus className="size-3.5" />
                  رفع
                </button>
                <input
                  ref={compactInputRef}
                  type="file"
                  multiple
                  accept={Object.entries(section.accept).flatMap(([m, exts]) => [m, ...exts]).join(",")}
                  className="hidden"
                  onChange={(e) => {
                    const list = Array.from(e.target.files || []);
                    if (list.length) handleDrop(list);
                    e.target.value = ""; // إعادة التعيين للسماح برفع نفس الملف لاحقاً
                  }}
                />
              </div>
              <FileGrid
                files={files}
                loading={loading}
                compact
                selectedId={activeSelected.id}
                onOpen={handleOpen}
                onDownload={handleDownload}
                onRename={handleRename}
                onDelete={handleDelete}
                onTagsChange={handleTagsChange}
              />
            </div>

            {/* المعاينة المدمجة */}
            <div className="lg:col-span-3">
              <InlineViewer
                file={activeSelected}
                onClose={closeInline}
                onExpand={() => setExpanded(activeSelected)}
                onDownload={() => handleDownload(activeSelected)}
              />
            </div>
          </div>
        ) : (
          /* قائمة الملفات — عرض كامل */
          <FileGrid
            files={files}
            loading={loading}
            onOpen={handleOpen}
            onDownload={handleDownload}
            onRename={handleRename}
            onDelete={handleDelete}
            onTagsChange={handleTagsChange}
          />
        )}
      </div>
    </>
  );
}

import { useState, useCallback } from "react";
import { Box, Upload } from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
import { useFiles } from "../hooks/useFiles.js";
import { useUI } from "../store/ui.js";
import { uploadFile, getFileUrl } from "../lib/storage.js";
import { createFileDoc } from "../lib/db.js";
import { fmtBytes } from "../utils/format.js";
import { useDropzone } from "react-dropzone";
import InlineViewer from "../components/files/InlineViewer.jsx";

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function Anatomy3D() {
  const { user }       = useAuth();
  const { pushToast }  = useUI();
  const [active, setActive]       = useState(null); // file object كامل
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);

  // قائمة ملفات GLB من كل الأقسام
  const { files: allFiles } = useFiles(user?.uid);
  const models = allFiles.filter(
    (f) =>
      f.storagePath?.includes("/models/") ||
      f.name?.toLowerCase().endsWith(".glb") ||
      f.name?.toLowerCase().endsWith(".gltf")
  );

  // ── رفع نموذج جديد ─────────────────────────────────────────────────────────
  const onDrop = useCallback(
    async (accepted) => {
      const file = accepted[0];
      if (!file || !user) return;
      setUploading(true);
      setProgress(0);
      const fileId = makeId();
      try {
        const { url, path } = await uploadFile({
          uid: user.uid,
          fileId,
          file,
          onProgress: (p) => setProgress(Math.round(p * 100)),
        });
        const { id } = await createFileDoc(user.uid, {
          name: file.name,
          sectionId: "anatomy3d",
          sizeBytes: file.size,
          mimeType: "application/octet-stream",
          storagePath: path,
          downloadURL: url,
        });
        // اختر الملف المرفوع تلقائياً للعرض
        setActive({
          id,
          name: file.name,
          sectionId: "anatomy3d",
          sizeBytes: file.size,
          mimeType: "application/octet-stream",
          storagePath: path,
          downloadURL: url,
        });
        pushToast(`تم رفع "${file.name}" ✅`, "success");
      } catch (e) {
        pushToast(`فشل الرفع: ${e.message}`, "error");
      } finally {
        setUploading(false);
      }
    },
    [user, pushToast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/octet-stream": [".glb", ".gltf"] },
    maxFiles: 1,
    disabled: uploading,
  });

  // ── تنزيل / حذف ────────────────────────────────────────────────────────────
  async function handleDownload(file) {
    try {
      const url = file.downloadURL || (await getFileUrl(file.storagePath));
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
    } catch (e) {
      pushToast(`تعذّر التنزيل: ${e.message}`, "error");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="size-14 grid place-items-center rounded-2xl bg-purple-600 text-white">
          <Box className="size-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">عارض التشريح 3D</h1>
          <p className="text-slate-500 text-sm">
            ارفعي نماذج GLB/GLTF وافحصيها بزوايا 360°
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ── لوحة اليسار: قائمة النماذج + رفع ── */}
        <div className="lg:col-span-1 space-y-4">
          {/* منطقة الرفع */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                : "border-slate-300 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="size-8 mx-auto mb-2 text-slate-400" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {isDragActive ? "أفلتي النموذج هنا" : "ارفعي نموذج GLB/GLTF"}
            </p>
            <p className="text-xs text-slate-400 mt-1">حجم أقصى 50 ميغابايت</p>
          </div>

          {/* شريط التحميل */}
          {uploading && (
            <div className="card px-4 py-3 space-y-2">
              <p className="text-xs text-slate-500">جارٍ الرفع… {progress}%</p>
              <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* قائمة النماذج */}
          {models.length > 0 && (
            <div className="card p-3 space-y-1">
              <p className="text-xs font-semibold text-slate-500 mb-2 px-1">
                النماذج المرفوعة
              </p>
              {models.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setActive(m)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-start transition-colors ${
                    active?.id === m.id
                      ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <Box className="size-4 shrink-0" />
                  <span className="flex-1 truncate">{m.name}</span>
                  <span className="text-xs text-slate-400">{fmtBytes(m.sizeBytes)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── لوحة العرض ── */}
        <div className="lg:col-span-3">
          {active ? (
            <InlineViewer
              file={active}
              onClose={() => setActive(null)}
              onDownload={() => handleDownload(active)}
            />
          ) : (
            <div className="card flex flex-col items-center justify-center h-[500px] gap-4 text-center">
              <div className="size-20 grid place-items-center rounded-3xl bg-purple-50 dark:bg-purple-900/20 text-purple-400">
                <Box className="size-10" />
              </div>
              <p className="text-lg font-bold text-slate-500">لا يوجد نموذج مختار</p>
              <p className="text-sm text-slate-400 max-w-xs">
                ارفعي نموذج GLB من القائمة على اليسار أو اختاري نموذجاً مرفوعاً مسبقاً.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

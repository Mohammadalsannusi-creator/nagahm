import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  StickyNote,
  ScanText,
  X,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import {
  watchStickyNotes,
  addStickyNote,
  deleteStickyNote,
  updateFileDoc,
} from "../../lib/db.js";
import { getFileUrl } from "../../lib/storage.js";
import { ocrPdf } from "../../lib/ocr.js";
import { useUI } from "../../store/ui.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export default function PDFViewer({ file, onClose }) {
  const { user } = useAuth();
  const { pushToast } = useUI();
  const [pdf, setPdf] = useState(null);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [notes, setNotes] = useState([]);
  const [adding, setAdding] = useState(null);
  const [ocrRunning, setOcrRunning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const canvasRef = useRef(null);

  // Load PDF — يجرّب downloadURL أولاً، وإن كان Blob قديماً يجدّده من IndexedDB
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let url = file.downloadURL;
        // Blob URLs تنتهي عند إعادة تحميل الصفحة — نجدّدها من IndexedDB
        if (!url || url.startsWith("blob:")) {
          const fresh = await getFileUrl(file.storagePath).catch(() => null);
          if (fresh) url = fresh;
        }
        if (!url) {
          pushToast("تعذّر إيجاد الملف — ربما تمت إزالته من التخزين", "error");
          return;
        }
        const task = pdfjsLib.getDocument({ url });
        const _pdf = await task.promise;
        if (!cancelled) setPdf(_pdf);
      } catch (e) {
        pushToast(`تعذّر فتح الملف: ${e.message}`, "error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file.id, file.downloadURL, file.storagePath, pushToast]);

  // Watch sticky notes
  useEffect(() => {
    if (!user) return;
    return watchStickyNotes(user.uid, file.id, setNotes);
  }, [user, file.id]);

  // Render page
  useEffect(() => {
    if (!pdf) return;
    let cancelled = false;
    (async () => {
      const p = await pdf.getPage(page);
      const viewport = p.getViewport({ scale });
      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await p.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
    })();
    return () => {
      cancelled = true;
    };
  }, [pdf, page, scale]);

  function handleCanvasClick(e) {
    if (!adding) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const text = prompt("اكتبي ملاحظتك:");
    if (text?.trim()) {
      addStickyNote(user.uid, {
        fileId: file.id,
        page,
        x,
        y,
        text: text.trim(),
        color: adding,
      }).catch((err) => pushToast(err.message, "error"));
    }
    setAdding(null);
  }

  async function runOcr() {
    if (!user) return;
    setOcrRunning(true);
    setOcrProgress(0);
    try {
      // نجدّد الرابط لو كان Blob قديماً
      let url = file.downloadURL;
      if (!url || url.startsWith("blob:")) {
        url = (await getFileUrl(file.storagePath).catch(() => null)) ?? url;
      }
      const { fullText } = await ocrPdf(url, {
        onProgress: setOcrProgress,
      });
      await updateFileDoc(user.uid, file.id, { ocrText: fullText });
      pushToast("تم استخراج النص — صار ملفك قابلاً للبحث 🎉", "success");
    } catch (e) {
      pushToast(`فشل OCR: ${e.message}`, "error");
    } finally {
      setOcrRunning(false);
    }
  }

  const pageNotes = notes.filter((n) => n.page === page);

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-slate-50 dark:bg-slate-950">
      <div className="flex items-center gap-2 p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <button onClick={onClose} className="btn-ghost !p-2">
          <X className="size-5" />
        </button>
        <div className="font-semibold truncate flex-1">{file.name}</div>
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="btn-ghost !p-2"
        >
          <ChevronRight className="size-5" />
        </button>
        <span className="text-sm tabular-nums">
          {page} / {pdf?.numPages || "—"}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(pdf?.numPages || p, p + 1))}
          disabled={page >= (pdf?.numPages || 1)}
          className="btn-ghost !p-2"
        >
          <ChevronLeft className="size-5" />
        </button>
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
        <button onClick={() => setScale((s) => Math.max(0.5, s - 0.2))} className="btn-ghost !p-2">
          <ZoomOut className="size-5" />
        </button>
        <span className="text-sm tabular-nums w-10 text-center">{Math.round(scale * 100)}%</span>
        <button onClick={() => setScale((s) => Math.min(3, s + 0.2))} className="btn-ghost !p-2">
          <ZoomIn className="size-5" />
        </button>
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

        <div className="flex items-center gap-1">
          {["yellow", "red", "green", "blue"].map((c) => (
            <button
              key={c}
              onClick={() => setAdding(c)}
              className={`size-6 rounded-full bg-${c}-400 ring-2 ring-offset-1 ${
                adding === c ? "ring-medical-600" : "ring-transparent"
              }`}
              title="إضافة ملاحظة لاصقة"
              style={{ backgroundColor: { yellow: "#facc15", red: "#f87171", green: "#4ade80", blue: "#60a5fa" }[c] }}
            />
          ))}
          <span className="text-xs text-slate-500 ms-1 hidden md:inline"><StickyNote className="size-4 inline" /> ملاحظة</span>
        </div>

        <button onClick={runOcr} disabled={ocrRunning} className="btn-ghost !px-2">
          <ScanText className="size-4" />
          <span className="text-xs hidden md:inline">
            {ocrRunning ? `OCR ${Math.round(ocrProgress * 100)}%` : "استخراج نص"}
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-auto grid place-items-start justify-center p-4">
        <div className="pdf-canvas-wrap relative shadow-lg" onClick={handleCanvasClick}>
          <canvas ref={canvasRef} />
          {pageNotes.map((n) => (
            <div
              key={n.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: `${n.x * 100}%`, top: `${n.y * 100}%` }}
            >
              <div
                className="size-6 rounded-full ring-2 ring-white shadow"
                style={{
                  backgroundColor:
                    { yellow: "#facc15", red: "#f87171", green: "#4ade80", blue: "#60a5fa" }[n.color] || "#facc15",
                }}
              />
              <div className="absolute z-10 bottom-full mb-1 -translate-x-1/2 start-1/2 hidden group-hover:block">
                <div className="card p-2 max-w-[240px] text-xs whitespace-pre-wrap">
                  {n.text}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteStickyNote(user.uid, n.id);
                    }}
                    className="text-red-500 ms-2 underline text-[10px]"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

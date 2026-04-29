import { useState, useEffect, useRef } from "react";
import {
  X, Maximize2, Download, ChevronLeft, ChevronRight,
  Loader2, AlertCircle, FileText, Layers,
} from "lucide-react";
import { getFileUrl } from "../../lib/storage.js";

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function InlineViewer({ file, onClose, onExpand, onDownload }) {
  const [url, setUrl]       = useState(null);
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState(null);
  const freshRef            = useRef(null); // أحتفظ بالـ URL الجديد لمسحه عند unmount

  const isPdf  = file.mimeType === "application/pdf" || /\.pdf$/i.test(file.name);
  const isPptx = /\.(pptx|ppt)$/i.test(file.name) || /presentationml/.test(file.mimeType);
  const isGlb  = /\.(glb|gltf)$/i.test(file.name);

  useEffect(() => {
    setLoad(true);
    setError(null);
    setUrl(null);

    (async () => {
      try {
        let fileUrl = file.downloadURL;
        // جدّد الـ Blob URL إن كان قديماً
        if (!fileUrl || fileUrl.startsWith("blob:")) {
          fileUrl = await getFileUrl(file.storagePath);
          freshRef.current = fileUrl; // لمسحه عند unmount
        }
        if (!fileUrl) throw new Error("الملف غير موجود في التخزين المحلي");
        setUrl(fileUrl);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoad(false);
      }
    })();

    return () => {
      // مسح URL الجديد لتحرير الذاكرة
      if (freshRef.current) {
        URL.revokeObjectURL(freshRef.current);
        freshRef.current = null;
      }
    };
  }, [file.id, file.downloadURL, file.storagePath]);

  return (
    <div className="card overflow-hidden flex flex-col h-[80vh] md:h-[78vh] min-h-[400px]">
      {/* ── شريط العنوان ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0">
        <FileText className="size-4 text-medical-500 shrink-0" />
        <span className="font-medium text-sm truncate flex-1">{file.name}</span>

        <button onClick={onDownload} className="btn-ghost !p-1.5" title="تنزيل">
          <Download className="size-4" />
        </button>

        {/* زر التوسّع للـ PDF viewer الكامل (مع sticky notes) */}
        {isPdf && onExpand && (
          <button onClick={onExpand} className="btn-ghost !p-1.5" title="فتح العارض الكامل مع الملاحظات">
            <Maximize2 className="size-4" />
          </button>
        )}

        <button onClick={onClose} className="btn-ghost !p-1.5" title="إغلاق">
          <X className="size-4" />
        </button>
      </div>

      {/* ── المحتوى ── */}
      <div className="flex-1 overflow-hidden">
        {loading && <StateLoading />}
        {error   && <StateError message={error} />}
        {!loading && !error && url && (
          isPdf  ? <PdfPane  url={url} /> :
          isPptx ? <PptxPane url={url} onDownload={onDownload} /> :
          isGlb  ? <GlbPane  url={url} name={file.name} /> :
                   <StateFallback onDownload={onDownload} />
        )}
      </div>
    </div>
  );
}

// ─── PDF: iframe مدمج ────────────────────────────────────────────────────────
function PdfPane({ url }) {
  return (
    <iframe
      src={url}
      title="عارض PDF"
      className="w-full h-full border-0 bg-white"
    />
  );
}

// ─── PPTX: شرائح مستخرجة ─────────────────────────────────────────────────────
function PptxPane({ url, onDownload }) {
  const [slides,  setSlides]  = useState(null);
  const [current, setCurrent] = useState(0);
  const [busy,    setBusy]    = useState(true);
  const [err,     setErr]     = useState(null);

  useEffect(() => {
    let alive = true;
    let extracted = null;

    extractPptxSlides(url)
      .then((s) => {
        if (alive) {
          extracted = s;
          setSlides(s);
          setBusy(false);
        }
      })
      .catch((e) => { if (alive) { setErr(e.message); setBusy(false); } });

    return () => {
      alive = false;
      // تحرير كل Blob URLs للصور المستخرجة (تجنّب تسريب الذاكرة)
      if (extracted) {
        for (const slide of extracted) {
          for (const img of slide.images || []) {
            try { URL.revokeObjectURL(img); } catch {}
          }
        }
      }
    };
  }, [url]);

  if (busy) return <StateLoading label="جارٍ استخراج الشرائح…" />;
  if (err)  return <StateError message={err} />;
  if (!slides?.length) {
    // PPTX بدون محتوى قابل للعرض → عرض زر تنزيل صريح
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 text-center p-8">
        <Layers className="size-12 text-slate-300" />
        <p className="text-sm text-slate-500 max-w-sm">
          لم يُعثر على شرائح قابلة للعرض داخل الملف. يمكنكِ تنزيله وفتحه ببرنامج العروض.
        </p>
        {onDownload && (
          <button onClick={onDownload} className="btn-primary">
            <Download className="size-4" /> تنزيل الملف
          </button>
        )}
      </div>
    );
  }

  const slide = slides[current];

  return (
    <div className="h-full flex flex-col bg-slate-100 dark:bg-slate-950">
      {/* ── عرض الشريحة ── */}
      <div className="flex-1 overflow-auto p-4 flex flex-col items-center gap-3">
        {/* الصور */}
        {slide.images.length > 0 ? (
          <div className="w-full flex flex-col items-center gap-2">
            {slide.images.map((imgUrl, idx) => (
              <img
                key={idx}
                src={imgUrl}
                alt={`صورة الشريحة ${current + 1}`}
                className="max-w-full max-h-72 object-contain rounded-xl shadow-md"
              />
            ))}
          </div>
        ) : (
          <div className="w-full aspect-video bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700">
            <Layers className="size-10 text-slate-300" />
          </div>
        )}

        {/* النص */}
        {slide.text && (
          <div className="w-full bg-white dark:bg-slate-800 rounded-xl p-4 text-sm text-slate-700 dark:text-slate-200 leading-relaxed border border-slate-200 dark:border-slate-700">
            {slide.text}
          </div>
        )}
      </div>

      {/* ── التنقل بين الشرائح ── */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shrink-0">
        <button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="btn-ghost !p-2"
        >
          <ChevronRight className="size-4" />
        </button>

        {/* مؤشرات نقطية */}
        <div className="flex gap-1 overflow-hidden max-w-[200px]">
          {slides.slice(Math.max(0, current - 4), current + 5).map((_, rel) => {
            const abs = Math.max(0, current - 4) + rel;
            return (
              <button
                key={abs}
                onClick={() => setCurrent(abs)}
                className={`rounded-full transition-all ${abs === current
                  ? "size-2.5 bg-medical-500"
                  : "size-2 bg-slate-300 dark:bg-slate-600 hover:bg-medical-300"}`}
              />
            );
          })}
        </div>

        <span className="text-xs text-slate-500 tabular-nums shrink-0">
          {current + 1} / {slides.length}
        </span>

        <button
          onClick={() => setCurrent((c) => Math.min(slides.length - 1, c + 1))}
          disabled={current === slides.length - 1}
          className="btn-ghost !p-2"
        >
          <ChevronLeft className="size-4" />
        </button>
      </div>
    </div>
  );
}

// ─── GLB: model-viewer ────────────────────────────────────────────────────────
function GlbPane({ url, name }) {
  return (
    // eslint-disable-next-line react/no-unknown-property
    <model-viewer
      src={url}
      alt={name}
      auto-rotate
      camera-controls
      shadow-intensity="1"
      style={{ width: "100%", height: "100%", background: "transparent" }}
    />
  );
}

// ─── حالات UI ────────────────────────────────────────────────────────────────
function StateLoading({ label = "جارٍ التحميل…" }) {
  return (
    <div className="h-full flex items-center justify-center gap-2 text-slate-400">
      <Loader2 className="size-5 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

function StateError({ message }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-2 p-6">
      <AlertCircle className="size-8 text-red-400" />
      <p className="text-sm text-red-500 text-center">{message}</p>
    </div>
  );
}

function StateFallback({ onDownload }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 text-center p-8">
      <FileText className="size-12 text-slate-300" />
      <p className="text-slate-500 text-sm">
        هذا النوع من الملفات لا يُعرض مباشرةً في المتصفح.
      </p>
      <button onClick={onDownload} className="btn-primary">
        <Download className="size-4" /> تنزيل الملف
      </button>
    </div>
  );
}

// ─── استخراج شرائح PPTX ──────────────────────────────────────────────────────
async function extractPptxSlides(blobUrl) {
  const buffer = await fetch(blobUrl).then((r) => r.arrayBuffer());
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(buffer);

  // ترتيب الشرائح حسب الرقم
  const slideNames = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => getSlideNum(a) - getSlideNum(b));

  if (slideNames.length === 0) return [];

  const parser = new DOMParser();
  const slides = [];

  for (const slidePath of slideNames) {
    const num = getSlideNum(slidePath);

    // ── النص من XML ──────────────────────────────────────────────
    const slideXml = await zip.files[slidePath].async("string");
    const slideDoc = parser.parseFromString(slideXml, "text/xml");
    const textParts = Array.from(
      slideDoc.getElementsByTagNameNS(
        "http://schemas.openxmlformats.org/drawingml/2006/main",
        "t"
      )
    )
      .map((t) => t.textContent?.trim())
      .filter(Boolean);

    // fallback: بحث بدون namespace
    const text = textParts.length
      ? textParts.join(" ")
      : Array.from(slideDoc.getElementsByTagName("a:t"))
          .map((t) => t.textContent?.trim())
          .filter(Boolean)
          .join(" ");

    // ── الصور من ملف العلاقات ────────────────────────────────────
    const images = [];
    const relsPath = `ppt/slides/_rels/slide${num}.xml.rels`;

    if (zip.files[relsPath]) {
      const relsXml = await zip.files[relsPath].async("string");
      const relsDoc = parser.parseFromString(relsXml, "text/xml");
      const rels = Array.from(relsDoc.getElementsByTagName("Relationship"));

      for (const rel of rels) {
        const type   = rel.getAttribute("Type") || "";
        const target = rel.getAttribute("Target") || "";
        if (!type.includes("image") || !target) continue;

        // حلّ المسار النسبي
        const mediaPath = target.startsWith("../")
          ? "ppt/" + target.slice(3)
          : "ppt/slides/" + target;

        const ext = mediaPath.split(".").pop().toLowerCase();
        if (!["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp"].includes(ext)) continue;

        if (zip.files[mediaPath]) {
          const blob = await zip.files[mediaPath].async("blob");
          const mime =
            ext === "jpg" || ext === "jpeg" ? "image/jpeg" :
            ext === "png"  ? "image/png"  :
            ext === "gif"  ? "image/gif"  :
            ext === "svg"  ? "image/svg+xml" :
            ext === "webp" ? "image/webp" :
            "image/png";
          images.push(URL.createObjectURL(new Blob([blob], { type: mime })));
        }
      }
    }

    slides.push({ num, text, images });
  }

  return slides;
}

function getSlideNum(path) {
  return parseInt(path.match(/\d+/)[0], 10);
}

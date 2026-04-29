// يستدعي tesseract.js عند الطلب فقط (تحميل ضخم ~12MB).
// يعمل OCR على صفحات PDF بعد رسمها على Canvas.
import { loadPdfFromUrl } from "./pdfText.js";

let _tesseractPromise;
async function loadTesseract() {
  if (!_tesseractPromise) {
    _tesseractPromise = import("tesseract.js");
  }
  return _tesseractPromise;
}

export async function ocrPdf(url, { onProgress } = {}) {
  const Tesseract = (await loadTesseract()).default;
  const pdf = await loadPdfFromUrl(url);
  const worker = await Tesseract.createWorker(["ara", "eng"], 1, {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) {
        onProgress(m.progress);
      }
    },
  });

  const all = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    await page.render({ canvasContext: ctx, viewport }).promise;
    const { data } = await worker.recognize(canvas);
    all.push({ page: i, text: data.text });
  }
  await worker.terminate();
  return { pages: all, fullText: all.map((p) => p.text).join("\n\n") };
}

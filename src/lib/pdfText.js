// استخراج نص ملف PDF عبر pdfjs-dist (يدعم العربية والإنجليزية)
import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export async function extractTextFromUrl(url) {
  const loadingTask = pdfjsLib.getDocument({ url, withCredentials: false });
  const pdf = await loadingTask.promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    const text = tc.items.map((it) => it.str).join(" ");
    pages.push({ page: i, text });
  }
  return { numPages: pdf.numPages, pages };
}

export async function loadPdfFromUrl(url) {
  const task = pdfjsLib.getDocument({ url });
  return await task.promise;
}

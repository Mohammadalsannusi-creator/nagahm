// تخزين الملفات محلياً في IndexedDB — بدون Firebase
// الملفات تبقى بين جلسات المتصفح على نفس الجهاز

const IDB_NAME = "nagham-storage";
const IDB_VERSION = 1;
const STORE = "blobs";

function openIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE, { keyPath: "path" });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(new Error("تعذّر فتح التخزين المحلي"));
  });
}

const MAX_BYTES = 50 * 1024 * 1024; // 50MB

function pathFor(uid, fileId, file) {
  const name = file.name || "";
  if (file.type?.includes("presentation") || name.endsWith(".pptx"))
    return `users/${uid}/presentations/${fileId}`;
  if (name.endsWith(".glb") || name.endsWith(".gltf"))
    return `users/${uid}/models/${fileId}`;
  return `users/${uid}/pdfs/${fileId}`;
}

// رفع ملف → يُحفظ في IndexedDB
export async function uploadFile({ uid, fileId, file, onProgress }) {
  if (file.size > MAX_BYTES) {
    throw new Error("الملف أكبر من 50 ميغابايت — يرجى استخدام ملف أصغر.");
  }
  const path = pathFor(uid, fileId, file);
  onProgress?.(0.05);

  const db = await openIDB();

  const blobUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(0.05 + (e.loaded / e.total) * 0.9);
    };
    reader.onload = (e) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ path, buffer: e.target.result, mimeType: file.type });
      tx.oncomplete = () => {
        onProgress?.(1);
        const blob = new Blob([e.target.result], { type: file.type });
        resolve(URL.createObjectURL(blob));
      };
      tx.onerror = () => reject(new Error("فشل حفظ الملف"));
    };
    reader.onerror = () => reject(new Error("فشل قراءة الملف"));
    reader.readAsArrayBuffer(file);
  });

  return { url: blobUrl, path };
}

// جلب رابط مؤقت Blob لملف مخزّن
export async function getFileUrl(path) {
  if (!path) return null;
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(path);
    req.onsuccess = () => {
      if (!req.result) { resolve(null); return; }
      const blob = new Blob([req.result.buffer], { type: req.result.mimeType });
      resolve(URL.createObjectURL(blob));
    };
    req.onerror = () => reject(new Error("تعذّر فتح الملف"));
  });
}

// حذف ملف من IndexedDB
export async function deleteFileObject(path) {
  if (!path) return;
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(path);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(new Error("تعذّر حذف الملف"));
  });
}

// تحديث روابط Blob لكل الملفات المخزّنة (يُستدعى عند بدء التطبيق)
export async function refreshAllBlobUrls(files, onUpdate) {
  for (const file of files) {
    if (!file.storagePath) continue;
    try {
      const freshUrl = await getFileUrl(file.storagePath);
      if (freshUrl) onUpdate(file.id, freshUrl);
    } catch {
      // الملف غير موجود في IndexedDB — تجاهل
    }
  }
}

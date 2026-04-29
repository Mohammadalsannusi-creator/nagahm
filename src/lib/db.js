// قاعدة البيانات المحلية — localStorage بدون Firebase
// كل البيانات تُحفظ في المتصفح وتبقى بين الجلسات

// ─── pub-sub ─────────────────────────────────────────────────────────────────
const _subs = new Map(); // "uid||col" → Set<fn>

function _sub(uid, col, cb) {
  const k = `${uid}||${col}`;
  if (!_subs.has(k)) _subs.set(k, new Set());
  _subs.get(k).add(cb);
  return () => _subs.get(k)?.delete(cb);
}

function _pub(uid, col) {
  _subs.get(`${uid}||${col}`)?.forEach((fn) => fn());
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function _read(uid, col) {
  try {
    return JSON.parse(localStorage.getItem(`nagham:${uid}:${col}`) ?? "[]");
  } catch {
    return [];
  }
}

function _write(uid, col, items) {
  localStorage.setItem(`nagham:${uid}:${col}`, JSON.stringify(items));
  _pub(uid, col);
}

function _id() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function _now() {
  return new Date().toISOString();
}

// ─── Files ────────────────────────────────────────────────────────────────────
export function watchFiles(uid, { sectionId = null, includeTrashed = false } = {}, cb) {
  const run = () => {
    let items = _read(uid, "files");
    if (sectionId) items = items.filter((f) => f.sectionId === sectionId);
    if (includeTrashed) items = items.filter((f) => f.isInTrash);
    else items = items.filter((f) => !f.isInTrash);
    items.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    cb(items);
  };
  const unsub = _sub(uid, "files", run);
  run();
  return unsub;
}

export async function createFileDoc(uid, payload) {
  const items = _read(uid, "files");
  const doc = {
    ...payload,
    id: _id(),
    uploadedAt: _now(),
    isInTrash: false,
    tags: payload.tags ?? [],
    notes: payload.notes ?? "",
  };
  _write(uid, "files", [...items, doc]);
  return { id: doc.id };
}

export async function updateFileDoc(uid, fileId, patch) {
  const items = _read(uid, "files").map((f) =>
    f.id === fileId ? { ...f, ...patch } : f
  );
  _write(uid, "files", items);
}

// تحديث downloadURL لملف محدد (يُستخدم عند تحديث Blob URLs)
export function updateFileUrl(uid, fileId, url) {
  const items = _read(uid, "files").map((f) =>
    f.id === fileId ? { ...f, downloadURL: url } : f
  );
  // نحدث مباشرة بدون إشعار لتجنب loop
  localStorage.setItem(`nagham:${uid}:files`, JSON.stringify(items));
}

export async function trashFile(uid, fileId) {
  await updateFileDoc(uid, fileId, { isInTrash: true, deletedAt: _now() });
}

export async function restoreFile(uid, fileId) {
  await updateFileDoc(uid, fileId, { isInTrash: false, deletedAt: null });
}

export async function hardDeleteFile(uid, fileId) {
  const items = _read(uid, "files").filter((f) => f.id !== fileId);
  _write(uid, "files", items);
}

// ─── Sticky Notes ─────────────────────────────────────────────────────────────
export function watchStickyNotes(uid, fileId, cb) {
  const run = () => {
    const items = _read(uid, "stickyNotes").filter((n) => n.fileId === fileId);
    cb(items);
  };
  const unsub = _sub(uid, "stickyNotes", run);
  run();
  return unsub;
}

export async function addStickyNote(uid, note) {
  const items = _read(uid, "stickyNotes");
  _write(uid, "stickyNotes", [...items, { ...note, id: _id(), createdAt: _now() }]);
}

export async function deleteStickyNote(uid, id) {
  _write(uid, "stickyNotes", _read(uid, "stickyNotes").filter((n) => n.id !== id));
}

// ─── Flashcards ───────────────────────────────────────────────────────────────
export function watchFlashcards(uid, cb) {
  const run = () => cb(_read(uid, "flashcards"));
  const unsub = _sub(uid, "flashcards", run);
  run();
  return unsub;
}

export async function addFlashcard(uid, card) {
  const items = _read(uid, "flashcards");
  _write(uid, "flashcards", [...items, { ...card, id: _id(), createdAt: _now() }]);
}

export async function updateFlashcard(uid, id, patch) {
  _write(
    uid,
    "flashcards",
    _read(uid, "flashcards").map((c) => (c.id === id ? { ...c, ...patch } : c))
  );
}

export async function deleteFlashcard(uid, id) {
  _write(uid, "flashcards", _read(uid, "flashcards").filter((c) => c.id !== id));
}

// ─── Study Sessions ───────────────────────────────────────────────────────────
export function watchStudySessions(uid, cb) {
  const run = () => {
    const items = _read(uid, "sessions").sort(
      (a, b) => new Date(b.startedAt) - new Date(a.startedAt)
    );
    cb(items);
  };
  const unsub = _sub(uid, "sessions", run);
  run();
  return unsub;
}

export async function addStudySession(uid, payload) {
  const items = _read(uid, "sessions");
  _write(uid, "sessions", [
    ...items,
    { ...payload, id: _id(), startedAt: _now() },
  ]);
}

// ─── Chats ────────────────────────────────────────────────────────────────────
export function watchChats(uid, cb) {
  const run = () => {
    const items = _read(uid, "chats").sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );
    cb(items);
  };
  const unsub = _sub(uid, "chats", run);
  run();
  return unsub;
}

export async function createChat(uid, title) {
  const items = _read(uid, "chats");
  const id = _id();
  const now = _now();
  _write(uid, "chats", [...items, { id, title, createdAt: now, updatedAt: now }]);
  return id;
}

export async function renameChat(uid, chatId, title) {
  _write(
    uid,
    "chats",
    _read(uid, "chats").map((c) =>
      c.id === chatId ? { ...c, title, updatedAt: _now() } : c
    )
  );
}

export async function deleteChat(uid, chatId) {
  _write(uid, "chats", _read(uid, "chats").filter((c) => c.id !== chatId));
  // احذف رسائل المحادثة أيضاً
  localStorage.removeItem(`nagham:${uid}:msgs_${chatId}`);
}

// ─── Messages (nested per chat) ───────────────────────────────────────────────
export function watchMessages(uid, chatId, cb) {
  const col = `msgs_${chatId}`;
  const run = () => {
    const items = _read(uid, col).sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
    cb(items);
  };
  const unsub = _sub(uid, col, run);
  run();
  return unsub;
}

export async function addMessage(uid, chatId, msg) {
  const col = `msgs_${chatId}`;
  const items = _read(uid, col);
  _write(uid, col, [...items, { ...msg, id: _id(), createdAt: _now() }]);
  // تحديث updatedAt للمحادثة
  _write(
    uid,
    "chats",
    _read(uid, "chats").map((c) =>
      c.id === chatId ? { ...c, updatedAt: _now() } : c
    )
  );
}

// ─── Notebooks ────────────────────────────────────────────────────────────────
export function watchNotebooks(uid, cb) {
  const run = () => {
    const items = _read(uid, "notebooks").sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    cb(items);
  };
  const unsub = _sub(uid, "notebooks", run);
  run();
  return unsub;
}

export async function createNotebook(uid, title, fileIds = []) {
  const items = _read(uid, "notebooks");
  const id = _id();
  _write(uid, "notebooks", [
    ...items,
    { id, title, fileIds, createdAt: _now() },
  ]);
  return id;
}

export async function updateNotebook(uid, id, patch) {
  _write(
    uid,
    "notebooks",
    _read(uid, "notebooks").map((n) => (n.id === id ? { ...n, ...patch } : n))
  );
}

export async function deleteNotebook(uid, id) {
  _write(uid, "notebooks", _read(uid, "notebooks").filter((n) => n.id !== id));
}

// ─── Profile ──────────────────────────────────────────────────────────────────
export async function getProfile(uid) {
  try {
    const raw = localStorage.getItem(`nagham:${uid}:profile`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setProfile(uid, data) {
  const existing = (await getProfile(uid)) || {};
  localStorage.setItem(
    `nagham:${uid}:profile`,
    JSON.stringify({ ...existing, ...data })
  );
}

// ─── Bulk Export ──────────────────────────────────────────────────────────────
export async function exportAll(uid) {
  const cols = ["files", "stickyNotes", "flashcards", "sessions", "chats", "notebooks"];
  const data = {};
  cols.forEach((col) => { data[col] = _read(uid, col); });
  // رسائل المحادثات
  data.messages = {};
  data.chats.forEach((c) => {
    data.messages[c.id] = _read(uid, `msgs_${c.id}`);
  });
  return { exportedAt: new Date().toISOString(), data };
}

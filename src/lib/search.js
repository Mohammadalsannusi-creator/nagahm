import Fuse from "fuse.js";

export function buildSearchIndex(files) {
  return new Fuse(files, {
    keys: [
      { name: "name", weight: 0.6 },
      { name: "notes", weight: 0.2 },
      { name: "tags", weight: 0.1 },
      { name: "ocrText", weight: 0.1 },
    ],
    threshold: 0.4,
    ignoreLocation: true,
    includeScore: true,
  });
}

export function searchFiles(index, q, limit = 20) {
  if (!q?.trim()) return [];
  return index.search(q).slice(0, limit).map((r) => r.item);
}

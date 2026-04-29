import FileCard from "./FileCard.jsx";
import Skeleton from "../ui/Skeleton.jsx";

export default function FileGrid({ files, loading, compact = false, selectedId, ...handlers }) {
  const gridClass = compact
    ? "grid grid-cols-1 gap-3"
    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4";

  if (loading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: compact ? 4 : 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }
  if (!files || files.length === 0) {
    return (
      <div className="card p-10 text-center text-slate-500">
        <div className="text-4xl mb-2">📄</div>
        <div>لا توجد ملفات بعد — ابدئي برفع أول ملف 🌟</div>
      </div>
    );
  }
  return (
    <div className={gridClass}>
      {files.map((f) => (
        <FileCard
          key={f.id}
          file={f}
          selected={selectedId === f.id}
          onOpen={() => handlers.onOpen?.(f)}
          onDownload={() => handlers.onDownload?.(f)}
          onRename={(name) => handlers.onRename?.(f, name)}
          onDelete={() => handlers.onDelete?.(f)}
          onTagsChange={(tags) => handlers.onTagsChange?.(f, tags)}
        />
      ))}
    </div>
  );
}

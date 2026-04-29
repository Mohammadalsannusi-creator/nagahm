import { useState } from "react";
import {
  FileText,
  MoreHorizontal,
  Eye,
  Download,
  Trash2,
  Edit3,
  Tag as TagIcon,
  Check,
} from "lucide-react";
import TagBadge, { TagPicker } from "./TagBadge.jsx";
import { fmtBytes, fmtDate } from "../../utils/format.js";

export default function FileCard({ file, onOpen, onDownload, onRename, onDelete, onTagsChange, selected = false }) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(file.name);
  const [pickingTag, setPickingTag] = useState(false);

  async function commitRename() {
    if (name && name !== file.name) {
      await onRename(name.trim());
    } else {
      setName(file.name);
    }
    setRenaming(false);
  }

  return (
    <div className={`card p-4 flex flex-col gap-3 hover:shadow-md transition ${selected ? "ring-2 ring-medical-500 ring-offset-1" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="grid size-10 place-items-center rounded-xl bg-medical-50 dark:bg-medical-900/30 text-medical-600 dark:text-medical-300 shrink-0">
          <FileText className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          {renaming ? (
            <div className="flex gap-1">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && commitRename()}
                className="input !py-1 !px-2 text-sm"
                autoFocus
              />
              <button onClick={commitRename} className="btn-ghost !p-2">
                <Check className="size-4" />
              </button>
            </div>
          ) : (
            <button
              onDoubleClick={() => setRenaming(true)}
              onClick={onOpen}
              className="font-semibold leading-snug truncate w-full text-start hover:text-medical-600"
              title={file.name}
            >
              {file.name}
            </button>
          )}
          <div className="text-xs text-slate-500 mt-0.5">
            {fmtBytes(file.sizeBytes)} · {fmtDate(file.uploadedAt)}
          </div>
        </div>
      </div>

      {file.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {file.tags.map((t) => <TagBadge key={t} tag={t} />)}
        </div>
      )}

      {pickingTag && (
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3">
          <TagPicker value={file.tags || []} onChange={(v) => onTagsChange(v)} />
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
        <button onClick={onOpen} className="btn-ghost !px-2 !py-1 text-xs">
          <Eye className="size-4" /> فتح
        </button>
        <div className="flex gap-1">
          <button
            onClick={() => setPickingTag(!pickingTag)}
            className="btn-ghost !p-2"
            title="وسوم"
          >
            <TagIcon className="size-4" />
          </button>
          <button onClick={() => setRenaming(true)} className="btn-ghost !p-2" title="إعادة تسمية">
            <Edit3 className="size-4" />
          </button>
          <button onClick={onDownload} className="btn-ghost !p-2" title="تنزيل">
            <Download className="size-4" />
          </button>
          <button
            onClick={onDelete}
            className="btn-ghost !p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            title="حذف"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

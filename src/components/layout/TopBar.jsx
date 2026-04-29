import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  Search,
  Sun,
  Moon,
  Download,
  Upload,
  Timer,
} from "lucide-react";
import { useUI } from "../../store/ui.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useFiles } from "../../hooks/useFiles.js";
import { buildSearchIndex, searchFiles } from "../../lib/search.js";
import { exportAll } from "../../lib/db.js";
import { getSection } from "../../data/subjects.js";

export default function TopBar({ pomodoroBadge, onOpenPomodoro }) {
  const { theme, toggleTheme, setSidebarOpen, pushToast } = useUI();
  const { user } = useAuth();
  const { files } = useFiles(user?.uid);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const wrapRef = useRef(null);

  const index = useMemo(() => buildSearchIndex(files), [files]);
  const results = useMemo(() => searchFiles(index, q, 8), [index, q]);

  useEffect(() => {
    const onClick = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleExport() {
    if (!user) return;
    try {
      const data = await exportAll(user.uid);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const stamp = new Date().toISOString().slice(0, 10);
      a.download = `nagham-backup-${stamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
      pushToast("تم تنزيل النسخة الاحتياطية بنجاح", "success");
    } catch (e) {
      pushToast(`تعذّر التصدير: ${e.message}`, "error");
    }
  }

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-3 px-4 h-16">
        <button
          className="md:hidden btn-ghost !p-2"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="size-5" />
        </button>

        <Link to="/" className="hidden md:flex items-center gap-2 font-bold">
          <span className="text-xl">🩺</span>
          <span>منصة نغم</span>
        </Link>

        <div className="flex-1 max-w-2xl mx-auto relative" ref={wrapRef}>
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 size-4 text-slate-400" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="ابحثي في كل الملفات والملاحظات..."
            className="input ps-10"
          />
          {open && q && (
            <div className="absolute mt-2 w-full card overflow-hidden shadow-xl">
              {results.length === 0 ? (
                <div className="p-4 text-sm text-slate-500">لا توجد نتائج</div>
              ) : (
                results.map((r) => {
                  const section = getSection(r.sectionId);
                  return (
                    <button
                      key={r.id}
                      className="w-full text-start flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800"
                      onClick={() => {
                        setOpen(false);
                        setQ("");
                        navigate(`/section/${r.sectionId}?file=${r.id}`);
                      }}
                    >
                      <span className={`size-8 grid place-items-center rounded-lg ${section?.bg || "bg-slate-400"} text-white`}>
                        {section ? (() => { const Icon = section.icon; return <Icon className="size-4" />; })() : null}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-medium">{r.name}</div>
                        <div className="text-xs text-slate-500">{section?.name || "غير مصنّف"}</div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        <button
          onClick={onOpenPomodoro}
          className="btn-ghost !px-3 hidden sm:flex"
          title="مؤقت بومودورو"
        >
          <Timer className="size-4" />
          <span className="text-sm tabular-nums">{pomodoroBadge}</span>
        </button>

        <button onClick={handleExport} className="btn-ghost !p-2" title="تصدير نسخة احتياطية">
          <Download className="size-5" />
        </button>
        <button
          onClick={() => document.getElementById("import-input")?.click()}
          className="btn-ghost !p-2"
          title="استيراد"
        >
          <Upload className="size-5" />
        </button>
        <button onClick={toggleTheme} className="btn-ghost !p-2" title="الوضع الليلي">
          {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>
      </div>
    </header>
  );
}

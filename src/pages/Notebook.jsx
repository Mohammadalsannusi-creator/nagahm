import { BookOpen } from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
import { useFiles } from "../hooks/useFiles.js";
import NotebookPanel from "../components/ai/NotebookPanel.jsx";

export default function Notebook() {
  const { user } = useAuth();
  const { files } = useFiles(user?.uid);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="size-14 grid place-items-center rounded-2xl bg-medical-600 text-white">
          <BookOpen className="size-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">دفتر الأسئلة</h1>
          <p className="text-slate-500 text-sm">
            أضيفي ملفاتك واستجوبيها بالذكاء الاصطناعي
          </p>
        </div>
      </div>

      {/* اللوحة الرئيسية */}
      <NotebookPanel files={files} />
    </div>
  );
}

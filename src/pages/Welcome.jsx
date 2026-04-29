import { Link } from "react-router-dom";
import { ALL_SECTIONS } from "../data/subjects.js";
import { useAuth } from "../hooks/useAuth.js";
import { useFiles } from "../hooks/useFiles.js";
import { Brain, BookOpen, BarChart3 } from "lucide-react";

export default function Welcome() {
  const { user } = useAuth();
  const { files } = useFiles(user?.uid);

  const stats = ALL_SECTIONS.map((s) => ({
    ...s,
    count: files.filter((f) => f.sectionId === s.id).length,
  }));

  return (
    <div className="space-y-10">
      <section className="text-center py-8 md:py-12">
        <div className="text-6xl mb-4">🩺</div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
          أهلاً نغم السنوسي
        </h1>
        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mt-3">
          كلية الطب — رحلتك في التعلم تبدأ من هنا
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-4">الأقسام</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.id}
                to={`/section/${s.id}`}
                className="card p-4 md:p-5 hover:shadow-md hover:-translate-y-0.5 transition group"
              >
                <div className={`size-12 grid place-items-center rounded-2xl ${s.bg} text-white mb-3`}>
                  <Icon className="size-6" />
                </div>
                <div className="font-bold leading-tight">{s.name}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {s.count} ملف
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-4">أدوات الدراسة</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/professor-zaki" className="card p-5 bg-gradient-to-br from-medical-500 to-teal-500 text-white hover:shadow-xl transition">
            <Brain className="size-8 mb-2" />
            <div className="font-bold text-lg">اسألي بروفيسور زكي</div>
            <p className="text-sm text-white/80 mt-1">مساعدك الطبي الذكي مع بحث ويب</p>
          </Link>
          <Link to="/notebook" className="card p-5 hover:shadow-md transition">
            <BookOpen className="size-8 text-medical-500 mb-2" />
            <div className="font-bold text-lg">NotebookLM</div>
            <p className="text-sm text-slate-500 mt-1">اطرحي أسئلة على ملفاتك مباشرة</p>
          </Link>
          <Link to="/stats" className="card p-5 hover:shadow-md transition">
            <BarChart3 className="size-8 text-medical-500 mb-2" />
            <div className="font-bold text-lg">إحصائيات الدراسة</div>
            <p className="text-sm text-slate-500 mt-1">تقدمك الأسبوعي بالأرقام</p>
          </Link>
        </div>
      </section>
    </div>
  );
}

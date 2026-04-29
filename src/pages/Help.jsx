// صفحة المساعدة — نسخة أولية مع دليل سريع للمستخدمة.
import { HelpCircle, BookOpen, Brain, Layers, Timer, BarChart3, Trash2, FileText } from "lucide-react";

const SECTIONS = [
  { icon: FileText,  title: "رفع الملفات",          desc: "اسحبي ملف PDF أو اضغطي زر «اختيار ملف» في أي مادة. الملف يُرفع لـ Firebase ويظهر فوراً على كل أجهزتك." },
  { icon: BookOpen,  title: "قارئ PDF + ملاحظات",  desc: "اضغطي «فتح» على أي ملف لعرضه. انقري على أي مكان في الصفحة لإضافة ملاحظة لاصقة ملونة." },
  { icon: Brain,     title: "بروفيسور زكي",          desc: "اضغطي «اسأل بروفيسور زكي» لبدء محادثة طبية. يبحث في الإنترنت ويرد بالعربية الطبية مع مصادر." },
  { icon: BookOpen,  title: "NotebookLM",            desc: "أنشئي «دفتر» وأضيفي ملفاتك، ثم اطرحي أسئلة. يجيب من محتوى ملفاتك مع رقم الصفحة المرجعية." },
  { icon: Layers,    title: "بطاقات الاستذكار",      desc: "ظلّلي أي نص في PDF لتحويله لبطاقة. خوارزمية SM-2 تُذكّرك بالبطاقات في الوقت المناسب." },
  { icon: Timer,     title: "مؤقت بومودورو",         desc: "اضغطي على العداد في الشريط العلوي لبدء جلسة 25/5. كل جلسة تُسجَّل في إحصائياتك." },
  { icon: BarChart3, title: "الإحصائيات",           desc: "تعرضي عدد الملفات وساعات الدراسة لكل مادة أسبوعياً ببيانات حقيقية." },
  { icon: Trash2,    title: "سلة المهملات",          desc: "الملفات المحذوفة تبقى 30 يوماً. زوري «سلة المهملات» لاسترجاع أي ملف." },
];

export default function Help() {
  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-center gap-3">
        <div className="size-12 grid place-items-center rounded-2xl bg-medical-600 text-white">
          <HelpCircle className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">المساعدة</h1>
          <p className="text-slate-500 text-sm">دليل استخدام منصة نغم السنوسي الطبية</p>
        </div>
      </div>

      <div className="space-y-3">
        {SECTIONS.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="card p-4 flex gap-4">
            <div className="size-10 shrink-0 grid place-items-center rounded-xl bg-medical-50 dark:bg-medical-900/30 text-medical-600 dark:text-medical-300">
              <Icon className="size-5" />
            </div>
            <div>
              <div className="font-bold mb-0.5">{title}</div>
              <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-4 bg-medical-50 dark:bg-medical-900/20 border-medical-200 dark:border-medical-800">
        <div className="font-bold mb-1 text-medical-800 dark:text-medical-200">💡 تلميح</div>
        <div className="text-sm text-medical-700 dark:text-medical-300 leading-relaxed">
          البيانات تتزامن تلقائياً عبر أجهزتك. افتحي الموقع من هاتفك أو لابتوبك وستجدين نفس الملفات بالضبط.
        </div>
      </div>
    </div>
  );
}

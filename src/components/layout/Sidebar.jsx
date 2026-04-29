import { NavLink } from "react-router-dom";
import {
  Home,
  Brain,
  BookOpen,
  BarChart3,
  Trash2,
  Box,
  Network,
  HelpCircle,
  Layers,
  X,
} from "lucide-react";
import { SUBJECTS, EXTRA_LIBRARIES } from "../../data/subjects.js";
import { useUI } from "../../store/ui.js";

const NAV_PRIMARY = [
  { to: "/", label: "الرئيسية", icon: Home },
];

const NAV_TOOLS = [
  { to: "/professor-zaki", label: "بروفيسور زكي", icon: Brain, accent: "from-medical-500 to-teal-500" },
  { to: "/notebook", label: "NotebookLM", icon: BookOpen },
  { to: "/flashcards", label: "بطاقات استذكار", icon: Layers },
  { to: "/stats", label: "إحصائيات", icon: BarChart3 },
  { to: "/anatomy3d", label: "تشريح 3D", icon: Box },
  { to: "/graph", label: "خريطة الترابط", icon: Network },
  { to: "/trash", label: "سلة المهملات", icon: Trash2 },
  { to: "/help", label: "المساعدة", icon: HelpCircle },
];

function NavItem({ to, label, icon: Icon, accent }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          isActive
            ? "bg-medical-50 text-medical-700 dark:bg-medical-900/30 dark:text-medical-300"
            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        }`
      }
    >
      <span
        className={`grid size-8 place-items-center rounded-lg ${
          accent
            ? `bg-gradient-to-br ${accent} text-white`
            : "bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700"
        }`}
      >
        <Icon className="size-4" />
      </span>
      <span>{label}</span>
    </NavLink>
  );
}

function SectionItem({ section }) {
  const Icon = section.icon;
  return (
    <NavLink
      to={`/section/${section.id}`}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          isActive
            ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        }`
      }
    >
      <span className={`grid size-8 place-items-center rounded-lg ${section.bg} text-white`}>
        <Icon className="size-4" />
      </span>
      <span>{section.name}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useUI();

  return (
    <>
      {/* Backdrop on mobile */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden transition-opacity ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={`fixed md:static z-50 inset-y-0 start-0 w-72 shrink-0 bg-white dark:bg-slate-900 border-e border-slate-200 dark:border-slate-800 flex flex-col transition-transform ${
          sidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
        }`}
        style={{ transform: sidebarOpen ? "translateX(0)" : undefined }}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-medical-500 to-teal-500 text-white text-xl">🩺</div>
            <div>
              <div className="font-bold leading-tight">نغم السنوسي</div>
              <div className="text-xs text-slate-500">كلية الطب</div>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden btn-ghost !p-2">
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-6">
          <div className="space-y-1">
            {NAV_PRIMARY.map((n) => <NavItem key={n.to} {...n} />)}
          </div>

          <div>
            <div className="px-3 mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">المواد</div>
            <div className="space-y-1">
              {SUBJECTS.map((s) => <SectionItem key={s.id} section={s} />)}
            </div>
          </div>

          <div>
            <div className="px-3 mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">المكتبات</div>
            <div className="space-y-1">
              {EXTRA_LIBRARIES.map((s) => <SectionItem key={s.id} section={s} />)}
            </div>
          </div>

          <div>
            <div className="px-3 mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">الأدوات</div>
            <div className="space-y-1">
              {NAV_TOOLS.map((n) => <NavItem key={n.to} {...n} />)}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 text-center">
          منصتك الدراسية — رحلتك في التعلم 🌷
        </div>
      </aside>
    </>
  );
}

import { useUI } from "../../store/ui.js";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

const ICONS = { success: CheckCircle2, error: XCircle, info: Info };
const COLORS = {
  success: "bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800",
  error: "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800",
  info: "bg-medical-50 dark:bg-medical-900/30 text-medical-800 dark:text-medical-200 border-medical-200 dark:border-medical-800",
};

export default function Toaster() {
  const { toasts, dismissToast } = useUI();
  return (
    <div className="fixed bottom-6 start-6 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => {
        const Icon = ICONS[t.kind] || Info;
        return (
          <div
            key={t.id}
            className={`flex items-start gap-3 rounded-xl border shadow-lg px-4 py-3 animate-slide-up ${COLORS[t.kind] || COLORS.info}`}
          >
            <Icon className="size-5 mt-0.5 shrink-0" />
            <div className="flex-1 text-sm leading-6">{t.msg}</div>
            <button onClick={() => dismissToast(t.id)} className="opacity-60 hover:opacity-100">
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

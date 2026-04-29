import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children, size = "md" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[96vw] h-[92vh]",
  };

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`card w-full ${sizes[size]} flex flex-col overflow-hidden`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-3">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="btn-ghost !p-2">
            <X className="size-5" />
          </button>
        </div>
        <div className="p-5 overflow-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

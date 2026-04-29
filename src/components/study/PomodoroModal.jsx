import Modal from "../ui/Modal.jsx";
import { Play, Pause, RotateCcw, Coffee, Brain } from "lucide-react";
import { formatMMSS } from "../../hooks/usePomodoro.js";

export default function PomodoroModal({ open, onClose, pomo }) {
  return (
    <Modal open={open} onClose={onClose} title="⏱️ مؤقت بومودورو" size="md">
      <div className="text-center space-y-6">
        <div className="flex justify-center gap-2">
          <button
            onClick={() => pomo.switchMode("focus")}
            className={`btn ${pomo.mode === "focus" ? "btn-primary" : "btn-ghost"}`}
          >
            <Brain className="size-4" /> تركيز
          </button>
          <button
            onClick={() => pomo.switchMode("break")}
            className={`btn ${pomo.mode === "break" ? "btn-primary" : "btn-ghost"}`}
          >
            <Coffee className="size-4" /> استراحة
          </button>
        </div>

        <div className="text-7xl md:text-8xl font-bold tabular-nums tracking-tight">
          {formatMMSS(pomo.secondsLeft)}
        </div>

        <div className="flex justify-center gap-3">
          {!pomo.running ? (
            <button onClick={pomo.start} className="btn-primary">
              <Play className="size-4" /> بدء
            </button>
          ) : (
            <button onClick={pomo.pause} className="btn-primary">
              <Pause className="size-4" /> إيقاف مؤقت
            </button>
          )}
          <button onClick={pomo.reset} className="btn-ghost">
            <RotateCcw className="size-4" /> إعادة
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <label className="text-sm">
            <div className="text-slate-500 mb-1">دقائق التركيز</div>
            <input
              type="number"
              min="5"
              max="90"
              value={pomo.focusMin}
              onChange={(e) => pomo.setFocusMin(+e.target.value || 25)}
              className="input"
            />
          </label>
          <label className="text-sm">
            <div className="text-slate-500 mb-1">دقائق الراحة</div>
            <input
              type="number"
              min="3"
              max="30"
              value={pomo.breakMin}
              onChange={(e) => pomo.setBreakMin(+e.target.value || 5)}
              className="input"
            />
          </label>
        </div>
      </div>
    </Modal>
  );
}

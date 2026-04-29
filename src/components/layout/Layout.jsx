import { useState } from "react";
import Sidebar from "./Sidebar.jsx";
import TopBar from "./TopBar.jsx";
import PomodoroModal from "../study/PomodoroModal.jsx";
import { usePomodoro, formatMMSS } from "../../hooks/usePomodoro.js";
import { useAuth } from "../../hooks/useAuth.js";
import { addStudySession } from "../../lib/db.js";

export default function Layout({ children }) {
  const { user } = useAuth();
  const [pomoOpen, setPomoOpen] = useState(false);

  const pomo = usePomodoro({
    onComplete: async ({ minutes }) => {
      if (!user) return;
      try {
        await addStudySession(user.uid, {
          subjectId: null,
          durationSec: minutes * 60,
          mode: "focus",
        });
      } catch {}
    },
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          pomodoroBadge={formatMMSS(pomo.secondsLeft)}
          onOpenPomodoro={() => setPomoOpen(true)}
        />
        <main className="flex-1 p-4 md:p-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
      <PomodoroModal open={pomoOpen} onClose={() => setPomoOpen(false)} pomo={pomo} />
    </div>
  );
}

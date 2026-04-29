import { useEffect, useState } from "react";
import { Brain, Menu, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
import { useFiles } from "../hooks/useFiles.js";
import { watchChats, createChat } from "../lib/db.js";
import ChatSidebar from "../components/ai/ChatSidebar.jsx";
import ChatWindow from "../components/ai/ChatWindow.jsx";

export default function ProfessorZaki() {
  const { user } = useAuth();
  const { files } = useFiles(user?.uid);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // مراقبة المحادثات
  useEffect(() => {
    if (!user?.uid) return;
    const off = watchChats(user.uid, (items) => {
      setChats(items);
      // فتح أحدث محادثة تلقائياً إن لم تكن هناك محادثة نشطة
      if (!activeChatId && items.length > 0) {
        setActiveChatId(items[0].id);
      }
    });
    return () => off && off();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  function handleSelectChat(id) {
    setActiveChatId(id);
    setSidebarOpen(false);
  }

  async function handleNewChat(id) {
    setActiveChatId(id);
    setSidebarOpen(false);
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] -mx-4 md:-mx-8 -my-4 md:-my-8 overflow-hidden">
      {/* ── الشريط الجانبي — سطح المكتب ── */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-e border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="size-9 grid place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 text-white shrink-0">
            <Brain className="size-5" />
          </div>
          <div>
            <p className="font-bold text-sm">بروفيسور زكي</p>
            <p className="text-xs text-slate-400">المساعد الطبي</p>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <ChatSidebar
            uid={user?.uid}
            chats={chats}
            activeChatId={activeChatId}
            onSelect={handleSelectChat}
            onNew={handleNewChat}
          />
        </div>
      </aside>

      {/* ── الشريط الجانبي — موبايل ── */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        >
          <aside
            className="w-72 h-full bg-white dark:bg-slate-900 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="size-9 grid place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 text-white">
                  <Brain className="size-5" />
                </div>
                <p className="font-bold text-sm">بروفيسور زكي</p>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="btn-ghost !p-2">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <ChatSidebar
                uid={user?.uid}
                chats={chats}
                activeChatId={activeChatId}
                onSelect={handleSelectChat}
                onNew={handleNewChat}
              />
            </div>
          </aside>
        </div>
      )}

      {/* ── منطقة المحادثة ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TopBar داخلي */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button
            className="md:hidden btn-ghost !p-2"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="size-5" />
          </button>
          <div className="flex-1 min-w-0">
            {activeChatId ? (
              <p className="font-semibold text-sm truncate">
                {chats.find((c) => c.id === activeChatId)?.title || "محادثة"}
              </p>
            ) : (
              <p className="text-slate-400 text-sm">اختاري محادثة أو أنشئي واحدة</p>
            )}
          </div>
        </div>

        {/* نافذة الشات */}
        <ChatWindow
          uid={user?.uid}
          chatId={activeChatId}
          allFiles={files}
        />
      </div>
    </div>
  );
}

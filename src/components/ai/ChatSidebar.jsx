import { useState } from "react";
import { Plus, MessageSquare, Trash2, Edit3, Check, X } from "lucide-react";
import { createChat, renameChat, deleteChat } from "../../lib/db.js";
import { useUI } from "../../store/ui.js";
import { timeAgo } from "../../utils/format.js";

export default function ChatSidebar({ uid, chats, activeChatId, onSelect, onNew }) {
  const { pushToast } = useUI();
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal] = useState("");

  async function handleNew() {
    try {
      const id = await createChat(uid, "محادثة جديدة");
      onNew(id);
    } catch (e) {
      pushToast(`تعذّر إنشاء محادثة: ${e.message}`, "error");
    }
  }

  async function handleDelete(chatId, e) {
    e.stopPropagation();
    try {
      await deleteChat(uid, chatId);
      if (activeChatId === chatId) onNew(null);
      pushToast("حُذفت المحادثة", "info");
    } catch (err) {
      pushToast(`فشل الحذف: ${err.message}`, "error");
    }
  }

  async function handleRename(chatId) {
    if (!renameVal.trim()) { setRenamingId(null); return; }
    try {
      await renameChat(uid, chatId, renameVal.trim());
    } catch (e) {
      pushToast(`فشل تعديل الاسم: ${e.message}`, "error");
    } finally {
      setRenamingId(null);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* زر محادثة جديدة */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={handleNew}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-medical-500 text-white text-sm font-medium hover:bg-medical-600 transition-colors"
        >
          <Plus className="size-4" />
          محادثة جديدة
        </button>
      </div>

      {/* قائمة المحادثات */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {chats.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-8 px-3">
            لا توجد محادثات بعد. ابدئي الأولى!
          </p>
        )}
        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onSelect(chat.id)}
            className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
              chat.id === activeChatId
                ? "bg-medical-50 dark:bg-medical-900/20 text-medical-700 dark:text-medical-300"
                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            <MessageSquare className="size-4 shrink-0 opacity-60" />

            {/* اسم المحادثة أو حقل التعديل */}
            {renamingId === chat.id ? (
              <input
                className="flex-1 text-sm bg-transparent border-b border-medical-400 focus:outline-none"
                value={renameVal}
                onChange={(e) => setRenameVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename(chat.id);
                  if (e.key === "Escape") setRenamingId(null);
                }}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="flex-1 text-sm truncate">{chat.title}</span>
            )}

            {/* الوقت */}
            {renamingId !== chat.id && (
              <span className="text-xs text-slate-400 shrink-0 hidden group-hover:hidden">
                {timeAgo(chat.updatedAt)}
              </span>
            )}

            {/* أزرار */}
            {renamingId === chat.id ? (
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => handleRename(chat.id)} className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg">
                  <Check className="size-3.5" />
                </button>
                <button onClick={() => setRenamingId(null)} className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => { e.stopPropagation(); setRenamingId(chat.id); setRenameVal(chat.title); }}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                >
                  <Edit3 className="size-3.5" />
                </button>
                <button
                  onClick={(e) => handleDelete(chat.id, e)}
                  className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

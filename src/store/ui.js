import { create } from "zustand";

const initialTheme =
  typeof localStorage !== "undefined" && localStorage.getItem("theme") === "dark"
    ? "dark"
    : "light";

if (typeof document !== "undefined") {
  document.documentElement.classList.toggle("dark", initialTheme === "dark");
}

export const useUI = create((set, get) => ({
  theme: initialTheme,
  sidebarOpen: false,
  toasts: [],

  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("theme", next);
    set({ theme: next });
  },
  setSidebarOpen: (v) => set({ sidebarOpen: v }),

  pushToast: (msg, kind = "info") => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, msg, kind }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

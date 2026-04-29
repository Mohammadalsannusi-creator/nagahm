import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AuthGuard from "./components/auth/AuthGuard.jsx";
import Layout from "./components/layout/Layout.jsx";
import Toaster from "./components/ui/Toast.jsx";
import { refreshAllBlobUrls } from "./lib/storage.js";
import { updateFileUrl } from "./lib/db.js";

const UID = "nagham";

// Pages
import Welcome from "./pages/Welcome.jsx";
import Subject from "./pages/Subject.jsx";
import ProfessorZaki from "./pages/ProfessorZaki.jsx";
import Notebook from "./pages/Notebook.jsx";
import Flashcards from "./pages/Flashcards.jsx";
import Stats from "./pages/Stats.jsx";
import Anatomy3D from "./pages/Anatomy3D.jsx";
import Graph from "./pages/Graph.jsx";
import Trash from "./pages/Trash.jsx";
import Help from "./pages/Help.jsx";

export default function App() {
  // عند كل تحميل للصفحة: نجدّد Blob URLs لكل الملفات المخزّنة في IndexedDB
  useEffect(() => {
    try {
      const files = JSON.parse(
        localStorage.getItem(`nagham:${UID}:files`) ?? "[]"
      );
      refreshAllBlobUrls(files, (fileId, url) =>
        updateFileUrl(UID, fileId, url)
      );
    } catch {
      // localStorage فارغ أو تالف — لا شيء للتحديث
    }
  }, []);

  return (
    <>
      <AuthGuard>
        <Layout>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/section/:sectionId" element={<Subject />} />
            <Route path="/professor-zaki" element={<ProfessorZaki />} />
            <Route path="/notebook" element={<Notebook />} />
            <Route path="/flashcards" element={<Flashcards />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/anatomy3d" element={<Anatomy3D />} />
            <Route path="/graph" element={<Graph />} />
            <Route path="/trash" element={<Trash />} />
            <Route path="/help" element={<Help />} />
            {/* أي مسار غير معروف يرجع للرئيسية */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AuthGuard>
      <Toaster />
    </>
  );
}

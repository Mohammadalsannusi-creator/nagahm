import { useEffect, useState } from "react";
import { watchFiles } from "../lib/db.js";

export function useFiles(uid, opts = {}) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setFiles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const off = watchFiles(uid, opts, (items) => {
      setFiles(items);
      setLoading(false);
    });
    return () => off && off();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, opts.sectionId, opts.includeTrashed]);

  return { files, loading };
}

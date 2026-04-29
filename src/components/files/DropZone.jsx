import { useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";

export default function DropZone({ onFiles, accept, hint }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    multiple: true,
    onDrop: onFiles,
  });

  return (
    <div
      {...getRootProps()}
      className={`card border-dashed border-2 cursor-pointer p-8 md:p-10 text-center transition ${
        isDragActive
          ? "border-medical-500 bg-medical-50/60 dark:bg-medical-900/20"
          : "border-slate-300 dark:border-slate-700 hover:border-medical-400 dark:hover:border-medical-500 hover:bg-medical-50/30 dark:hover:bg-medical-900/10"
      }`}
    >
      <input {...getInputProps()} />
      <UploadCloud className="mx-auto size-12 text-medical-500" />
      <div className="mt-3 font-bold text-lg">
        {isDragActive ? "أفلتي الملفات هنا" : "اسحبي وأفلتي الملفات هنا"}
      </div>
      <div className="text-sm text-slate-500 mt-1">
        أو انقري لاختيار ملف من جهازك
      </div>
      {hint && <div className="text-xs text-slate-400 mt-2">{hint}</div>}
    </div>
  );
}

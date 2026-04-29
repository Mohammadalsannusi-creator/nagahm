// تعريفات المواد الست + قسمَي العروض ومكتبة PDF العامة
import {
  Activity,
  Stethoscope,
  HeartPulse,
  Languages,
  Scale,
  Pill,
  Presentation,
  FileText,
} from "lucide-react";

export const SUBJECTS = [
  {
    id: "biostats",
    name: "إحصاء طبي",
    short: "إحصاء",
    icon: Activity,
    color: "blue",
    bg: "bg-blue-500",
    soft: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300",
    accept: { "application/pdf": [".pdf"] },
  },
  {
    id: "surgery",
    name: "إسعاف جراحي",
    short: "جراحة",
    icon: Stethoscope,
    color: "red",
    bg: "bg-red-500",
    soft: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300",
    accept: { "application/pdf": [".pdf"] },
  },
  {
    id: "anatomy2",
    name: "تشريح 2",
    short: "تشريح",
    icon: HeartPulse,
    color: "purple",
    bg: "bg-purple-500",
    soft: "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300",
    accept: { "application/pdf": [".pdf"] },
  },
  {
    id: "english2",
    name: "إنجليزي 2",
    short: "إنجليزي",
    icon: Languages,
    color: "green",
    bg: "bg-green-500",
    soft: "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300",
    accept: { "application/pdf": [".pdf"] },
  },
  {
    id: "ethics",
    name: "أنظمة المهنة",
    short: "أنظمة",
    icon: Scale,
    color: "slate",
    bg: "bg-slate-500",
    soft: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
    accept: { "application/pdf": [".pdf"] },
  },
  {
    id: "pharma",
    name: "أدوية",
    short: "أدوية",
    icon: Pill,
    color: "teal",
    bg: "bg-teal-500",
    soft: "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300",
    accept: { "application/pdf": [".pdf"] },
  },
];

export const EXTRA_LIBRARIES = [
  {
    id: "presentations",
    name: "العروض التقديمية",
    short: "عروض",
    icon: Presentation,
    color: "amber",
    bg: "bg-amber-500",
    soft: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300",
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
    },
  },
  {
    id: "library",
    name: "مكتبة PDF العامة",
    short: "مكتبة",
    icon: FileText,
    color: "indigo",
    bg: "bg-indigo-500",
    soft: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300",
    accept: { "application/pdf": [".pdf"] },
  },
];

export const ALL_SECTIONS = [...SUBJECTS, ...EXTRA_LIBRARIES];

export const TAG_COLORS = [
  { id: "red",    label: "عاجل",      bg: "bg-red-500",    text: "text-red-700",    soft: "bg-red-50 dark:bg-red-900/20" },
  { id: "yellow", label: "للمراجعة",  bg: "bg-yellow-500", text: "text-yellow-700", soft: "bg-yellow-50 dark:bg-yellow-900/20" },
  { id: "green",  label: "أتقنته",    bg: "bg-green-500",  text: "text-green-700",  soft: "bg-green-50 dark:bg-green-900/20" },
  { id: "blue",   label: "مرجع",      bg: "bg-blue-500",   text: "text-blue-700",   soft: "bg-blue-50 dark:bg-blue-900/20" },
];

export function getSection(id) {
  return ALL_SECTIONS.find((s) => s.id === id);
}

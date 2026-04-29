import { useEffect, useState, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BarChart2, Clock, Files, TrendingUp } from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
import { useFiles } from "../hooks/useFiles.js";
import { watchStudySessions } from "../lib/db.js";
import { ALL_SECTIONS } from "../data/subjects.js";
import Skeleton from "../components/ui/Skeleton.jsx";

// ألوان الأقسام
const SECTION_COLORS = {
  biostats:      "#3b82f6",
  surgery:       "#ef4444",
  anatomy2:      "#a855f7",
  english2:      "#22c55e",
  ethics:        "#64748b",
  pharma:        "#14b8a6",
  presentations: "#f59e0b",
  library:       "#6366f1",
};

// ─── helpers ─────────────────────────────────────────────────────────────────
function secToHr(sec = 0) { return +(sec / 3600).toFixed(1); }

function dateLabel(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ar-SA", { month: "numeric", day: "numeric" });
}

function buildDailyData(sessions, days = 14) {
  const map = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    map[key] = { date: key, label: dateLabel(key), minutes: 0 };
  }
  sessions.forEach((s) => {
    const ts = s.startedAt?.toDate ? s.startedAt.toDate() : new Date(s.startedAt);
    if (!ts || isNaN(ts.getTime())) return;
    const key = ts.toISOString().slice(0, 10);
    if (map[key]) map[key].minutes += Math.round((s.durationSec || 0) / 60);
  });
  return Object.values(map);
}

function buildFilesPerSection(files) {
  const map = {};
  ALL_SECTIONS.forEach((s) => (map[s.id] = 0));
  files.forEach((f) => { if (f.sectionId && map[f.sectionId] !== undefined) map[f.sectionId]++; });
  return ALL_SECTIONS
    .filter((s) => map[s.id] > 0)
    .map((s) => ({ name: s.short, count: map[s.id], fill: SECTION_COLORS[s.id] || "#94a3b8" }));
}

// ─── subcomponents ───────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`size-12 grid place-items-center rounded-2xl ${color} text-white shrink-0`}>
        <Icon className="size-6" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

function ArabicTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg px-4 py-2 text-sm">
      <p className="font-semibold mb-1 text-slate-700 dark:text-slate-200">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

function EmptyChart({ msg }) {
  return (
    <div className="h-[200px] flex items-center justify-center text-center text-slate-400 text-sm px-4">
      {msg}
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="card p-5">
      <h2 className="font-bold text-base mb-4">{title}</h2>
      {children}
    </div>
  );
}

// ─── component ───────────────────────────────────────────────────────────────
export default function Stats() {
  const { user } = useAuth();
  const { files, loading: filesLoading } = useFiles(user?.uid);
  const [sessions, setSessions] = useState([]);
  const [sessLoading, setSessLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) { setSessLoading(false); return; }
    setSessLoading(true);
    const off = watchStudySessions(user.uid, (items) => {
      setSessions(items);
      setSessLoading(false);
    });
    return () => off && off();
  }, [user?.uid]);

  const loading = filesLoading || sessLoading;

  const totalSec      = useMemo(() => sessions.reduce((s, x) => s + (x.durationSec || 0), 0), [sessions]);
  const dailyData     = useMemo(() => buildDailyData(sessions, 14), [sessions]);
  const filesPerSect  = useMemo(() => buildFilesPerSection(files), [files]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Header />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header />

      {/* بطاقات الملخص */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Files}     label="إجمالي الملفات"  value={files.length}   sub="في كل الأقسام"                        color="bg-medical-500" />
        <StatCard icon={Clock}     label="ساعات الدراسة"   value={secToHr(totalSec)} sub={`${sessions.length} جلسة`}          color="bg-blue-500"    />
        <StatCard icon={TrendingUp} label="متوسط الجلسة"   value={sessions.length ? `${Math.round(totalSec / sessions.length / 60)} د` : "—"} sub="بالدقائق" color="bg-purple-500" />
        <StatCard icon={BarChart2} label="أقسام نشطة"      value={filesPerSect.length} sub={`من ${ALL_SECTIONS.length}`}      color="bg-teal-500"    />
      </div>

      {/* رسوم بيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line: دقائق الدراسة يومياً */}
        <ChartCard title="دقائق الدراسة — آخر 14 يوم">
          {sessions.length === 0
            ? <EmptyChart msg="لا توجد جلسات دراسة مسجّلة بعد. استخدمي مؤقت البومودورو لتسجيل جلساتك." />
            : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={dailyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" د" />
                  <Tooltip content={<ArabicTooltip />} />
                  <Line type="monotone" dataKey="minutes" name="الدقائق" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )
          }
        </ChartCard>

        {/* Pie: توزيع الملفات */}
        <ChartCard title="توزيع الملفات بين الأقسام">
          {filesPerSect.length === 0
            ? <EmptyChart msg="ارفعي ملفات في أقسام المواد لترى توزيع مكتبتك." />
            : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={filesPerSect}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {filesPerSect.map((e) => <Cell key={e.name} fill={e.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} ملف`, ""]} />
                </PieChart>
              </ResponsiveContainer>
            )
          }
        </ChartCard>
      </div>

      {/* Bar: عدد الملفات لكل قسم */}
      <ChartCard title="عدد الملفات لكل قسم">
        {filesPerSect.length === 0
          ? <EmptyChart msg="ارفعي ملفات لترى الإحصاءات." />
          : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={filesPerSect} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<ArabicTooltip />} />
                <Bar dataKey="count" name="الملفات" radius={[6, 6, 0, 0]}>
                  {filesPerSect.map((e) => <Cell key={e.name} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )
        }
      </ChartCard>
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-center gap-4">
      <div className="size-14 grid place-items-center rounded-2xl bg-blue-500 text-white">
        <BarChart2 className="size-7" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">الإحصائيات</h1>
        <p className="text-slate-500 text-sm">تتبع تقدمك الدراسي</p>
      </div>
    </div>
  );
}

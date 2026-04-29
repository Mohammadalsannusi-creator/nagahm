import { useEffect, useRef, useMemo, useState } from "react";
import * as d3 from "d3";
import { Network, Info, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
import { useFiles } from "../hooks/useFiles.js";
import { useNavigate } from "react-router-dom";
import { TAG_COLORS, getSection } from "../data/subjects.js";

// ─── بناء بيانات الشبكة من الملفات ──────────────────────────────────────────
function buildGraphData(files) {
  const nodes = [];
  const links = [];

  // عقدة لكل قسم موجود فيه ملفات
  const sections = {};
  files.forEach((f) => {
    if (f.sectionId && !sections[f.sectionId]) {
      const sec = getSection(f.sectionId);
      if (sec) {
        sections[f.sectionId] = {
          id: `sec_${f.sectionId}`,
          label: sec.short,
          type: "section",
          color: getSectionColor(f.sectionId),
          r: 22,
        };
        nodes.push(sections[f.sectionId]);
      }
    }
  });

  // عقدة لكل ملف + رابط للقسم
  files.forEach((f) => {
    const fileNode = {
      id: `file_${f.id}`,
      label: f.name.replace(/\.[^.]+$/, "").slice(0, 24),
      fullName: f.name,
      type: "file",
      color: f.tags?.[0] ? getTagColor(f.tags[0]) : "#94a3b8",
      r: 10,
      fileId: f.id,
      sectionId: f.sectionId,
    };
    nodes.push(fileNode);

    if (f.sectionId && sections[f.sectionId]) {
      links.push({
        source: `file_${f.id}`,
        target: `sec_${f.sectionId}`,
        strength: 0.4,
      });
    }

    // روابط بين الملفات التي تشترك في وسم
    if (f.tags?.length) {
      files.forEach((other) => {
        if (other.id >= f.id) return;
        const shared = f.tags.filter((t) => other.tags?.includes(t));
        if (shared.length) {
          links.push({
            source: `file_${f.id}`,
            target: `file_${other.id}`,
            strength: 0.2,
          });
        }
      });
    }
  });

  return { nodes, links };
}

function getSectionColor(sectionId) {
  const map = {
    biostats: "#3b82f6",
    surgery: "#ef4444",
    anatomy2: "#a855f7",
    english2: "#22c55e",
    ethics: "#64748b",
    pharma: "#14b8a6",
    presentations: "#f59e0b",
    library: "#6366f1",
    anatomy3d: "#8b5cf6",
  };
  return map[sectionId] || "#94a3b8";
}

function getTagColor(tagId) {
  const t = TAG_COLORS.find((c) => c.id === tagId);
  return t ? { red: "#ef4444", yellow: "#eab308", green: "#22c55e", blue: "#3b82f6" }[tagId] || "#94a3b8" : "#94a3b8";
}

// ─── component ───────────────────────────────────────────────────────────────
export default function Graph() {
  const { user } = useAuth();
  const { files } = useFiles(user?.uid);
  const navigate = useNavigate();
  const svgRef = useRef(null);
  const [hovered, setHovered] = useState(null);

  const { nodes, links } = useMemo(() => buildGraphData(files), [files]);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const el = svgRef.current;
    const W = el.clientWidth || 800;
    const H = el.clientHeight || 500;

    // تنظيف سابق
    d3.select(el).selectAll("*").remove();

    const svg = d3
      .select(el)
      .attr("viewBox", `0 0 ${W} ${H}`)
      .attr("width", "100%")
      .attr("height", "100%");

    // زووم وسحب
    const g = svg.append("g");
    svg.call(
      d3.zoom()
        .scaleExtent([0.3, 3])
        .on("zoom", (e) => g.attr("transform", e.transform))
    );

    // المحاكاة
    const sim = d3
      .forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d) => d.id).distance(80).strength((d) => d.strength))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(W / 2, H / 2))
      .force("collision", d3.forceCollide().radius((d) => d.r + 8));

    // الروابط
    const link = g
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#cbd5e1")
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.6);

    // العقد
    const node = g
      .append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", (d) => (d.type === "file" ? "pointer" : "default"))
      .call(
        d3.drag()
          .on("start", (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
          .on("drag",  (e, d) => { d.fx = e.x; d.fy = e.y; })
          .on("end",   (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
      )
      .on("mouseenter", (e, d) => setHovered(d))
      .on("mouseleave", () => setHovered(null))
      .on("click", (e, d) => {
        if (d.type === "file" && d.sectionId) {
          navigate(`/section/${d.sectionId}?file=${d.fileId}`);
        }
      });

    // دائرة
    node.append("circle")
      .attr("r", (d) => d.r)
      .attr("fill", (d) => d.color)
      .attr("fill-opacity", (d) => (d.type === "section" ? 0.85 : 0.75))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    // نص
    node.append("text")
      .text((d) => d.label)
      .attr("text-anchor", "middle")
      .attr("dy", (d) => d.r + 13)
      .attr("font-size", (d) => (d.type === "section" ? 11 : 9))
      .attr("font-weight", (d) => (d.type === "section" ? "700" : "400"))
      .attr("fill", "currentColor")
      .attr("class", "fill-slate-600 dark:fill-slate-300");

    // تحديث المواضع
    sim.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);
      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    return () => sim.stop();
  }, [nodes, links, navigate]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="size-14 grid place-items-center rounded-2xl bg-cyan-600 text-white">
            <Network className="size-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">خريطة الترابط الطبي</h1>
            <p className="text-slate-500 text-sm">
              {nodes.length} عقدة · {links.length} رابط
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Info className="size-4" />
          <span className="hidden sm:inline">اسحبي للتنقل، استخدمي العجلة للتكبير، اضغطي على ملف لفتحه</span>
        </div>
      </div>

      {/* المفتاح */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="size-4 rounded-full bg-slate-400 inline-block opacity-80" />
          عقدة قسم (كبيرة)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-slate-400 inline-block" />
          ملف
        </span>
        {TAG_COLORS.map((t) => (
          <span key={t.id} className="flex items-center gap-1.5">
            <span className={`size-2.5 rounded-full inline-block ${t.bg}`} />
            {t.label}
          </span>
        ))}
      </div>

      {/* الرسم */}
      <div className="card overflow-hidden" style={{ height: 520 }}>
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <Network className="size-12 text-slate-300" />
            <p className="text-slate-400 text-sm max-w-xs">
              ارفعي ملفات في صفحات المواد لترى خريطة الترابط بينها.
            </p>
          </div>
        ) : (
          <svg ref={svgRef} className="w-full h-full" />
        )}
      </div>

      {/* Tooltip */}
      {hovered && hovered.type === "file" && (
        <div className="card px-4 py-3 flex items-start gap-3">
          <div className="size-2.5 rounded-full mt-1 shrink-0" style={{ backgroundColor: hovered.color }} />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{hovered.fullName}</p>
            {hovered.sectionId && (
              <p className="text-xs text-slate-400">{getSection(hovered.sectionId)?.name}</p>
            )}
          </div>
          <span className="text-xs text-medical-500">اضغطي لفتح الملف</span>
        </div>
      )}
    </div>
  );
}

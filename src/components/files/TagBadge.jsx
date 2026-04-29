import { TAG_COLORS } from "../../data/subjects.js";

export default function TagBadge({ tag, size = "sm", onClick }) {
  const color = TAG_COLORS.find((t) => t.id === tag);
  if (!color) return null;
  const sz = size === "sm" ? "size-2.5" : "size-3";
  return (
    <span
      onClick={onClick}
      className={`chip ${color.soft} ${color.text} cursor-pointer`}
      title={color.label}
    >
      <span className={`${sz} rounded-full ${color.bg}`} />
      {color.label}
    </span>
  );
}

export function TagPicker({ value = [], onChange }) {
  function toggle(id) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {TAG_COLORS.map((t) => {
        const active = value.includes(t.id);
        return (
          <button
            key={t.id}
            onClick={() => toggle(t.id)}
            className={`chip ${active ? `${t.bg} text-white` : `${t.soft} ${t.text}`} ${active ? "" : "opacity-80"}`}
          >
            <span className={`size-2.5 rounded-full ${active ? "bg-white" : t.bg}`} />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

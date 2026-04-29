import { ExternalLink, User, Bot } from "lucide-react";

export default function MessageBubble({ msg }) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* أيقونة */}
      <div
        className={`size-8 shrink-0 rounded-xl grid place-items-center text-white ${
          isUser
            ? "bg-medical-500"
            : "bg-gradient-to-br from-teal-500 to-blue-600"
        }`}
      >
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </div>

      {/* المحتوى */}
      <div className={`max-w-[85%] space-y-2 ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-medical-500 text-white rounded-tr-sm"
              : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-sm"
          }`}
        >
          {isUser ? (
            <span className="whitespace-pre-wrap">{msg.content}</span>
          ) : (
            <MarkdownRenderer text={msg.content} />
          )}
        </div>

        {/* Citations */}
        {msg.citations?.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-slate-400">المصادر:</p>
            {msg.citations.map((c, i) => (
              <a
                key={i}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 hover:underline"
              >
                <ExternalLink className="size-3 shrink-0" />
                <span className="line-clamp-1">{c.title || c.url}</span>
              </a>
            ))}
          </div>
        )}

        {/* Timestamp */}
        {msg.createdAt && (
          <p className="text-xs text-slate-400">{formatTime(msg.createdAt)}</p>
        )}
      </div>
    </div>
  );
}

// ─── Markdown Renderer ────────────────────────────────────────────────────────

function MarkdownRenderer({ text }) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Standalone image: ![alt](url)
    const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      elements.push(
        <MedicalImage key={key++} alt={imgMatch[1]} src={imgMatch[2]} />
      );
      i++;
      continue;
    }

    // H1: # ...
    if (trimmed.startsWith("# ")) {
      elements.push(
        <h3 key={key++} className="font-bold text-base mt-3 mb-1 text-slate-900 dark:text-slate-100">
          {inlineRender(trimmed.slice(2), key)}
        </h3>
      );
      i++;
      continue;
    }

    // H2: ## ...
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h4 key={key++} className="font-semibold mt-2.5 mb-1 text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700 pb-0.5">
          {inlineRender(trimmed.slice(3), key)}
        </h4>
      );
      i++;
      continue;
    }

    // H3: ### ...
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h5 key={key++} className="font-semibold text-sm mt-2 mb-0.5 text-slate-700 dark:text-slate-300">
          {inlineRender(trimmed.slice(4), key)}
        </h5>
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      elements.push(
        <hr key={key++} className="border-slate-200 dark:border-slate-700 my-2" />
      );
      i++;
      continue;
    }

    // Unordered list
    if (/^[-•*]\s/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^[-•*]\s/.test(lines[i].trim())) {
        const item = lines[i].trim().replace(/^[-•*]\s/, "");
        items.push(<li key={i}>{inlineRender(item, i)}</li>);
        i++;
      }
      elements.push(
        <ul key={key++} className="list-disc ps-5 my-1.5 space-y-0.5">
          {items}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        const item = lines[i].trim().replace(/^\d+\.\s/, "");
        items.push(<li key={i}>{inlineRender(item, i)}</li>);
        i++;
      }
      elements.push(
        <ol key={key++} className="list-decimal ps-5 my-1.5 space-y-0.5">
          {items}
        </ol>
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      elements.push(
        <blockquote key={key++} className="border-s-4 border-teal-400 ps-3 py-1 my-1 text-slate-600 dark:text-slate-300 italic bg-teal-50 dark:bg-teal-900/10 rounded-e-lg">
          {inlineRender(trimmed.slice(2), key)}
        </blockquote>
      );
      i++;
      continue;
    }

    // Empty line
    if (trimmed === "") {
      if (elements.length > 0) {
        elements.push(<div key={key++} className="h-1.5" />);
      }
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={key++} className="leading-relaxed">
        {inlineRender(trimmed, key)}
      </p>
    );
    i++;
  }

  return <div className="space-y-px">{elements}</div>;
}

// ─── Medical Image Component ──────────────────────────────────────────────────

function MedicalImage({ src, alt }) {
  return (
    <div className="my-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
      <img
        src={src}
        alt={alt}
        className="w-full object-contain"
        style={{ maxHeight: "320px" }}
        onError={(e) => {
          e.target.closest(".medical-img-wrap")?.remove();
          e.target.parentElement.innerHTML =
            `<p class="text-xs text-slate-400 text-center py-3">⚠️ تعذّر تحميل الصورة</p>`;
        }}
        loading="lazy"
      />
      {alt && (
        <p className="text-center text-xs text-slate-400 py-1.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800">
          {alt}
        </p>
      )}
    </div>
  );
}

// ─── Inline Markdown Parser ───────────────────────────────────────────────────

function inlineRender(text, baseKey = 0) {
  const result = [];
  let remaining = text;
  let k = 0;

  while (remaining.length > 0) {
    // Inline image: ![alt](url)
    const imgM = remaining.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (imgM) {
      result.push(
        <img
          key={`${baseKey}-img-${k++}`}
          src={imgM[2]}
          alt={imgM[1]}
          className="inline-block max-h-14 rounded align-middle mx-0.5"
          onError={(e) => (e.target.style.display = "none")}
        />
      );
      remaining = remaining.slice(imgM[0].length);
      continue;
    }

    // Bold+Italic: ***text***
    const boldItalicM = remaining.match(/^\*\*\*([^*\n]+)\*\*\*/);
    if (boldItalicM) {
      result.push(<strong key={`${baseKey}-bi-${k++}`}><em>{boldItalicM[1]}</em></strong>);
      remaining = remaining.slice(boldItalicM[0].length);
      continue;
    }

    // Bold: **text**
    const boldM = remaining.match(/^\*\*([^*\n]+)\*\*/);
    if (boldM) {
      result.push(<strong key={`${baseKey}-b-${k++}`}>{boldM[1]}</strong>);
      remaining = remaining.slice(boldM[0].length);
      continue;
    }

    // Italic: *text*
    const italicM = remaining.match(/^\*([^*\n]+)\*/);
    if (italicM) {
      result.push(<em key={`${baseKey}-i-${k++}`}>{italicM[1]}</em>);
      remaining = remaining.slice(italicM[0].length);
      continue;
    }

    // Inline code: `code`
    const codeM = remaining.match(/^`([^`\n]+)`/);
    if (codeM) {
      result.push(
        <code
          key={`${baseKey}-c-${k++}`}
          className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs font-mono"
        >
          {codeM[1]}
        </code>
      );
      remaining = remaining.slice(codeM[0].length);
      continue;
    }

    // Link: [text](url)
    const linkM = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkM) {
      result.push(
        <a
          key={`${baseKey}-l-${k++}`}
          href={linkM[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          {linkM[1]}
        </a>
      );
      remaining = remaining.slice(linkM[0].length);
      continue;
    }

    // Advance past non-special chars
    const nextSpecial = remaining.search(/[!*`\[]/);
    if (nextSpecial === -1) {
      result.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      result.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      result.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  // Simplify single plain string
  if (result.length === 1 && typeof result[0] === "string") return result[0];
  return result;
}

function formatTime(ts) {
  if (!ts) return "";
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
}

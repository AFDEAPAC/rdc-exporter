import { useState, type ReactNode } from "react";
import { useI18n } from "../i18n";

interface CodeBlockProps {
  code: string;
  label?: string;
  caption?: string;
}

// tokenizeLine splits one source line into plain / string / comment spans for
// lightweight coloring. It is intentionally minimal (no full grammar) and safe
// for the shell/YAML/Prometheus snippets used on this page: quoted strings are
// matched first so a '#' inside a string is not mistaken for a comment.
function tokenizeLine(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /("(?:[^"\\]|\\.)*")|(#.*$)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) out.push(line.slice(last, m.index));
    if (m[1]) {
      out.push(
        <span key={key++} className="text-teal">
          {m[1]}
        </span>,
      );
    } else if (m[2]) {
      out.push(
        <span key={key++} className="text-faint italic">
          {m[2]}
        </span>,
      );
    }
    last = re.lastIndex;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

// copyText copies to the clipboard, falling back to a hidden textarea +
// execCommand for insecure contexts such as opening the page from file://,
// where navigator.clipboard is unavailable.
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/**
 * CodeBlock renders a copyable, lightly syntax-highlighted snippet.
 *
 * Used throughout the docs sections for shell / YAML / Prometheus examples. Each
 * line is tokenized by `tokenizeLine` for minimal coloring; the content is
 * presentational text, not executed. The copy button writes the raw `code` to
 * the clipboard via `copyText`, which falls back to a hidden-textarea +
 * `execCommand` path so copy still works when the page is opened from `file://`
 * (no `navigator.clipboard`). On a successful copy, `copied` flips to show the
 * localized confirmation label and resets after ~1.6s; a failed copy leaves the
 * idle label so the user can retry.
 *
 * - `label` is the optional caption shown in the window chrome (e.g. "docker").
 * - `caption` is optional footnote text rendered below the code.
 */
export function CodeBlock({ code, label, caption }: CodeBlockProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    const ok = await copyText(code);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    }
  };

  return (
    <figure className="overflow-hidden rounded-xl border border-line bg-[#070b14] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)]">
      <div className="flex items-center justify-between border-b border-line bg-white/[0.02] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amd/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-ember/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-teal/70" />
          {label && (
            <span className="ml-2 text-xs font-medium tracking-wide text-faint">
              {label}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-md border border-line px-2.5 py-1 text-xs font-medium text-muted transition hover:border-cyan/50 hover:text-cyan"
        >
          {copied ? t.common.copied : t.common.copy}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-4 text-[13px] leading-relaxed text-ink">
        <code>
          {/* Index key is safe here: lines come from a static `code` string and
              are rendered once in fixed order — never reordered, inserted, or
              deleted, and the rows carry no local state. */}
          {code.split("\n").map((line, i) => (
            <div key={i} className="whitespace-pre">
              {tokenizeLine(line)}
            </div>
          ))}
        </code>
      </pre>
      {caption && (
        <figcaption className="border-t border-line bg-white/[0.02] px-4 py-2 text-xs text-faint">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

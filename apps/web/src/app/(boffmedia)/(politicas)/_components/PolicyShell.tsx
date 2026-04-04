import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BoffContainer } from "@components/boffmedia/tools/BoffContainer";

interface PolicyShellProps {
  title: string;
  label?: string;
  children: React.ReactNode;
  lastUpdated?: string;
}

/**
 * Shared chrome for all (politicas) pages.
 * Provides the breadcrumb, BoffContainer card, title block, and optional
 * last-updated footer. Page components only need to supply prose content.
 */
export function PolicyShell({
  title,
  label = "Legal",
  children,
  lastUpdated,
}: PolicyShellProps) {
  return (
    <div className="max-w-3xl mx-auto px-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 mb-6 text-xs font-mono tracking-widest uppercase">
        <Link
          href="/"
          className="text-surface-600 hover:text-surface-400 transition-colors duration-150"
        >
          Inicio
        </Link>
        <ChevronRight className="w-3 h-3 text-surface-700 flex-shrink-0" />
        <span className="text-primary-400/70">{label}</span>
        <ChevronRight className="w-3 h-3 text-surface-700 flex-shrink-0" />
        <span className="text-surface-500 truncate">{title}</span>
      </div>

      <BoffContainer variant="primary" contentClassName="p-7 sm:p-10">
        {/* Title block */}
        <div
          className="mb-8 pb-7"
          style={{ borderBottom: "1px solid rgba(249,115,22,0.12)" }}
        >
          <span
            className="block text-xs font-mono text-primary-400/55 tracking-[0.35em] uppercase mb-3"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            // {label}
          </span>
          <h1
            className="text-2xl sm:text-3xl font-black text-surface-50 leading-tight"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            {title}
          </h1>
        </div>

        {/* Prose content */}
        <div>{children}</div>

        {/* Last-updated */}
        {lastUpdated && (
          <div
            className="mt-10 pt-6"
            style={{ borderTop: "1px solid rgba(71,85,105,0.3)" }}
          >
            <p
              className="text-xs font-mono text-surface-600 tracking-wide"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              // Última actualización:{" "}
              <span className="text-surface-500">{lastUpdated}</span>
            </p>
          </div>
        )}
      </BoffContainer>
    </div>
  );
}

// ─── Shared prose primitives ──────────────────────────────────────────────────

export function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-8 first:mt-0">
      <h2 className="flex items-center gap-2.5 text-base font-bold text-surface-100 mb-3">
        <span
          className="w-[3px] h-5 rounded-full flex-shrink-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(251,146,60,0.9), rgba(249,115,22,0.5))",
          }}
          aria-hidden="true"
        />
        {title}
      </h2>
      {children}
    </div>
  );
}

export function PolicyText({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-sm text-surface-400 leading-relaxed last:mb-0">
      {children}
    </p>
  );
}

export function PolicyList({
  items,
  ordered = false,
}: {
  items: React.ReactNode[];
  ordered?: boolean;
}) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className="mb-4 space-y-2 last:mb-0">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-surface-400 leading-relaxed">
          {ordered ? (
            <span
              className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold font-mono mt-0.5"
              style={{
                background: "rgba(249,115,22,0.12)",
                color: "rgba(251,146,60,0.8)",
                border: "1px solid rgba(249,115,22,0.2)",
              }}
            >
              {i + 1}
            </span>
          ) : (
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
              style={{ backgroundColor: "rgba(251,146,60,0.55)" }}
              aria-hidden="true"
            />
          )}
          <span>{item}</span>
        </li>
      ))}
    </Tag>
  );
}

export function PolicyLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-primary-400 hover:text-primary-300 underline underline-offset-2 decoration-primary-500/40 hover:decoration-primary-400/60 transition-colors duration-150"
    >
      {children}
    </Link>
  );
}

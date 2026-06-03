import type { ReactNode } from "react";

interface SidebarSectionProps {
  title: string;
  children: ReactNode;
}

export function SidebarSection({ title, children }: SidebarSectionProps) {
  return (
    <section className="flex flex-col gap-1" aria-label={title}>
      <div className="pl-3 pr-2 text-[11px] font-medium tracking-[0.02em] text-[var(--text-muted)] opacity-60">
        {title}
      </div>
      {children}
    </section>
  );
}

interface ShowMoreButtonProps {
  onClick: () => void;
}

export function ShowMoreButton({ onClick }: ShowMoreButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-[32px] w-full items-center gap-1.5 rounded-lg pr-2 pl-[10px] text-left text-[13px] leading-[1.15] text-[var(--fg-base)] hover:bg-[var(--surface-subtle)]"
    >
      <span className="flex w-5 shrink-0 items-center justify-center opacity-60 group-hover:opacity-100">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M7 12H7.01M12 12H12.01M17 12H17.01"
            stroke="currentColor"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap opacity-60 group-hover:opacity-100">
        Show More
      </span>
    </button>
  );
}

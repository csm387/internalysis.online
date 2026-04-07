"use client";

type Props = {
  label: string;
  onOpen: () => void;
};

export function DesktopIcon({ label, onOpen }: Props) {
  return (
    <button
      type="button"
      onDoubleClick={onOpen}
      onClick={onOpen}
      className="group flex flex-col items-center gap-2 rounded-md p-2 text-left outline-none focus:ring-2 focus:ring-[color:var(--accent)]/60"
      title="Open"
    >
      <div className="h-10 w-10 rounded-sm border border-white/10 bg-[color:var(--ui-1)] shadow-[0_0_0_1px_rgba(0,0,0,0.35)_inset] group-hover:border-white/20" />
      <div className="text-[11px] leading-4 text-zinc-100/90 drop-shadow">
        {label}
      </div>
    </button>
  );
}


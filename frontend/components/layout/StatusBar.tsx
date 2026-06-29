"use client";

interface StatusBarProps {
  shortcuts?: { key: string; label: string }[];
}

const defaultShortcuts = [
  { key: "Esc", label: "Back" },
  { key: "Alt+L", label: "Ledgers" },
  { key: "Alt+S", label: "Stock Items" },
  { key: "F8", label: "Sales" },
  { key: "F9", label: "Purchase" },
  { key: "Ctrl+H", label: "Dashboard" },
];

export default function StatusBar({ shortcuts }: StatusBarProps) {
  const items = shortcuts || defaultShortcuts;

  return (
    <footer className="tally-status-bar h-8 flex items-center px-4 gap-1 shrink-0">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1 px-2">
          <span className="shortcut-key">{item.key}</span>
          <span className="text-[11px] text-tally-text-muted/70">
            {item.label}
          </span>
          {i < items.length - 1 && (
            <span className="text-tally-border mx-1">│</span>
          )}
        </div>
      ))}
    </footer>
  );
}

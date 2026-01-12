"use client";

// ============================================================================
// Keyboard Shortcut Component
// ============================================================================

export interface KbdProps {
  children: React.ReactNode;
}

export function Kbd({ children }: KbdProps) {
  return (
    <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-mono font-semibold bg-muted border border-border rounded shadow-sm">
      {children}
    </kbd>
  );
}

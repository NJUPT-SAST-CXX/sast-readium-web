"use client";

import { useEffect, useCallback } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
}

export interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  shortcuts: KeyboardShortcut[];
}

// Check if a keyboard event matches a shortcut
function matchesShortcut(
  event: KeyboardEvent,
  shortcut: KeyboardShortcut
): boolean {
  const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
  const ctrlMatches =
    (shortcut.ctrl ?? false) === (event.ctrlKey || event.metaKey);
  const altMatches = (shortcut.alt ?? false) === event.altKey;
  const shiftMatches = (shortcut.shift ?? false) === event.shiftKey;

  return keyMatches && ctrlMatches && altMatches && shiftMatches;
}

// Hook for keyboard shortcuts
export function useKeyboardShortcuts({
  enabled = true,
  shortcuts,
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      for (const shortcut of shortcuts) {
        if (matchesShortcut(event, shortcut)) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [enabled, shortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

// Default editor shortcuts
export function createEditorShortcuts(actions: {
  onBold?: () => void;
  onItalic?: () => void;
  onStrikethrough?: () => void;
  onCode?: () => void;
  onLink?: () => void;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onHeading1?: () => void;
  onHeading2?: () => void;
  onHeading3?: () => void;
  onBulletList?: () => void;
  onNumberedList?: () => void;
  onTaskList?: () => void;
  onQuote?: () => void;
  onCodeBlock?: () => void;
  onDuplicateLine?: () => void;
  onMoveLineUp?: () => void;
  onMoveLineDown?: () => void;
  onDeleteLine?: () => void;
  onToggleComment?: () => void;
}): KeyboardShortcut[] {
  const shortcuts: KeyboardShortcut[] = [];

  if (actions.onBold) {
    shortcuts.push({
      key: "b",
      ctrl: true,
      action: actions.onBold,
      description: "Bold",
    });
  }

  if (actions.onItalic) {
    shortcuts.push({
      key: "i",
      ctrl: true,
      action: actions.onItalic,
      description: "Italic",
    });
  }

  if (actions.onStrikethrough) {
    shortcuts.push({
      key: "s",
      ctrl: true,
      shift: true,
      action: actions.onStrikethrough,
      description: "Strikethrough",
    });
  }

  if (actions.onCode) {
    shortcuts.push({
      key: "e",
      ctrl: true,
      action: actions.onCode,
      description: "Inline code",
    });
  }

  if (actions.onLink) {
    shortcuts.push({
      key: "k",
      ctrl: true,
      action: actions.onLink,
      description: "Insert link",
    });
  }

  if (actions.onSave) {
    shortcuts.push({
      key: "s",
      ctrl: true,
      action: actions.onSave,
      description: "Save",
    });
  }

  if (actions.onUndo) {
    shortcuts.push({
      key: "z",
      ctrl: true,
      action: actions.onUndo,
      description: "Undo",
    });
  }

  if (actions.onRedo) {
    shortcuts.push({
      key: "z",
      ctrl: true,
      shift: true,
      action: actions.onRedo,
      description: "Redo",
    });
    shortcuts.push({
      key: "y",
      ctrl: true,
      action: actions.onRedo,
      description: "Redo",
    });
  }

  if (actions.onHeading1) {
    shortcuts.push({
      key: "1",
      ctrl: true,
      shift: true,
      action: actions.onHeading1,
      description: "Heading 1",
    });
  }

  if (actions.onHeading2) {
    shortcuts.push({
      key: "2",
      ctrl: true,
      shift: true,
      action: actions.onHeading2,
      description: "Heading 2",
    });
  }

  if (actions.onHeading3) {
    shortcuts.push({
      key: "3",
      ctrl: true,
      shift: true,
      action: actions.onHeading3,
      description: "Heading 3",
    });
  }

  if (actions.onBulletList) {
    shortcuts.push({
      key: "l",
      ctrl: true,
      shift: true,
      action: actions.onBulletList,
      description: "Bullet list",
    });
  }

  if (actions.onNumberedList) {
    shortcuts.push({
      key: "o",
      ctrl: true,
      shift: true,
      action: actions.onNumberedList,
      description: "Numbered list",
    });
  }

  if (actions.onTaskList) {
    shortcuts.push({
      key: "t",
      ctrl: true,
      shift: true,
      action: actions.onTaskList,
      description: "Task list",
    });
  }

  if (actions.onQuote) {
    shortcuts.push({
      key: "q",
      ctrl: true,
      shift: true,
      action: actions.onQuote,
      description: "Quote",
    });
  }

  if (actions.onCodeBlock) {
    shortcuts.push({
      key: "c",
      ctrl: true,
      shift: true,
      action: actions.onCodeBlock,
      description: "Code block",
    });
  }

  if (actions.onDuplicateLine) {
    shortcuts.push({
      key: "d",
      ctrl: true,
      action: actions.onDuplicateLine,
      description: "Duplicate line",
    });
  }

  if (actions.onMoveLineUp) {
    shortcuts.push({
      key: "ArrowUp",
      alt: true,
      action: actions.onMoveLineUp,
      description: "Move line up",
    });
  }

  if (actions.onMoveLineDown) {
    shortcuts.push({
      key: "ArrowDown",
      alt: true,
      action: actions.onMoveLineDown,
      description: "Move line down",
    });
  }

  if (actions.onDeleteLine) {
    shortcuts.push({
      key: "k",
      ctrl: true,
      shift: true,
      action: actions.onDeleteLine,
      description: "Delete line",
    });
  }

  if (actions.onToggleComment) {
    shortcuts.push({
      key: "/",
      ctrl: true,
      action: actions.onToggleComment,
      description: "Toggle comment",
    });
  }

  return shortcuts;
}

// Keyboard shortcuts help dialog content
export const shortcutsHelpContent = `
## Keyboard Shortcuts

### Text Formatting
| Shortcut | Action |
|----------|--------|
| Ctrl+B | Bold |
| Ctrl+I | Italic |
| Ctrl+Shift+S | Strikethrough |
| Ctrl+E | Inline code |
| Ctrl+K | Insert link |

### Headings & Structure
| Shortcut | Action |
|----------|--------|
| Ctrl+Shift+1 | Heading 1 |
| Ctrl+Shift+2 | Heading 2 |
| Ctrl+Shift+3 | Heading 3 |
| Ctrl+Shift+L | Bullet list |
| Ctrl+Shift+O | Numbered list |
| Ctrl+Shift+T | Task list |
| Ctrl+Shift+Q | Quote |
| Ctrl+Shift+C | Code block |

### Line Operations
| Shortcut | Action |
|----------|--------|
| Ctrl+D | Duplicate line |
| Alt+↑ | Move line up |
| Alt+↓ | Move line down |
| Ctrl+Shift+K | Delete line |
| Ctrl+/ | Toggle comment |

### General
| Shortcut | Action |
|----------|--------|
| Ctrl+S | Save |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Ctrl+Y | Redo |
`;

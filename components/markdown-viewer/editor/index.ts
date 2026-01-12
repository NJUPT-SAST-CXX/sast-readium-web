export { ToolbarButton, type ToolbarButtonProps } from "./toolbar-button";
export {
  MarkdownEditor,
  type MarkdownEditorProps,
  type MarkdownEditorRef,
  type ViewMode,
} from "./editor";
export { SlashCommandMenu } from "./slash-command-menu";
export { TableEditor } from "./table-editor";

// Live Preview Editor (Obsidian-style)
export { LivePreviewEditor } from "./live-preview";
export type {
  LivePreviewEditorProps,
  LivePreviewEditorRef,
} from "./live-preview";

// Block Editor (Feishu-style)
export { BlockEditor } from "./block-editor/block-editor";
export { BlockHandle } from "./block-editor/block-handle";
export { BlockActionsMenu } from "./block-editor/block-actions-menu";
export {
  FloatingToolbar,
  useFloatingToolbar,
} from "./block-editor/floating-toolbar";
export type { Block, BlockType } from "./block-editor/types";

// Utilities
export {
  useKeyboardShortcuts,
  createEditorShortcuts,
  shortcutsHelpContent,
} from "./keyboard-shortcuts";
export { smartPaste, formatUrlContent } from "./smart-paste";
export type { KeyboardShortcut } from "./keyboard-shortcuts";
export type { SmartPasteResult } from "./smart-paste";

// UX Components
export { Minimap } from "./minimap";
export { QuickSwitcher, useQuickSwitcher } from "./quick-switcher";
export { WordCountPanel } from "./word-count-panel";
export type { QuickSwitcherItem } from "./quick-switcher";
export type { WordCountStats } from "./word-count-panel";

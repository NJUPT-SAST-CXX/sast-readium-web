export type BlockType =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "heading4"
  | "heading5"
  | "heading6"
  | "bulletList"
  | "numberedList"
  | "taskList"
  | "quote"
  | "codeBlock"
  | "table"
  | "image"
  | "divider"
  | "callout"
  | "math"
  | "mermaid"
  | "video"
  | "audio"
  | "file"
  | "embed"
  | "columns"
  | "tabs"
  | "details";

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  metadata?: Record<string, unknown>;
  children?: Block[];
}

export interface BlockAction {
  id: string;
  label: string;
  icon: React.ElementType;
  shortcut?: string;
  action: (block: Block) => void;
  disabled?: boolean;
  destructive?: boolean;
}

export interface BlockConversion {
  from: BlockType;
  to: BlockType;
  label: string;
  icon: React.ElementType;
}

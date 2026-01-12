"use client";

import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import {
  HighlightStyle,
  syntaxHighlighting,
  defaultHighlightStyle,
} from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { Extension } from "@codemirror/state";
import {
  keymap,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  highlightActiveLine,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap,
} from "@codemirror/autocomplete";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { lintKeymap } from "@codemirror/lint";

// Custom markdown highlight style
const markdownHighlightStyle = HighlightStyle.define([
  // Headings
  { tag: tags.heading1, fontSize: "1.6em", fontWeight: "bold" },
  { tag: tags.heading2, fontSize: "1.4em", fontWeight: "bold" },
  { tag: tags.heading3, fontSize: "1.2em", fontWeight: "bold" },
  { tag: tags.heading4, fontSize: "1.1em", fontWeight: "bold" },
  { tag: tags.heading5, fontSize: "1.05em", fontWeight: "bold" },
  { tag: tags.heading6, fontSize: "1em", fontWeight: "bold" },

  // Emphasis
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strong, fontWeight: "bold" },
  { tag: tags.strikethrough, textDecoration: "line-through" },

  // Code
  { tag: tags.monospace, fontFamily: "monospace" },

  // Links
  { tag: tags.link, textDecoration: "underline" },
  { tag: tags.url, color: "var(--primary)" },

  // Lists
  { tag: tags.list, color: "var(--muted-foreground)" },

  // Quotes
  { tag: tags.quote, fontStyle: "italic", color: "var(--muted-foreground)" },

  // Meta (markdown syntax characters)
  {
    tag: tags.processingInstruction,
    color: "var(--muted-foreground)",
    opacity: 0.7,
  },
  { tag: tags.meta, color: "var(--muted-foreground)", opacity: 0.7 },
]);

export interface MarkdownExtensionsOptions {
  lineNumbers?: boolean;
  lineWrapping?: boolean;
  highlightActiveLine?: boolean;
  bracketMatching?: boolean;
  autocompletion?: boolean;
  history?: boolean;
  tabSize?: number;
}

export function createMarkdownExtensions(
  options: MarkdownExtensionsOptions = {}
): Extension[] {
  const {
    highlightActiveLine: enableHighlightActiveLine = true,
    bracketMatching = true,
    autocompletion: enableAutocompletion = true,
    history: enableHistory = true,
  } = options;

  const extensions: Extension[] = [
    // Core markdown support
    markdown({
      base: markdownLanguage,
      codeLanguages: languages,
    }),

    // Syntax highlighting
    syntaxHighlighting(markdownHighlightStyle),
    syntaxHighlighting(defaultHighlightStyle),

    // Basic editor features
    highlightSpecialChars(),
    drawSelection(),
    dropCursor(),
    rectangularSelection(),
    crosshairCursor(),
    highlightSelectionMatches(),

    // Keymaps
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...completionKeymap,
      ...lintKeymap,
    ]),
  ];

  // Optional features
  if (enableHighlightActiveLine) {
    extensions.push(highlightActiveLine());
  }

  if (bracketMatching) {
    extensions.push(closeBrackets());
  }

  if (enableAutocompletion) {
    extensions.push(autocompletion());
  }

  if (enableHistory) {
    extensions.push(history());
  }

  return extensions;
}

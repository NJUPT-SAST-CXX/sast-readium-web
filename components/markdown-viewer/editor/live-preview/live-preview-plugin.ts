"use client";

import {
  ViewPlugin,
  ViewUpdate,
  Decoration,
  DecorationSet,
  EditorView,
  WidgetType,
} from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { Range, RangeSet } from "@codemirror/state";

// Widget for rendering inline elements
class InlineWidget extends WidgetType {
  constructor(
    private content: string,
    private className: string
  ) {
    super();
  }

  toDOM() {
    const span = document.createElement("span");
    span.className = this.className;
    span.innerHTML = this.content;
    return span;
  }

  ignoreEvent() {
    return false;
  }
}

// Check if cursor is within a range
function isCursorInRange(
  cursorPos: number,
  from: number,
  to: number,
  buffer: number = 0
): boolean {
  return cursorPos >= from - buffer && cursorPos <= to + buffer;
}

// Get the line range that contains the cursor
function getCursorLineRange(view: EditorView): { from: number; to: number } {
  const pos = view.state.selection.main.head;
  const line = view.state.doc.lineAt(pos);
  return { from: line.from, to: line.to };
}

// Create decorations for live preview
function createLivePreviewDecorations(view: EditorView): DecorationSet {
  const decorations: Range<Decoration>[] = [];
  const cursorPos = view.state.selection.main.head;
  const cursorLine = getCursorLineRange(view);
  const doc = view.state.doc;

  // Iterate through syntax tree
  syntaxTree(view.state).iterate({
    enter(node) {
      const nodeType = node.type.name;
      const from = node.from;
      const to = node.to;

      // Skip if cursor is on this line (show raw markdown)
      if (isCursorInRange(cursorPos, from, to, 0)) {
        // Check if cursor is on the same line
        const nodeLine = doc.lineAt(from);
        if (nodeLine.from === cursorLine.from) {
          return;
        }
      }

      // Hide markdown syntax for different elements
      switch (nodeType) {
        case "EmphasisMark": {
          // Hide * or _ for italic
          decorations.push(Decoration.replace({}).range(from, to));
          break;
        }

        case "StrongEmphasis": {
          // Apply bold styling to the content
          const text = doc.sliceString(from, to);
          const match = text.match(/^(\*\*|__)(.+?)(\*\*|__)$/);
          if (match) {
            // Hide opening marker
            decorations.push(Decoration.replace({}).range(from, from + 2));
            // Hide closing marker
            decorations.push(Decoration.replace({}).range(to - 2, to));
            // Apply bold class
            decorations.push(
              Decoration.mark({ class: "cm-live-bold" }).range(from + 2, to - 2)
            );
          }
          break;
        }

        case "Emphasis": {
          // Apply italic styling
          const text = doc.sliceString(from, to);
          const match = text.match(/^(\*|_)(.+?)(\*|_)$/);
          if (match) {
            decorations.push(Decoration.replace({}).range(from, from + 1));
            decorations.push(Decoration.replace({}).range(to - 1, to));
            decorations.push(
              Decoration.mark({ class: "cm-live-italic" }).range(
                from + 1,
                to - 1
              )
            );
          }
          break;
        }

        case "Strikethrough": {
          const text = doc.sliceString(from, to);
          const match = text.match(/^~~(.+?)~~$/);
          if (match) {
            decorations.push(Decoration.replace({}).range(from, from + 2));
            decorations.push(Decoration.replace({}).range(to - 2, to));
            decorations.push(
              Decoration.mark({ class: "cm-live-strikethrough" }).range(
                from + 2,
                to - 2
              )
            );
          }
          break;
        }

        case "InlineCode": {
          const text = doc.sliceString(from, to);
          const match = text.match(/^`(.+?)`$/);
          if (match) {
            decorations.push(Decoration.replace({}).range(from, from + 1));
            decorations.push(Decoration.replace({}).range(to - 1, to));
            decorations.push(
              Decoration.mark({ class: "cm-live-code" }).range(from + 1, to - 1)
            );
          }
          break;
        }

        case "Link": {
          // Transform [text](url) into clickable link
          const text = doc.sliceString(from, to);
          const match = text.match(/^\[(.+?)\]\((.+?)\)$/);
          if (match) {
            const linkText = match[1];
            const url = match[2];

            // Hide the markdown syntax, show only link text
            decorations.push(
              Decoration.replace({
                widget: new InlineWidget(
                  `<a href="${url}" class="cm-live-link" target="_blank" rel="noopener">${linkText}</a>`,
                  "cm-live-link-wrapper"
                ),
              }).range(from, to)
            );
          }
          break;
        }

        case "Image": {
          // Transform ![alt](url) into image preview
          const text = doc.sliceString(from, to);
          const match = text.match(/^!\[(.+?)\]\((.+?)\)$/);
          if (match) {
            const alt = match[1];
            const url = match[2];

            decorations.push(
              Decoration.replace({
                widget: new InlineWidget(
                  `<img src="${url}" alt="${alt}" class="cm-live-image" />`,
                  "cm-live-image-wrapper"
                ),
              }).range(from, to)
            );
          }
          break;
        }

        case "HeaderMark": {
          // Hide # characters for headings
          decorations.push(
            Decoration.replace({}).range(from, to + 1) // +1 for the space after
          );
          break;
        }

        case "QuoteMark": {
          // Style quote marker
          decorations.push(
            Decoration.mark({ class: "cm-live-quote-mark" }).range(from, to)
          );
          break;
        }

        case "ListMark": {
          // Style list markers
          decorations.push(
            Decoration.mark({ class: "cm-live-list-mark" }).range(from, to)
          );
          break;
        }

        case "HorizontalRule": {
          // Replace --- with styled hr
          decorations.push(
            Decoration.replace({
              widget: new InlineWidget(
                '<hr class="cm-live-hr" />',
                "cm-live-hr-wrapper"
              ),
            }).range(from, to)
          );
          break;
        }
      }
    },
  });

  // Sort decorations by position
  decorations.sort((a, b) => a.from - b.from);

  // Filter out overlapping decorations
  const filtered: Range<Decoration>[] = [];
  let lastEnd = -1;
  for (const dec of decorations) {
    if (dec.from >= lastEnd) {
      filtered.push(dec);
      lastEnd = dec.to;
    }
  }

  return RangeSet.of(filtered);
}

// Live preview plugin
export const createLivePreviewPlugin = () =>
  ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = createLivePreviewDecorations(view);
      }

      update(update: ViewUpdate) {
        if (
          update.docChanged ||
          update.selectionSet ||
          update.viewportChanged
        ) {
          this.decorations = createLivePreviewDecorations(update.view);
        }
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );

// CSS for live preview
export const livePreviewTheme = EditorView.baseTheme({
  ".cm-live-bold": {
    fontWeight: "bold",
  },
  ".cm-live-italic": {
    fontStyle: "italic",
  },
  ".cm-live-strikethrough": {
    textDecoration: "line-through",
  },
  ".cm-live-code": {
    backgroundColor: "var(--muted)",
    padding: "0.1em 0.3em",
    borderRadius: "3px",
    fontFamily: "monospace",
    fontSize: "0.9em",
  },
  ".cm-live-link": {
    color: "var(--primary)",
    textDecoration: "underline",
    cursor: "pointer",
  },
  ".cm-live-link:hover": {
    opacity: "0.8",
  },
  ".cm-live-image": {
    maxWidth: "100%",
    maxHeight: "200px",
    borderRadius: "4px",
    verticalAlign: "middle",
  },
  ".cm-live-quote-mark": {
    color: "var(--muted-foreground)",
  },
  ".cm-live-list-mark": {
    color: "var(--muted-foreground)",
  },
  ".cm-live-hr": {
    border: "none",
    borderTop: "2px solid var(--border)",
    margin: "1em 0",
  },
  ".cm-live-hr-wrapper": {
    display: "block",
  },
});

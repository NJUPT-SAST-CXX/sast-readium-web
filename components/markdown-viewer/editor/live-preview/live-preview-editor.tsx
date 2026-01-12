"use client";

import {
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { EditorState, Extension } from "@codemirror/state";
import {
  EditorView,
  lineNumbers,
  highlightActiveLineGutter,
  keymap,
} from "@codemirror/view";
import { indentOnInput, bracketMatching } from "@codemirror/language";
import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { cn } from "@/lib/utils";
import { createMarkdownExtensions } from "./markdown-extensions";
import {
  createLivePreviewPlugin,
  livePreviewTheme,
} from "./live-preview-plugin";

export interface LivePreviewEditorProps {
  value: string;
  onChange?: (value: string) => void;
  onSave?: (value: string) => void;
  className?: string;
  placeholder?: string;
  readOnly?: boolean;
  autoFocus?: boolean;
  lineNumbers?: boolean;
  lineWrapping?: boolean;
  livePreview?: boolean;
  minHeight?: string;
  maxHeight?: string;
}

export interface LivePreviewEditorRef {
  focus: () => void;
  getValue: () => string;
  setValue: (value: string) => void;
  insertText: (text: string) => void;
  getView: () => EditorView | null;
}

// Theme for the editor
const baseTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "14px",
    fontFamily: "var(--font-mono, ui-monospace, monospace)",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-scroller": {
    overflow: "auto",
    fontFamily: "inherit",
  },
  ".cm-content": {
    padding: "16px",
    caretColor: "var(--foreground)",
  },
  ".cm-line": {
    padding: "0 4px",
    lineHeight: "1.6",
  },
  ".cm-activeLine": {
    backgroundColor: "var(--muted)",
  },
  ".cm-gutters": {
    backgroundColor: "var(--background)",
    color: "var(--muted-foreground)",
    border: "none",
    borderRight: "1px solid var(--border)",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "var(--muted)",
  },
  ".cm-cursor": {
    borderLeftColor: "var(--foreground)",
    borderLeftWidth: "2px",
  },
  ".cm-selectionBackground": {
    backgroundColor: "var(--accent) !important",
  },
  "&.cm-focused .cm-selectionBackground": {
    backgroundColor: "var(--accent) !important",
  },
  ".cm-placeholder": {
    color: "var(--muted-foreground)",
    fontStyle: "italic",
  },
});

// Dark theme variant
const darkTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "var(--background)",
      color: "var(--foreground)",
    },
  },
  { dark: true }
);

export const LivePreviewEditor = forwardRef<
  LivePreviewEditorRef,
  LivePreviewEditorProps
>(function LivePreviewEditor(
  {
    value,
    onChange,
    onSave,
    className,
    placeholder,
    readOnly = false,
    autoFocus = false,
    lineNumbers: showLineNumbers = false,
    lineWrapping = true,
    livePreview = true,
    minHeight = "200px",
    maxHeight,
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const valueRef = useRef(value);

  // Update value ref when value prop changes
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Create extensions
  const createExtensions = useCallback((): Extension[] => {
    const extensions: Extension[] = [
      baseTheme,
      darkTheme,
      ...createMarkdownExtensions({
        highlightActiveLine: true,
        bracketMatching: true,
        autocompletion: true,
        history: true,
      }),
      indentOnInput(),
      bracketMatching(),
      keymap.of([
        ...defaultKeymap,
        indentWithTab,
        {
          key: "Mod-s",
          run: (view) => {
            onSave?.(view.state.doc.toString());
            return true;
          },
        },
      ]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newValue = update.state.doc.toString();
          if (newValue !== valueRef.current) {
            valueRef.current = newValue;
            onChange?.(newValue);
          }
        }
      }),
    ];

    // Line numbers
    if (showLineNumbers) {
      extensions.push(lineNumbers());
      extensions.push(highlightActiveLineGutter());
    }

    // Line wrapping
    if (lineWrapping) {
      extensions.push(EditorView.lineWrapping);
    }

    // Read-only mode
    if (readOnly) {
      extensions.push(EditorState.readOnly.of(true));
    }

    // Placeholder
    if (placeholder) {
      extensions.push(
        EditorView.contentAttributes.of({ "aria-placeholder": placeholder })
      );
    }

    // Live preview
    if (livePreview) {
      extensions.push(createLivePreviewPlugin());
      extensions.push(livePreviewTheme);
    }

    return extensions;
  }, [
    showLineNumbers,
    lineWrapping,
    readOnly,
    placeholder,
    livePreview,
    onChange,
    onSave,
  ]);

  // Initialize editor
  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: createExtensions(),
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    if (autoFocus) {
      view.focus();
    }

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value changes
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentValue = view.state.doc.toString();
    if (value !== currentValue && value !== valueRef.current) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentValue.length,
          insert: value,
        },
      });
      valueRef.current = value;
    }
  }, [value]);

  // Expose methods via ref
  useImperativeHandle(
    ref,
    () => ({
      focus: () => viewRef.current?.focus(),
      getValue: () => viewRef.current?.state.doc.toString() ?? "",
      setValue: (newValue: string) => {
        const view = viewRef.current;
        if (view) {
          view.dispatch({
            changes: {
              from: 0,
              to: view.state.doc.length,
              insert: newValue,
            },
          });
        }
      },
      insertText: (text: string) => {
        const view = viewRef.current;
        if (view) {
          const pos = view.state.selection.main.head;
          view.dispatch({
            changes: { from: pos, to: pos, insert: text },
            selection: { anchor: pos + text.length },
          });
        }
      },
      getView: () => viewRef.current,
    }),
    []
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded-md border bg-background",
        className
      )}
      style={{
        minHeight,
        maxHeight,
      }}
    />
  );
});

"use client";

import { useState, useCallback, useMemo } from "react";
import { Plus, Minus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface TableEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (markdown: string) => void;
  initialData?: string[][];
}

// ============================================================================
// Table Editor Component
// ============================================================================

export function TableEditor({
  open,
  onOpenChange,
  onInsert,
  initialData,
}: TableEditorProps) {
  const defaultData = useMemo(
    () => [
      ["Header 1", "Header 2", "Header 3"],
      ["Cell 1", "Cell 2", "Cell 3"],
    ],
    []
  );

  const [data, setData] = useState<string[][]>(initialData || defaultData);

  // Reset data when dialog opens
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (newOpen) {
        setData(initialData || defaultData);
      }
      onOpenChange(newOpen);
    },
    [initialData, onOpenChange, defaultData]
  );

  // Update cell value
  const updateCell = useCallback((row: number, col: number, value: string) => {
    setData((prev) => {
      const newData = prev.map((r) => [...r]);
      newData[row][col] = value;
      return newData;
    });
  }, []);

  // Add row
  const addRow = useCallback(() => {
    setData((prev) => {
      const cols = prev[0]?.length || 3;
      return [...prev, Array(cols).fill("")];
    });
  }, []);

  // Remove row
  const removeRow = useCallback((index: number) => {
    setData((prev) => {
      if (prev.length <= 2) return prev; // Keep at least header + 1 row
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // Add column
  const addColumn = useCallback(() => {
    setData((prev) => {
      return prev.map((row, i) => [
        ...row,
        i === 0 ? `Header ${row.length + 1}` : "",
      ]);
    });
  }, []);

  // Remove column
  const removeColumn = useCallback((index: number) => {
    setData((prev) => {
      if (prev[0].length <= 1) return prev; // Keep at least 1 column
      return prev.map((row) => row.filter((_, i) => i !== index));
    });
  }, []);

  // Generate markdown
  const generateMarkdown = useCallback(() => {
    if (data.length === 0 || data[0].length === 0) return "";

    const lines: string[] = [];
    const cols = data[0].length;

    // Header row
    lines.push(`| ${data[0].join(" | ")} |`);

    // Separator row
    lines.push(`| ${Array(cols).fill("---").join(" | ")} |`);

    // Data rows
    for (let i = 1; i < data.length; i++) {
      lines.push(`| ${data[i].join(" | ")} |`);
    }

    return lines.join("\n");
  }, [data]);

  // Handle insert
  const handleInsert = useCallback(() => {
    const markdown = generateMarkdown();
    onInsert(markdown);
    onOpenChange(false);
  }, [generateMarkdown, onInsert, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Table Editor</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {/* Table grid */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <tbody>
                {data.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, colIndex) => (
                      <td key={colIndex} className="p-1">
                        <Input
                          value={cell}
                          onChange={(e) =>
                            updateCell(rowIndex, colIndex, e.target.value)
                          }
                          className={cn(
                            "text-sm",
                            rowIndex === 0 && "font-semibold bg-muted"
                          )}
                          placeholder={rowIndex === 0 ? "Header" : "Cell"}
                        />
                      </td>
                    ))}
                    {/* Row actions */}
                    <td className="p-1 w-8">
                      {rowIndex > 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeRow(rowIndex)}
                          title="Remove row"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {/* Column remove buttons */}
                <tr>
                  {data[0]?.map((_, colIndex) => (
                    <td key={colIndex} className="p-1 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeColumn(colIndex)}
                        title="Remove column"
                        disabled={data[0].length <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                    </td>
                  ))}
                  <td />
                </tr>
              </tbody>
            </table>
          </div>

          {/* Add buttons */}
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={addRow}>
              <Plus className="h-4 w-4 mr-1" />
              Add Row
            </Button>
            <Button variant="outline" size="sm" onClick={addColumn}>
              <Plus className="h-4 w-4 mr-1" />
              Add Column
            </Button>
          </div>

          {/* Preview */}
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Preview:</p>
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
              {generateMarkdown()}
            </pre>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleInsert}>Insert Table</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

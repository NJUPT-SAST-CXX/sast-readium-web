"use client";

import { Palette } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface AnnotationColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  className?: string;
}

const PRESET_COLORS = [
  { name: "Yellow", value: "#ffff00" },
  { name: "Orange", value: "#ff9800" },
  { name: "Red", value: "#ff6b6b" },
  { name: "Pink", value: "#ec4899" },
  { name: "Purple", value: "#a855f7" },
  { name: "Blue", value: "#4dabf7" },
  { name: "Cyan", value: "#22d3ee" },
  { name: "Green", value: "#22c55e" },
  { name: "Lime", value: "#84cc16" },
  { name: "Black", value: "#000000" },
  { name: "Gray", value: "#6b7280" },
  { name: "White", value: "#ffffff" },
];

export function AnnotationColorPicker({
  selectedColor,
  onColorChange,
  className,
}: AnnotationColorPickerProps) {
  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-1", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 rounded-md border border-border p-1">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <div className="flex gap-0.5">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => onColorChange(color.value)}
                    className={cn(
                      "h-5 w-5 rounded border-2 transition-all hover:scale-110",
                      selectedColor === color.value
                        ? "border-primary ring-2 ring-primary ring-offset-1"
                        : "border-transparent hover:border-border"
                    )}
                    style={{
                      backgroundColor: color.value,
                      boxShadow:
                        color.value === "#ffffff"
                          ? "inset 0 0 0 1px #e5e7eb"
                          : undefined,
                    }}
                    title={color.name}
                    aria-label={`Select ${color.name} color`}
                  />
                ))}
              </div>
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => onColorChange(e.target.value)}
                className="h-5 w-8 cursor-pointer rounded border border-border"
                title="Custom color"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>Select annotation color</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

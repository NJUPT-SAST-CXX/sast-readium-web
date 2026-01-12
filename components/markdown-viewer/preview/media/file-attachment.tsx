"use client";

import { useMemo } from "react";
import { File, Download, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface FileAttachmentProps {
  src: string;
  name?: string;
  size?: string;
  className?: string;
}

export function FileAttachment({
  src,
  name,
  size,
  className,
}: FileAttachmentProps) {
  const fileName = useMemo(() => {
    if (name) return name;
    try {
      const url = new URL(src, window.location.origin);
      return url.pathname.split("/").pop() || "file";
    } catch {
      return src.split("/").pop() || "file";
    }
  }, [name, src]);

  const extension = fileName.split(".").pop()?.toUpperCase() || "";

  return (
    <div
      className={cn(
        "my-4 flex items-center gap-3 rounded-lg border bg-muted/30 p-3 hover:bg-muted/50 transition-colors",
        className
      )}
    >
      {/* File icon */}
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <File className="h-5 w-5 text-primary" />
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{fileName}</div>
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          {extension && <span className="uppercase">{extension}</span>}
          {size && (
            <>
              <span>·</span>
              <span>{size}</span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <a href={src} download={fileName}>
            <Download className="h-4 w-4" />
          </a>
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <a href={src} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}

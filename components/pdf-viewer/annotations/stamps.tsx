"use client";

import { CheckCircle, XCircle, Lock, FileText, Badge, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AnnotationStamp } from "@/lib/pdf";

interface AnnotationStampsProps {
  onStampSelect: (stamp: AnnotationStamp) => void;
  className?: string;
}

const STAMPS: Array<{
  type: AnnotationStamp;
  icon: React.ReactNode;
  label: string;
  color: string;
}> = [
  {
    type: "approved",
    icon: <CheckCircle className="h-4 w-4" />,
    label: "Approved",
    color: "#22c55e",
  },
  {
    type: "rejected",
    icon: <XCircle className="h-4 w-4" />,
    label: "Rejected",
    color: "#ef4444",
  },
  {
    type: "confidential",
    icon: <Lock className="h-4 w-4" />,
    label: "Confidential",
    color: "#f59e0b",
  },
  {
    type: "draft",
    icon: <FileText className="h-4 w-4" />,
    label: "Draft",
    color: "#6366f1",
  },
  {
    type: "final",
    icon: <Badge className="h-4 w-4" />,
    label: "Final",
    color: "#10b981",
  },
  {
    type: "reviewed",
    icon: <Eye className="h-4 w-4" />,
    label: "Reviewed",
    color: "#3b82f6",
  },
];

export function AnnotationStamps({
  onStampSelect,
  className,
}: AnnotationStampsProps) {
  return (
    <TooltipProvider>
      <div className={className}>
        <div className="text-xs font-medium text-muted-foreground mb-2">
          Stamps:
        </div>
        <div className="flex flex-wrap gap-1">
          {STAMPS.map((stamp) => (
            <Tooltip key={stamp.type}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStampSelect(stamp.type)}
                  className="h-8 gap-1"
                  style={{ borderColor: stamp.color }}
                >
                  <span style={{ color: stamp.color }}>{stamp.icon}</span>
                  <span className="text-xs">{stamp.label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add {stamp.label} stamp</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}

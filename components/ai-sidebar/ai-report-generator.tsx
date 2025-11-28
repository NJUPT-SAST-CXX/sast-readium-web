"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAIChatStore } from "@/lib/ai-chat-store";
import {
  useReportTemplate,
  REPORT_TEMPLATES,
  type ReportTemplateType,
} from "@/hooks/use-report-template";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FileText,
  AlertCircle,
  Copy,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { Loader } from "@/components/ai-elements/loader";
import { cn } from "@/lib/utils";

interface AIReportGeneratorProps {
  className?: string;
}

export function AIReportGenerator({ className }: AIReportGeneratorProps) {
  const { t } = useTranslation();
  const { pdfContext } = useAIChatStore();
  const reportTemplate = useReportTemplate();

  const [selectedTemplate, setSelectedTemplate] =
    useState<ReportTemplateType>("executive_summary");
  const [customInstructions, setCustomInstructions] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set([0])
  );

  const hasContent = !!pdfContext?.pageText || !!pdfContext?.selectedText;
  const content = pdfContext?.selectedText || pdfContext?.pageText || "";

  const handleGenerate = async () => {
    await reportTemplate.generate(
      content,
      selectedTemplate,
      selectedTemplate === "custom" ? customInstructions : undefined
    );
  };

  const handleDownloadMarkdown = () => {
    if (reportTemplate.result?.markdown) {
      const blob = new Blob([reportTemplate.result.markdown], {
        type: "text/markdown",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${reportTemplate.result.title.replace(/[^a-z0-9]/gi, "_")}.md`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const selectedTemplateInfo = REPORT_TEMPLATES.find(
    (t) => t.id === selectedTemplate
  );

  return (
    <Card className={cn("border-border/50 shadow-sm", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-sm">
              {t("ai.report_generator", "Report Generator")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t(
                "ai.report_generator_description",
                "Generate structured reports from PDF content"
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Template Selection */}
        <div className="space-y-2">
          <Label className="text-xs">
            {t("ai.report_template", "Report Template")}
          </Label>
          <Select
            value={selectedTemplate}
            onValueChange={(v) => setSelectedTemplate(v as ReportTemplateType)}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REPORT_TEMPLATES.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  <div className="flex items-center gap-2">
                    <span>{template.icon}</span>
                    <span>{template.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedTemplateInfo && (
            <p className="text-xs text-muted-foreground">
              {selectedTemplateInfo.description}
            </p>
          )}
        </div>

        {/* Custom Instructions (for custom template) */}
        {selectedTemplate === "custom" && (
          <div className="space-y-2">
            <Label className="text-xs">
              {t("ai.custom_instructions", "Custom Instructions")}
            </Label>
            <Textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder={t(
                "ai.custom_instructions_placeholder",
                "Describe what kind of report you want to generate..."
              )}
              rows={3}
              className="resize-none text-sm"
            />
          </div>
        )}

        {/* Generate Button */}
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handleGenerate}
          disabled={
            reportTemplate.isGenerating ||
            !hasContent ||
            (selectedTemplate === "custom" && !customInstructions.trim())
          }
        >
          {reportTemplate.isGenerating ? (
            <Loader className="w-4 h-4" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {t("ai.generate_report", "Generate Report")}
        </Button>

        {/* No Content Warning */}
        {!hasContent && (
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-xs">
              {t(
                "ai.report_no_content",
                "Select text or load a PDF page to generate reports"
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Display */}
        {reportTemplate.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {reportTemplate.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Streaming Content Preview */}
        {reportTemplate.isGenerating && reportTemplate.streamingContent && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader className="w-3 h-3" />
              {t("ai.generating_report", "Generating report...")}
            </div>
            <ScrollArea className="h-[150px] rounded-md border p-2">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <pre className="text-xs whitespace-pre-wrap font-sans">
                  {reportTemplate.streamingContent}
                </pre>
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Report Result */}
        {reportTemplate.result && !reportTemplate.isGenerating && (
          <div className="space-y-3">
            {/* Report Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-sm font-medium">
                  {reportTemplate.result.title}
                </h4>
                {reportTemplate.result.summary && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {reportTemplate.result.summary}
                  </p>
                )}
              </div>
              <Badge variant="secondary" className="text-[10px] shrink-0">
                {reportTemplate.result.metadata.wordCount} words
              </Badge>
            </div>

            {/* Key Points */}
            {reportTemplate.result.keyPoints.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs font-medium">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  {t("ai.key_points", "Key Points")}
                </div>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {reportTemplate.result.keyPoints
                    .slice(0, 5)
                    .map((point, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-primary">•</span>
                        <span className="line-clamp-2">{point}</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {/* Action Items */}
            {reportTemplate.result.actionItems &&
              reportTemplate.result.actionItems.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs font-medium">
                    <Clock className="w-3 h-3 text-blue-500" />
                    {t("ai.action_items", "Action Items")}
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    {reportTemplate.result.actionItems
                      .slice(0, 3)
                      .map((item, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-blue-500">☐</span>
                          <span className="line-clamp-1">{item}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}

            {/* Sections (Collapsible) */}
            {reportTemplate.result.sections.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium">
                  {t("ai.report_sections", "Sections")}
                </div>
                <div className="space-y-1">
                  {reportTemplate.result.sections
                    .slice(0, 5)
                    .map((section, i) => (
                      <Collapsible
                        key={i}
                        open={expandedSections.has(i)}
                        onOpenChange={() => toggleSection(i)}
                      >
                        <CollapsibleTrigger className="flex items-center gap-1 w-full text-left text-xs hover:bg-muted/50 rounded px-1 py-0.5">
                          {expandedSections.has(i) ? (
                            <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ChevronRight className="w-3 h-3" />
                          )}
                          <span className="font-medium truncate">
                            {section.title}
                          </span>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pl-4 pt-1">
                          {section.content && (
                            <p className="text-xs text-muted-foreground line-clamp-3">
                              {section.content}
                            </p>
                          )}
                          {section.items && section.items.length > 0 && (
                            <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                              {section.items.slice(0, 3).map((item, j) => (
                                <li key={j} className="flex items-start gap-1">
                                  <span className="text-primary">•</span>
                                  <span className="line-clamp-1">{item}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                </div>
              </div>
            )}

            {/* Full Markdown Preview */}
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <ChevronRight className="w-3 h-3" />
                {t("ai.view_full_report", "View Full Report")}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ScrollArea className="h-[200px] mt-2 rounded-md border p-2">
                  <pre className="text-xs whitespace-pre-wrap font-sans">
                    {reportTemplate.result.markdown}
                  </pre>
                </ScrollArea>
              </CollapsibleContent>
            </Collapsible>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={reportTemplate.copyAsMarkdown}
                      className="text-xs h-7"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      {t("ai.copy", "Copy")}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("ai.copy_markdown", "Copy as Markdown")}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadMarkdown}
                className="text-xs h-7"
              >
                <Download className="w-3 h-3 mr-1" />
                {t("ai.download_md", "Download .md")}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={reportTemplate.clearResult}
                className="text-xs h-7"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                {t("ai.clear", "Clear")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

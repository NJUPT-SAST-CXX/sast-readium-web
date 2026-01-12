"use client";

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAIChatStore } from "@/lib/ai/core";
import {
  useChartInsight,
  type ChartType,
  type ChartInsightResult,
} from "@/hooks/use-chart-insight";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BarChart3,
  LineChart,
  PieChart,
  AreaChart,
  ScatterChart,
  AlertCircle,
  Download,
  Copy,
  RefreshCw,
  Lightbulb,
  Table,
  Code,
  TrendingUp,
} from "lucide-react";
import { Loader } from "@/components/ai/elements/loader";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart as RechartsAreaChart,
  Area,
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";

interface AIChartInsightProps {
  className?: string;
}

const CHART_TYPE_OPTIONS: {
  type: ChartType;
  icon: React.ReactNode;
  label: string;
}[] = [
  { type: "bar", icon: <BarChart3 className="w-4 h-4" />, label: "Bar" },
  { type: "line", icon: <LineChart className="w-4 h-4" />, label: "Line" },
  { type: "pie", icon: <PieChart className="w-4 h-4" />, label: "Pie" },
  { type: "area", icon: <AreaChart className="w-4 h-4" />, label: "Area" },
  {
    type: "scatter",
    icon: <ScatterChart className="w-4 h-4" />,
    label: "Scatter",
  },
];

export function AIChartInsight({ className }: AIChartInsightProps) {
  const { t } = useTranslation();
  const { pdfContext } = useAIChatStore();
  const chartInsight = useChartInsight();
  const [activeTab, setActiveTab] = useState<"chart" | "data" | "json">(
    "chart"
  );

  const hasContent = !!pdfContext?.pageText || !!pdfContext?.selectedText;
  const content = pdfContext?.selectedText || pdfContext?.pageText || "";

  const handleGenerate = async () => {
    await chartInsight.generate(content);
  };

  const handleChangeChartType = async (newType: ChartType) => {
    await chartInsight.regenerate(newType);
  };

  const handleCopyData = async () => {
    if (chartInsight.result) {
      const csvData = convertToCSV(chartInsight.result);
      await navigator.clipboard.writeText(csvData);
    }
  };

  const handleCopyJson = async () => {
    if (chartInsight.result?.rawJson) {
      await navigator.clipboard.writeText(chartInsight.result.rawJson);
    }
  };

  const handleDownloadChart = () => {
    // Get the SVG element and convert to downloadable image
    const svgElement = document.querySelector(".recharts-wrapper svg");
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(svgBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `chart-${Date.now()}.svg`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Card className={cn("border-border/50 shadow-sm", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-sm">
              {t("ai.chart_insight", "Chart Insight")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t(
                "ai.chart_insight_description",
                "Extract data and generate charts from PDF content"
              )}
            </CardDescription>
          </div>
          {chartInsight.result && (
            <Badge variant="secondary" className="text-[10px]">
              {chartInsight.result.chartType}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Generate Button */}
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handleGenerate}
          disabled={chartInsight.isGenerating || !hasContent}
        >
          {chartInsight.isGenerating ? (
            <Loader className="w-4 h-4" />
          ) : (
            <BarChart3 className="w-4 h-4" />
          )}
          {t("ai.generate_chart", "Generate Chart from Content")}
        </Button>

        {/* No Content Warning */}
        {!hasContent && (
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-xs">
              {t(
                "ai.chart_no_content",
                "Select text or load a PDF page to generate charts"
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Display */}
        {chartInsight.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {chartInsight.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Chart Result */}
        {chartInsight.result && (
          <div className="space-y-3">
            {/* Chart Type Selector */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs text-muted-foreground mr-1">
                {t("ai.chart_type", "Type:")}
              </span>
              <TooltipProvider>
                {CHART_TYPE_OPTIONS.map((option) => (
                  <Tooltip key={option.type}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={
                          chartInsight.result?.chartType === option.type
                            ? "default"
                            : "ghost"
                        }
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleChangeChartType(option.type)}
                        disabled={chartInsight.isGenerating}
                      >
                        {option.icon}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{option.label}</TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>

            {/* Title and Description */}
            <div>
              <h4 className="text-sm font-medium">
                {chartInsight.result.title}
              </h4>
              {chartInsight.result.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {chartInsight.result.description}
                </p>
              )}
            </div>

            {/* Tabs for Chart/Data/JSON */}
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as typeof activeTab)}
            >
              <TabsList className="grid w-full grid-cols-3 h-8">
                <TabsTrigger value="chart" className="text-xs gap-1">
                  <BarChart3 className="w-3 h-3" />
                  {t("ai.chart", "Chart")}
                </TabsTrigger>
                <TabsTrigger value="data" className="text-xs gap-1">
                  <Table className="w-3 h-3" />
                  {t("ai.data", "Data")}
                </TabsTrigger>
                <TabsTrigger value="json" className="text-xs gap-1">
                  <Code className="w-3 h-3" />
                  JSON
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chart" className="mt-2">
                <div className="h-[200px] w-full">
                  <ChartRenderer result={chartInsight.result} />
                </div>
              </TabsContent>

              <TabsContent value="data" className="mt-2">
                <ScrollArea className="h-[200px]">
                  <DataTable result={chartInsight.result} />
                </ScrollArea>
              </TabsContent>

              <TabsContent value="json" className="mt-2">
                <ScrollArea className="h-[200px]">
                  <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                    {chartInsight.result.rawJson}
                  </pre>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            {/* Insights */}
            {chartInsight.result.insights.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs font-medium">
                  <Lightbulb className="w-3 h-3 text-yellow-500" />
                  {t("ai.insights", "Insights")}
                </div>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {chartInsight.result.insights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-primary">•</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadChart}
                className="text-xs h-7"
              >
                <Download className="w-3 h-3 mr-1" />
                {t("ai.download_svg", "SVG")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyData}
                className="text-xs h-7"
              >
                <Copy className="w-3 h-3 mr-1" />
                {t("ai.copy_csv", "CSV")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyJson}
                className="text-xs h-7"
              >
                <Copy className="w-3 h-3 mr-1" />
                JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={chartInsight.clearResult}
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

// Chart Renderer Component
function ChartRenderer({ result }: { result: ChartInsightResult }) {
  const colors = useMemo(
    () => result.series.map((s) => s.color || "#8884d8"),
    [result.series]
  );

  const commonProps = {
    data: result.data,
    margin: { top: 5, right: 5, left: 0, bottom: 5 },
  };

  switch (result.chartType) {
    case "bar":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey={result.xAxisKey}
              tick={{ fontSize: 10 }}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} width={30} />
            <RechartsTooltip
              contentStyle={{ fontSize: 11 }}
              labelStyle={{ fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {result.series.map((s, i) => (
              <Bar
                key={s.dataKey}
                dataKey={s.dataKey}
                name={s.name}
                fill={colors[i]}
                radius={[2, 2, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );

    case "line":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey={result.xAxisKey}
              tick={{ fontSize: 10 }}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} width={30} />
            <RechartsTooltip
              contentStyle={{ fontSize: 11 }}
              labelStyle={{ fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {result.series.map((s, i) => (
              <Line
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                name={s.name}
                stroke={colors[i]}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      );

    case "pie":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={result.data}
              dataKey={result.series[0]?.dataKey || "value"}
              nameKey={result.xAxisKey}
              cx="50%"
              cy="50%"
              outerRadius={70}
              label={({ name, percent }) =>
                `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
              }
              labelLine={{ strokeWidth: 1 }}
            >
              {result.data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
            <RechartsTooltip contentStyle={{ fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
          </RechartsPieChart>
        </ResponsiveContainer>
      );

    case "area":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <RechartsAreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey={result.xAxisKey}
              tick={{ fontSize: 10 }}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} width={30} />
            <RechartsTooltip
              contentStyle={{ fontSize: 11 }}
              labelStyle={{ fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {result.series.map((s, i) => (
              <Area
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                name={s.name}
                stroke={colors[i]}
                fill={colors[i]}
                fillOpacity={0.3}
              />
            ))}
          </RechartsAreaChart>
        </ResponsiveContainer>
      );

    case "scatter":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <RechartsScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey={result.xAxisKey}
              tick={{ fontSize: 10 }}
              tickLine={false}
              type="category"
            />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} width={30} />
            <RechartsTooltip
              contentStyle={{ fontSize: 11 }}
              labelStyle={{ fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {result.series.map((s, i) => (
              <Scatter
                key={s.dataKey}
                name={s.name}
                dataKey={s.dataKey}
                fill={colors[i]}
              />
            ))}
          </RechartsScatterChart>
        </ResponsiveContainer>
      );

    default:
      return null;
  }
}

// Data Table Component
function DataTable({ result }: { result: ChartInsightResult }) {
  const columns = [result.xAxisKey, ...result.series.map((s) => s.dataKey)];
  const headers = [
    result.xAxisLabel || result.xAxisKey,
    ...result.series.map((s) => s.name),
  ];

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b">
          {headers.map((header, i) => (
            <th key={i} className="text-left py-1 px-2 font-medium">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {result.data.map((row, i) => (
          <tr key={i} className="border-b border-border/50">
            {columns.map((col, j) => (
              <td key={j} className="py-1 px-2">
                {row[col]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Helper function to convert data to CSV
function convertToCSV(result: ChartInsightResult): string {
  const columns = [result.xAxisKey, ...result.series.map((s) => s.dataKey)];
  const headers = [
    result.xAxisLabel || result.xAxisKey,
    ...result.series.map((s) => s.name),
  ];

  const csvRows = [headers.join(",")];

  for (const row of result.data) {
    const values = columns.map((col) => {
      const val = row[col];
      // Escape commas and quotes in string values
      if (typeof val === "string" && (val.includes(",") || val.includes('"'))) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}

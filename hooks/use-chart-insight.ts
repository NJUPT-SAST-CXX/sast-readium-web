/**
 * Hook for AI-powered chart generation from PDF content
 * Extracts structured data from PDF text and generates interactive charts
 */

import { useState, useCallback } from "react";
import { useAIChatStore } from "@/lib/ai/core";
import { chat, type AIServiceConfig } from "@/lib/ai/core";
import { getAPIKeySecurely } from "@/lib/platform";

// Chart data types
export type ChartType = "bar" | "line" | "pie" | "area" | "scatter";

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface ChartSeries {
  dataKey: string;
  name: string;
  color?: string;
}

export interface ChartInsightResult {
  chartType: ChartType;
  title: string;
  description: string;
  data: ChartDataPoint[];
  series: ChartSeries[];
  xAxisKey: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  insights: string[];
  rawJson: string;
}

export interface UseChartInsightReturn {
  isGenerating: boolean;
  error: string | null;
  result: ChartInsightResult | null;
  generate: (content: string, preferredType?: ChartType) => Promise<void>;
  clearResult: () => void;
  regenerate: (newType: ChartType) => Promise<void>;
}

// Default colors for chart series
const DEFAULT_COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#0088fe",
  "#00c49f",
  "#ffbb28",
  "#ff8042",
];

// System prompt for chart data extraction
const CHART_EXTRACTION_PROMPT = `You are a data analyst assistant. Your task is to extract structured data from text and suggest the best chart visualization.

IMPORTANT: You must respond with ONLY valid JSON, no markdown code blocks, no explanations before or after.

Analyze the provided text and:
1. Identify any numerical data, statistics, comparisons, or trends
2. Extract the data into a structured format suitable for charting
3. Suggest the most appropriate chart type
4. Provide insights about the data

Response format (JSON only):
{
  "chartType": "bar" | "line" | "pie" | "area" | "scatter",
  "title": "Chart title",
  "description": "Brief description of what the chart shows",
  "data": [
    {"name": "Category1", "value": 100, "series2": 50},
    {"name": "Category2", "value": 200, "series2": 75}
  ],
  "series": [
    {"dataKey": "value", "name": "Series 1"},
    {"dataKey": "series2", "name": "Series 2"}
  ],
  "xAxisKey": "name",
  "xAxisLabel": "X Axis Label",
  "yAxisLabel": "Y Axis Label",
  "insights": ["Insight 1", "Insight 2"]
}

Rules:
- For pie charts, use single series with "value" as dataKey
- For comparisons over time, prefer line or area charts
- For category comparisons, prefer bar charts
- For distribution data, prefer scatter or pie charts
- Always include at least 2 data points
- Data values must be numbers
- If no chartable data is found, return: {"error": "No chartable data found in the provided text"}`;

export function useChartInsight(): UseChartInsightReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ChartInsightResult | null>(null);
  const [lastContent, setLastContent] = useState<string>("");

  const { settings } = useAIChatStore();

  const generate = useCallback(
    async (content: string, preferredType?: ChartType) => {
      if (!content.trim()) {
        setError("No content provided for chart generation");
        return;
      }

      setIsGenerating(true);
      setError(null);
      setLastContent(content);

      try {
        // Get API key
        let apiKey = settings.apiKeys[settings.provider];
        if (!apiKey) {
          apiKey = (await getAPIKeySecurely(settings.provider)) || "";
        }

        if (!apiKey) {
          throw new Error(
            `Please configure your ${settings.provider.toUpperCase()} API key`
          );
        }

        const config: AIServiceConfig = {
          provider: settings.provider,
          model: settings.model,
          apiKey,
          temperature: 0.3, // Lower temperature for more consistent JSON output
          maxTokens: 2000,
        };

        const userPrompt = preferredType
          ? `Extract data and create a ${preferredType} chart from this text:\n\n${content}`
          : `Extract data and suggest the best chart type for this text:\n\n${content}`;

        const response = await chat(config, {
          messages: [
            {
              id: "chart-extract",
              role: "user",
              content: userPrompt,
            },
          ],
          systemPrompt: CHART_EXTRACTION_PROMPT,
        });

        // Parse JSON response
        let parsed: ChartInsightResult & { error?: string };
        try {
          // Try to extract JSON from the response (handle potential markdown code blocks)
          let jsonStr = response.trim();
          if (jsonStr.startsWith("```json")) {
            jsonStr = jsonStr.slice(7);
          } else if (jsonStr.startsWith("```")) {
            jsonStr = jsonStr.slice(3);
          }
          if (jsonStr.endsWith("```")) {
            jsonStr = jsonStr.slice(0, -3);
          }
          jsonStr = jsonStr.trim();

          parsed = JSON.parse(jsonStr);
        } catch {
          throw new Error("Failed to parse chart data from AI response");
        }

        if (parsed.error) {
          throw new Error(parsed.error);
        }

        // Validate required fields
        if (
          !parsed.data ||
          !Array.isArray(parsed.data) ||
          parsed.data.length === 0
        ) {
          throw new Error("No valid data extracted for chart");
        }

        // Add default colors to series
        const seriesWithColors = (parsed.series || []).map((s, i) => ({
          ...s,
          color: s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
        }));

        // If no series defined, create default
        if (seriesWithColors.length === 0) {
          seriesWithColors.push({
            dataKey: "value",
            name: "Value",
            color: DEFAULT_COLORS[0],
          });
        }

        setResult({
          chartType: parsed.chartType || "bar",
          title: parsed.title || "Chart",
          description: parsed.description || "",
          data: parsed.data,
          series: seriesWithColors,
          xAxisKey: parsed.xAxisKey || "name",
          xAxisLabel: parsed.xAxisLabel,
          yAxisLabel: parsed.yAxisLabel,
          insights: parsed.insights || [],
          rawJson: JSON.stringify(parsed, null, 2),
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Chart generation failed";
        setError(errorMessage);
      } finally {
        setIsGenerating(false);
      }
    },
    [settings]
  );

  const regenerate = useCallback(
    async (newType: ChartType) => {
      if (!lastContent) {
        setError("No previous content to regenerate");
        return;
      }
      await generate(lastContent, newType);
    },
    [lastContent, generate]
  );

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
    setLastContent("");
  }, []);

  return {
    isGenerating,
    error,
    result,
    generate,
    clearResult,
    regenerate,
  };
}

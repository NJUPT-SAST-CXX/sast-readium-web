/**
 * Tests for useChartInsight hook
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useChartInsight } from "./use-chart-insight";

// Mock dependencies
jest.mock("@/lib/ai/core", () => ({
  useAIChatStore: jest.fn(() => ({
    settings: {
      provider: "openai",
      model: "gpt-4",
      apiKeys: { openai: "test-key" },
    },
  })),
  chat: jest.fn(),
}));

jest.mock("@/lib/platform", () => ({
  getAPIKeySecurely: jest.fn().mockResolvedValue("test-api-key"),
}));

import { chat } from "@/lib/ai/core";

const mockChat = chat as jest.MockedFunction<typeof chat>;

describe("useChartInsight", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useChartInsight());

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.result).toBeNull();
  });

  it("should set error when content is empty", async () => {
    const { result } = renderHook(() => useChartInsight());

    await act(async () => {
      await result.current.generate("");
    });

    expect(result.current.error).toBe(
      "No content provided for chart generation"
    );
    expect(result.current.isGenerating).toBe(false);
  });

  it("should set error when content is only whitespace", async () => {
    const { result } = renderHook(() => useChartInsight());

    await act(async () => {
      await result.current.generate("   ");
    });

    expect(result.current.error).toBe(
      "No content provided for chart generation"
    );
  });

  it("should generate chart data from content", async () => {
    const mockResponse = JSON.stringify({
      chartType: "bar",
      title: "Sales Data",
      description: "Monthly sales comparison",
      data: [
        { name: "Jan", value: 100 },
        { name: "Feb", value: 150 },
      ],
      series: [{ dataKey: "value", name: "Sales" }],
      xAxisKey: "name",
      xAxisLabel: "Month",
      yAxisLabel: "Revenue",
      insights: ["Sales increased by 50%"],
    });

    mockChat.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useChartInsight());

    await act(async () => {
      await result.current.generate("Sales data: Jan 100, Feb 150");
    });

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.result).not.toBeNull();
    expect(result.current.result?.chartType).toBe("bar");
    expect(result.current.result?.title).toBe("Sales Data");
    expect(result.current.result?.data).toHaveLength(2);
  });

  it("should handle JSON wrapped in markdown code blocks", async () => {
    const mockResponse = `\`\`\`json
{
  "chartType": "pie",
  "title": "Distribution",
  "description": "Category distribution",
  "data": [{"name": "A", "value": 50}, {"name": "B", "value": 50}],
  "series": [{"dataKey": "value", "name": "Value"}],
  "xAxisKey": "name",
  "insights": []
}
\`\`\``;

    mockChat.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useChartInsight());

    await act(async () => {
      await result.current.generate("Category A: 50%, Category B: 50%");
    });

    await waitFor(() => {
      expect(result.current.result).not.toBeNull();
    });

    expect(result.current.result?.chartType).toBe("pie");
  });

  it("should handle error response from AI", async () => {
    const mockResponse = JSON.stringify({
      error: "No chartable data found in the provided text",
    });

    mockChat.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useChartInsight());

    await act(async () => {
      await result.current.generate("Random text without data");
    });

    await waitFor(() => {
      expect(result.current.error).toBe(
        "No chartable data found in the provided text"
      );
    });
  });

  it("should handle invalid JSON response", async () => {
    mockChat.mockResolvedValueOnce("This is not valid JSON");

    const { result } = renderHook(() => useChartInsight());

    await act(async () => {
      await result.current.generate("Some content");
    });

    await waitFor(() => {
      expect(result.current.error).toBe(
        "Failed to parse chart data from AI response"
      );
    });
  });

  it("should handle empty data array", async () => {
    const mockResponse = JSON.stringify({
      chartType: "bar",
      title: "Empty",
      data: [],
      series: [],
      xAxisKey: "name",
    });

    mockChat.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useChartInsight());

    await act(async () => {
      await result.current.generate("Some content");
    });

    await waitFor(() => {
      expect(result.current.error).toBe("No valid data extracted for chart");
    });
  });

  it("should add default colors to series", async () => {
    const mockResponse = JSON.stringify({
      chartType: "line",
      title: "Trend",
      data: [{ name: "A", value: 10 }],
      series: [{ dataKey: "value", name: "Value" }],
      xAxisKey: "name",
    });

    mockChat.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useChartInsight());

    await act(async () => {
      await result.current.generate("Trend data");
    });

    await waitFor(() => {
      expect(result.current.result).not.toBeNull();
    });

    expect(result.current.result?.series[0].color).toBeDefined();
  });

  it("should create default series when none provided", async () => {
    const mockResponse = JSON.stringify({
      chartType: "bar",
      title: "Data",
      data: [{ name: "A", value: 10 }],
      series: [],
      xAxisKey: "name",
    });

    mockChat.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useChartInsight());

    await act(async () => {
      await result.current.generate("Some data");
    });

    await waitFor(() => {
      expect(result.current.result).not.toBeNull();
    });

    expect(result.current.result?.series).toHaveLength(1);
    expect(result.current.result?.series[0].dataKey).toBe("value");
  });

  it("should use preferred chart type when specified", async () => {
    const mockResponse = JSON.stringify({
      chartType: "pie",
      title: "Pie Chart",
      data: [{ name: "A", value: 50 }],
      series: [{ dataKey: "value", name: "Value" }],
      xAxisKey: "name",
    });

    mockChat.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useChartInsight());

    await act(async () => {
      await result.current.generate("Data", "pie");
    });

    await waitFor(() => {
      expect(result.current.result).not.toBeNull();
    });

    // Verify the chat was called with preferred type in prompt
    expect(mockChat).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            content: expect.stringContaining("pie chart"),
          }),
        ]),
      })
    );
  });

  it("should clear result", async () => {
    const mockResponse = JSON.stringify({
      chartType: "bar",
      title: "Data",
      data: [{ name: "A", value: 10 }],
      series: [{ dataKey: "value", name: "Value" }],
      xAxisKey: "name",
    });

    mockChat.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useChartInsight());

    await act(async () => {
      await result.current.generate("Some data");
    });

    await waitFor(() => {
      expect(result.current.result).not.toBeNull();
    });

    act(() => {
      result.current.clearResult();
    });

    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("should regenerate with new chart type", async () => {
    const mockResponse1 = JSON.stringify({
      chartType: "bar",
      title: "Bar Chart",
      data: [{ name: "A", value: 10 }],
      series: [{ dataKey: "value", name: "Value" }],
      xAxisKey: "name",
    });

    const mockResponse2 = JSON.stringify({
      chartType: "line",
      title: "Line Chart",
      data: [{ name: "A", value: 10 }],
      series: [{ dataKey: "value", name: "Value" }],
      xAxisKey: "name",
    });

    mockChat.mockResolvedValueOnce(mockResponse1);
    mockChat.mockResolvedValueOnce(mockResponse2);

    const { result } = renderHook(() => useChartInsight());

    // First generation
    await act(async () => {
      await result.current.generate("Some data");
    });

    await waitFor(() => {
      expect(result.current.result?.chartType).toBe("bar");
    });

    // Regenerate with different type
    await act(async () => {
      await result.current.regenerate("line");
    });

    await waitFor(() => {
      expect(result.current.result?.chartType).toBe("line");
    });
  });

  it("should set error when regenerating without previous content", async () => {
    const { result } = renderHook(() => useChartInsight());

    await act(async () => {
      await result.current.regenerate("bar");
    });

    expect(result.current.error).toBe("No previous content to regenerate");
  });

  it("should handle chat API error", async () => {
    mockChat.mockRejectedValueOnce(new Error("API Error"));

    const { result } = renderHook(() => useChartInsight());

    await act(async () => {
      await result.current.generate("Some data");
    });

    await waitFor(() => {
      expect(result.current.error).toBe("API Error");
    });
  });

  it("should set isGenerating during generation", async () => {
    let resolveChat: (value: string) => void;
    const chatPromise = new Promise<string>((resolve) => {
      resolveChat = resolve;
    });
    mockChat.mockReturnValueOnce(chatPromise);

    const { result } = renderHook(() => useChartInsight());

    act(() => {
      result.current.generate("Some data");
    });

    // Should be generating
    expect(result.current.isGenerating).toBe(true);

    // Resolve the chat
    await act(async () => {
      resolveChat!(
        JSON.stringify({
          chartType: "bar",
          title: "Data",
          data: [{ name: "A", value: 10 }],
          series: [],
          xAxisKey: "name",
        })
      );
    });

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });
  });
});

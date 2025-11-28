/**
 * Hook for AI-powered structured report generation from PDF content
 * Generates formatted reports based on predefined templates
 */

import { useState, useCallback } from "react";
import { useAIChatStore } from "@/lib/ai-chat-store";
import { chatStream, type AIServiceConfig } from "@/lib/ai-service";
import { getAPIKeySecurely } from "@/lib/tauri-bridge-ai";

// Report template types
export type ReportTemplateType =
  | "meeting_notes"
  | "research_summary"
  | "business_report"
  | "literature_review"
  | "executive_summary"
  | "action_items"
  | "comparison_analysis"
  | "custom";

export interface ReportSection {
  title: string;
  content: string;
  items?: string[];
}

export interface ReportResult {
  templateType: ReportTemplateType;
  title: string;
  summary: string;
  sections: ReportSection[];
  keyPoints: string[];
  actionItems?: string[];
  metadata: {
    generatedAt: number;
    sourcePages?: number[];
    wordCount: number;
  };
  markdown: string;
}

export interface ReportTemplate {
  id: ReportTemplateType;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  outputFormat: string;
}

export interface UseReportTemplateReturn {
  isGenerating: boolean;
  error: string | null;
  result: ReportResult | null;
  streamingContent: string;
  templates: ReportTemplate[];
  generate: (
    content: string,
    templateType: ReportTemplateType,
    customInstructions?: string
  ) => Promise<void>;
  clearResult: () => void;
  copyAsMarkdown: () => Promise<void>;
}

// Predefined report templates
export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: "meeting_notes",
    name: "Meeting Notes",
    description: "Extract key decisions, action items, and discussion points",
    icon: "📝",
    systemPrompt: `You are a professional meeting notes assistant. Extract and organize meeting content into a structured format.
Focus on:
- Key decisions made
- Action items with owners and deadlines
- Discussion points and outcomes
- Follow-up items`,
    outputFormat: `# Meeting Notes: [Title]

## Summary
[Brief overview of the meeting]

## Key Decisions
- Decision 1
- Decision 2

## Action Items
| Item | Owner | Deadline |
|------|-------|----------|
| Task 1 | Person | Date |

## Discussion Points
### Topic 1
[Details]

## Next Steps
- Step 1
- Step 2`,
  },
  {
    id: "research_summary",
    name: "Research Summary",
    description: "Summarize research findings, methodology, and conclusions",
    icon: "🔬",
    systemPrompt: `You are a research analyst. Summarize research content into a clear, academic-style summary.
Focus on:
- Research objectives and questions
- Methodology used
- Key findings and data
- Conclusions and implications
- Limitations and future directions`,
    outputFormat: `# Research Summary: [Title]

## Abstract
[Brief summary]

## Research Questions
1. Question 1
2. Question 2

## Methodology
[Description of methods]

## Key Findings
### Finding 1
[Details with data]

## Conclusions
[Main conclusions]

## Implications
- Implication 1
- Implication 2`,
  },
  {
    id: "business_report",
    name: "Business Report",
    description: "Generate professional business analysis and recommendations",
    icon: "📊",
    systemPrompt: `You are a business analyst. Create a professional business report with analysis and recommendations.
Focus on:
- Executive summary
- Current situation analysis
- Key metrics and KPIs
- SWOT analysis if applicable
- Recommendations with rationale
- Implementation considerations`,
    outputFormat: `# Business Report: [Title]

## Executive Summary
[High-level overview]

## Current Situation
[Analysis of current state]

## Key Metrics
| Metric | Value | Trend |
|--------|-------|-------|
| KPI 1 | X | ↑/↓ |

## Analysis
### Strengths
- Point 1

### Challenges
- Point 1

## Recommendations
1. **Recommendation 1**
   - Rationale
   - Expected impact

## Implementation Plan
[Steps and timeline]`,
  },
  {
    id: "literature_review",
    name: "Literature Review",
    description: "Synthesize academic sources and identify themes",
    icon: "📚",
    systemPrompt: `You are an academic researcher. Create a literature review that synthesizes sources and identifies themes.
Focus on:
- Main themes and topics
- Key authors and contributions
- Methodological approaches
- Gaps in the literature
- Synthesis of findings`,
    outputFormat: `# Literature Review: [Topic]

## Introduction
[Context and scope]

## Themes
### Theme 1: [Name]
[Discussion of relevant sources]

### Theme 2: [Name]
[Discussion of relevant sources]

## Methodological Approaches
[Overview of methods used in the literature]

## Gaps and Future Directions
- Gap 1
- Gap 2

## Conclusion
[Synthesis of findings]`,
  },
  {
    id: "executive_summary",
    name: "Executive Summary",
    description: "Create a concise executive summary for decision makers",
    icon: "👔",
    systemPrompt: `You are an executive assistant. Create a concise executive summary suitable for C-level decision makers.
Focus on:
- Bottom line up front (BLUF)
- Key facts and figures
- Critical decisions needed
- Risks and opportunities
- Recommended actions`,
    outputFormat: `# Executive Summary

## Bottom Line
[One paragraph summary of the most important point]

## Key Facts
- Fact 1
- Fact 2
- Fact 3

## Decisions Required
1. Decision 1 - [Deadline]
2. Decision 2 - [Deadline]

## Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Risk 1 | High/Med/Low | Action |

## Recommendations
1. Recommendation 1
2. Recommendation 2`,
  },
  {
    id: "action_items",
    name: "Action Items",
    description: "Extract all actionable tasks and to-dos",
    icon: "✅",
    systemPrompt: `You are a task extraction specialist. Identify and organize all actionable items from the content.
Focus on:
- Explicit tasks and to-dos
- Implied actions needed
- Deadlines and priorities
- Dependencies between tasks
- Responsible parties if mentioned`,
    outputFormat: `# Action Items

## High Priority
- [ ] Task 1 - [Owner] - [Deadline]
- [ ] Task 2 - [Owner] - [Deadline]

## Medium Priority
- [ ] Task 3
- [ ] Task 4

## Low Priority
- [ ] Task 5

## Dependencies
- Task X depends on Task Y

## Notes
[Any relevant context]`,
  },
  {
    id: "comparison_analysis",
    name: "Comparison Analysis",
    description: "Compare and contrast different options or approaches",
    icon: "⚖️",
    systemPrompt: `You are an analytical consultant. Create a structured comparison of options, approaches, or items mentioned in the content.
Focus on:
- Clear criteria for comparison
- Objective analysis of each option
- Pros and cons
- Quantitative data where available
- Recommendation based on analysis`,
    outputFormat: `# Comparison Analysis: [Subject]

## Overview
[Context for the comparison]

## Comparison Criteria
1. Criterion 1
2. Criterion 2
3. Criterion 3

## Detailed Comparison

### Option A: [Name]
**Pros:**
- Pro 1
- Pro 2

**Cons:**
- Con 1
- Con 2

**Score:** X/10

### Option B: [Name]
[Same structure]

## Summary Table
| Criterion | Option A | Option B |
|-----------|----------|----------|
| Criterion 1 | ✓/✗ | ✓/✗ |

## Recommendation
[Final recommendation with rationale]`,
  },
  {
    id: "custom",
    name: "Custom Report",
    description: "Generate a report with your own instructions",
    icon: "✨",
    systemPrompt: `You are a versatile document analyst. Generate a structured report based on the user's specific instructions.
Maintain professional formatting and clear organization.`,
    outputFormat: `# Report

[Content based on user instructions]`,
  },
];

export function useReportTemplate(): UseReportTemplateReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [streamingContent, setStreamingContent] = useState("");

  const { settings } = useAIChatStore();

  const generate = useCallback(
    async (
      content: string,
      templateType: ReportTemplateType,
      customInstructions?: string
    ) => {
      if (!content.trim()) {
        setError("No content provided for report generation");
        return;
      }

      setIsGenerating(true);
      setError(null);
      setResult(null);
      setStreamingContent("");

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

        const template = REPORT_TEMPLATES.find((t) => t.id === templateType);
        if (!template) {
          throw new Error("Invalid template type");
        }

        const config: AIServiceConfig = {
          provider: settings.provider,
          model: settings.model,
          apiKey,
          temperature: 0.5,
          maxTokens: 4000,
        };

        const systemPrompt = `${template.systemPrompt}

Output your response in well-formatted Markdown following this structure:
${template.outputFormat}

Be thorough but concise. Use bullet points and tables where appropriate.`;

        const userPrompt =
          templateType === "custom" && customInstructions
            ? `${customInstructions}\n\nContent to analyze:\n\n${content}`
            : `Generate a ${template.name} from the following content:\n\n${content}`;

        await chatStream(config, {
          messages: [
            {
              id: "report-generate",
              role: "user",
              content: userPrompt,
            },
          ],
          systemPrompt,
          enableTools: false,
          onUpdate: (text) => {
            setStreamingContent(text);
          },
          onFinish: (text) => {
            setStreamingContent(text);

            // Parse the markdown to extract structured data
            const sections = parseMarkdownSections(text);
            const keyPoints = extractKeyPoints(text);
            const actionItems = extractActionItems(text);

            // Extract title from first heading
            const titleMatch = text.match(/^#\s+(.+)$/m);
            const title = titleMatch ? titleMatch[1] : template.name;

            // Extract summary (first paragraph after title or "Summary" section)
            const summaryMatch =
              text.match(
                /##\s+(?:Summary|Executive Summary|Abstract)\s*\n([\s\S]*?)(?=\n##|$)/i
              ) || text.match(/^#[^#].*\n\n(.*?)(?=\n\n|$)/m);
            const summary = summaryMatch
              ? summaryMatch[1].trim().slice(0, 500)
              : "";

            setResult({
              templateType,
              title,
              summary,
              sections,
              keyPoints,
              actionItems: actionItems.length > 0 ? actionItems : undefined,
              metadata: {
                generatedAt: Date.now(),
                wordCount: text.split(/\s+/).length,
              },
              markdown: text,
            });
          },
          onError: (err) => {
            throw err;
          },
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Report generation failed";
        setError(errorMessage);
      } finally {
        setIsGenerating(false);
      }
    },
    [settings]
  );

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
    setStreamingContent("");
  }, []);

  const copyAsMarkdown = useCallback(async () => {
    if (result?.markdown) {
      await navigator.clipboard.writeText(result.markdown);
    }
  }, [result]);

  return {
    isGenerating,
    error,
    result,
    streamingContent,
    templates: REPORT_TEMPLATES,
    generate,
    clearResult,
    copyAsMarkdown,
  };
}

// Helper functions to parse markdown content
function parseMarkdownSections(markdown: string): ReportSection[] {
  const sections: ReportSection[] = [];
  const sectionRegex = /^##\s+(.+)$/gm;
  const matches = [...markdown.matchAll(sectionRegex)];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const title = match[1];
    const startIndex = match.index! + match[0].length;
    const endIndex = matches[i + 1]?.index ?? markdown.length;
    const content = markdown.slice(startIndex, endIndex).trim();

    // Extract bullet points if present
    const bulletPoints = content.match(/^[-*]\s+(.+)$/gm);
    const items = bulletPoints
      ? bulletPoints.map((bp) => bp.replace(/^[-*]\s+/, ""))
      : undefined;

    sections.push({
      title,
      content: content.replace(/^[-*]\s+.+$/gm, "").trim(),
      items,
    });
  }

  return sections;
}

function extractKeyPoints(markdown: string): string[] {
  const keyPoints: string[] = [];

  // Look for key points, key facts, highlights sections
  const keyPointsSection = markdown.match(
    /##\s+(?:Key Points|Key Facts|Highlights|Key Findings)\s*\n([\s\S]*?)(?=\n##|$)/i
  );

  if (keyPointsSection) {
    const bullets = keyPointsSection[1].match(/^[-*]\s+(.+)$/gm);
    if (bullets) {
      keyPoints.push(...bullets.map((b) => b.replace(/^[-*]\s+/, "")));
    }
  }

  // Also extract from numbered lists
  const numberedItems = markdown.match(/^\d+\.\s+(.+)$/gm);
  if (numberedItems && keyPoints.length < 5) {
    const remaining = 5 - keyPoints.length;
    keyPoints.push(
      ...numberedItems
        .slice(0, remaining)
        .map((n) => n.replace(/^\d+\.\s+/, ""))
    );
  }

  return keyPoints.slice(0, 10);
}

function extractActionItems(markdown: string): string[] {
  const actionItems: string[] = [];

  // Look for action items, tasks, to-dos
  const actionSection = markdown.match(
    /##\s+(?:Action Items|Tasks|To-?Do|Next Steps)\s*\n([\s\S]*?)(?=\n##|$)/i
  );

  if (actionSection) {
    // Match checkboxes and bullet points
    const items = actionSection[1].match(/^[-*]\s+\[[ x]\]\s*(.+)$/gim);
    if (items) {
      actionItems.push(
        ...items.map((i) => i.replace(/^[-*]\s+\[[ x]\]\s*/, ""))
      );
    }

    // Also match regular bullets in action section
    const bullets = actionSection[1].match(/^[-*]\s+(?!\[)(.+)$/gm);
    if (bullets) {
      actionItems.push(...bullets.map((b) => b.replace(/^[-*]\s+/, "")));
    }
  }

  return actionItems;
}

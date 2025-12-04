/**
 * Markdown AI Tools - AI-powered markdown processing utilities
 *
 * This module provides AI-enhanced tools for markdown content:
 * - Smart summarization
 * - Content improvement suggestions
 * - Auto-formatting
 * - Translation
 * - TOC generation
 * - Content analysis
 */

import { z } from "zod";
import { tool } from "ai";
import {
  extractHeadings,
  getContentStats,
  validateMarkdown,
  extractPlainText,
  generateMarkdownTable,
  generateCodeBlock,
  type TOCItem,
  type ContentStats,
  type ValidationIssue,
} from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface MarkdownContext {
  content: string;
  fileName?: string;
  selectedText?: string;
  cursorPosition?: number;
  headings?: TOCItem[];
  stats?: ContentStats;
}

export interface MarkdownSuggestion {
  id: string;
  type: "improvement" | "formatting" | "structure" | "grammar" | "style";
  description: string;
  originalText?: string;
  suggestedText?: string;
  lineNumber?: number;
  confidence: number;
}

export interface MarkdownAnalysis {
  readabilityScore: number;
  structureScore: number;
  suggestions: MarkdownSuggestion[];
  stats: ContentStats;
  issues: ValidationIssue[];
}

// ============================================================================
// Tool Schemas
// ============================================================================

const summarizeMarkdownSchema = z.object({
  content: z.string().describe("The markdown content to summarize"),
  length: z
    .enum(["brief", "standard", "detailed"])
    .describe("Desired summary length"),
  preserveStructure: z
    .boolean()
    .default(false)
    .describe("Whether to preserve markdown structure in summary"),
});

const improveWritingSchema = z.object({
  content: z.string().describe("The markdown content to improve"),
  focus: z
    .enum(["clarity", "conciseness", "grammar", "style", "all"])
    .describe("What aspect to focus on"),
  tone: z
    .enum(["formal", "casual", "technical", "friendly"])
    .optional()
    .describe("Desired tone for the content"),
});

const generateOutlineSchema = z.object({
  topic: z.string().describe("The topic to create an outline for"),
  depth: z
    .number()
    .min(1)
    .max(4)
    .default(3)
    .describe("Maximum heading depth (1-4)"),
  sections: z
    .number()
    .min(3)
    .max(10)
    .default(5)
    .describe("Number of main sections"),
});

const translateMarkdownSchema = z.object({
  content: z.string().describe("The markdown content to translate"),
  targetLanguage: z.string().describe("Target language for translation"),
  preserveFormatting: z
    .boolean()
    .default(true)
    .describe("Whether to preserve markdown formatting"),
  preserveCodeBlocks: z
    .boolean()
    .default(true)
    .describe("Whether to keep code blocks untranslated"),
});

const generateTableSchema = z.object({
  description: z.string().describe("Description of the table to generate"),
  rows: z.number().min(1).max(20).default(3).describe("Number of data rows"),
  columns: z.number().min(2).max(10).default(3).describe("Number of columns"),
});

const generateCodeSchema = z.object({
  description: z.string().describe("Description of the code to generate"),
  language: z.string().describe("Programming language"),
  includeComments: z
    .boolean()
    .default(true)
    .describe("Whether to include comments"),
});

const analyzeContentSchema = z.object({
  content: z.string().describe("The markdown content to analyze"),
  checkGrammar: z.boolean().default(true).describe("Check for grammar issues"),
  checkStyle: z.boolean().default(true).describe("Check for style issues"),
  checkStructure: z
    .boolean()
    .default(true)
    .describe("Check document structure"),
});

const expandContentSchema = z.object({
  content: z.string().describe("The content to expand"),
  targetLength: z
    .enum(["double", "triple", "custom"])
    .describe("How much to expand"),
  customWords: z
    .number()
    .optional()
    .describe("Target word count if custom length"),
  addExamples: z.boolean().default(true).describe("Whether to add examples"),
  addDetails: z.boolean().default(true).describe("Whether to add more details"),
});

const simplifyContentSchema = z.object({
  content: z.string().describe("The content to simplify"),
  targetAudience: z
    .enum(["beginner", "intermediate", "general"])
    .describe("Target audience level"),
  preserveKeyPoints: z
    .boolean()
    .default(true)
    .describe("Whether to preserve key points"),
});

// ============================================================================
// Tool Definitions
// ============================================================================

/**
 * Create markdown-specific AI tools
 */
export function createMarkdownTools(markdownContext?: MarkdownContext | null) {
  return {
    summarize_markdown: tool({
      description:
        "Summarize markdown content while optionally preserving structure",
      inputSchema: summarizeMarkdownSchema,
      execute: async ({
        content,
        length,
        preserveStructure,
      }: z.infer<typeof summarizeMarkdownSchema>) => {
        const stats = getContentStats(content);
        const headings = extractHeadings(content);

        return {
          requestedLength: length,
          preserveStructure,
          originalStats: {
            words: stats.words,
            headings: headings.length,
          },
          structure: preserveStructure
            ? headings.map((h) => `${"#".repeat(h.level)} ${h.text}`)
            : undefined,
          plainText: extractPlainText(content).slice(0, 2000),
        };
      },
    }),

    improve_writing: tool({
      description:
        "Suggest improvements for markdown content focusing on specific aspects",
      inputSchema: improveWritingSchema,
      execute: async ({
        content,
        focus,
        tone,
      }: z.infer<typeof improveWritingSchema>) => {
        const issues = validateMarkdown(content);
        const stats = getContentStats(content);

        return {
          focus,
          tone,
          currentStats: stats,
          validationIssues: issues,
          contentPreview: content.slice(0, 1000),
        };
      },
    }),

    generate_outline: tool({
      description: "Generate a markdown outline/structure for a given topic",
      inputSchema: generateOutlineSchema,
      execute: async ({
        topic,
        depth,
        sections,
      }: z.infer<typeof generateOutlineSchema>) => {
        return {
          topic,
          requestedDepth: depth,
          requestedSections: sections,
          context: markdownContext?.fileName,
        };
      },
    }),

    translate_markdown: tool({
      description: "Translate markdown content while preserving formatting",
      inputSchema: translateMarkdownSchema,
      execute: async ({
        content,
        targetLanguage,
        preserveFormatting,
        preserveCodeBlocks,
      }: z.infer<typeof translateMarkdownSchema>) => {
        const stats = getContentStats(content);

        // Extract code blocks if they should be preserved
        const codeBlocks: string[] = [];
        let processedContent = content;

        if (preserveCodeBlocks) {
          const codeBlockRegex = /```[\s\S]*?```/g;
          let match;
          let index = 0;
          while ((match = codeBlockRegex.exec(content)) !== null) {
            codeBlocks.push(match[0]);
            processedContent = processedContent.replace(
              match[0],
              `__CODE_BLOCK_${index}__`
            );
            index++;
          }
        }

        return {
          targetLanguage,
          preserveFormatting,
          preserveCodeBlocks,
          codeBlockCount: codeBlocks.length,
          originalStats: stats,
          contentToTranslate: processedContent.slice(0, 3000),
          codeBlockPlaceholders: codeBlocks.map(
            (_, i) => `__CODE_BLOCK_${i}__`
          ),
        };
      },
    }),

    generate_table: tool({
      description: "Generate a markdown table based on description",
      inputSchema: generateTableSchema,
      execute: async ({
        description,
        rows,
        columns,
      }: z.infer<typeof generateTableSchema>) => {
        const template = generateMarkdownTable(rows, columns);

        return {
          description,
          template,
          rows,
          columns,
          note: "Please fill in the table with appropriate content based on the description",
        };
      },
    }),

    generate_code: tool({
      description: "Generate a code block with the specified language",
      inputSchema: generateCodeSchema,
      execute: async ({
        description,
        language,
        includeComments,
      }: z.infer<typeof generateCodeSchema>) => {
        const template = generateCodeBlock("// Your code here", language);

        return {
          description,
          language,
          includeComments,
          template,
          note: "Please generate appropriate code based on the description",
        };
      },
    }),

    analyze_content: tool({
      description: "Analyze markdown content for quality and issues",
      inputSchema: analyzeContentSchema,
      execute: async ({
        content,
        checkGrammar,
        checkStyle,
        checkStructure,
      }: z.infer<typeof analyzeContentSchema>) => {
        const stats = getContentStats(content);
        const issues = validateMarkdown(content);
        const headings = extractHeadings(content);

        // Calculate basic scores
        const structureScore = calculateStructureScore(headings, stats);

        return {
          stats,
          issues,
          headings: headings.map((h) => ({ level: h.level, text: h.text })),
          structureScore,
          checksRequested: { checkGrammar, checkStyle, checkStructure },
          contentPreview: content.slice(0, 1500),
        };
      },
    }),

    expand_content: tool({
      description: "Expand and elaborate on markdown content",
      inputSchema: expandContentSchema,
      execute: async ({
        content,
        targetLength,
        customWords,
        addExamples,
        addDetails,
      }: z.infer<typeof expandContentSchema>) => {
        const stats = getContentStats(content);
        const targetWords =
          targetLength === "double"
            ? stats.words * 2
            : targetLength === "triple"
              ? stats.words * 3
              : customWords || stats.words * 2;

        return {
          originalWords: stats.words,
          targetWords,
          addExamples,
          addDetails,
          content: content.slice(0, 2000),
        };
      },
    }),

    simplify_content: tool({
      description: "Simplify markdown content for easier understanding",
      inputSchema: simplifyContentSchema,
      execute: async ({
        content,
        targetAudience,
        preserveKeyPoints,
      }: z.infer<typeof simplifyContentSchema>) => {
        const stats = getContentStats(content);
        const headings = extractHeadings(content);

        return {
          targetAudience,
          preserveKeyPoints,
          originalStats: stats,
          keyHeadings: headings.slice(0, 5).map((h) => h.text),
          content: content.slice(0, 2000),
        };
      },
    }),

    insert_template: tool({
      description: "Insert a markdown template at the current position",
      inputSchema: z.object({
        templateType: z
          .enum([
            "table",
            "code",
            "checklist",
            "callout",
            "collapsible",
            "footnote",
            "definition",
          ])
          .describe("Type of template to insert"),
        customization: z
          .string()
          .optional()
          .describe("Any customization for the template"),
      }),
      execute: async ({ templateType, customization }) => {
        const templates: Record<string, string> = {
          table: generateMarkdownTable(3, 3),
          code: generateCodeBlock("// Your code here", "javascript"),
          checklist: "- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3",
          callout: "> [!NOTE]\n> Your note content here",
          collapsible:
            "<details>\n<summary>Click to expand</summary>\n\nYour content here\n\n</details>",
          footnote: "Text with footnote[^1]\n\n[^1]: Footnote content here",
          definition: "Term\n: Definition of the term",
        };

        return {
          templateType,
          template: templates[templateType] || "",
          customization,
          cursorPosition: markdownContext?.cursorPosition,
        };
      },
    }),
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate a structure score based on headings and content stats
 */
function calculateStructureScore(
  headings: TOCItem[],
  stats: ContentStats
): number {
  let score = 50; // Base score

  // Check heading hierarchy
  if (headings.length > 0) {
    score += 10;

    // Check if starts with h1
    if (headings[0]?.level === 1) {
      score += 10;
    }

    // Check for proper nesting (no skipping levels)
    let properNesting = true;
    for (let i = 1; i < headings.length; i++) {
      if (headings[i].level > headings[i - 1].level + 1) {
        properNesting = false;
        break;
      }
    }
    if (properNesting) {
      score += 10;
    }
  }

  // Check content density
  if (stats.words > 100) score += 5;
  if (stats.words > 500) score += 5;

  // Check for code blocks (indicates technical content)
  if (stats.codeBlocks > 0) score += 5;

  // Check for links (indicates references)
  if (stats.links > 0) score += 5;

  return Math.min(100, score);
}

/**
 * Build system prompt for markdown AI interactions
 */
export function buildMarkdownSystemPrompt(
  basePrompt: string,
  markdownContext?: MarkdownContext | null
): string {
  if (!markdownContext) {
    return basePrompt;
  }

  let contextInfo = `\n\n## Current Markdown Document Context:\n`;

  if (markdownContext.fileName) {
    contextInfo += `- File: ${markdownContext.fileName}\n`;
  }

  if (markdownContext.stats) {
    contextInfo += `- Words: ${markdownContext.stats.words}\n`;
    contextInfo += `- Lines: ${markdownContext.stats.lines}\n`;
    contextInfo += `- Headings: ${markdownContext.stats.headings}\n`;
  }

  if (markdownContext.selectedText) {
    contextInfo += `\n### Selected Text:\n\`\`\`\n${markdownContext.selectedText.slice(0, 500)}\n\`\`\`\n`;
  }

  if (markdownContext.headings && markdownContext.headings.length > 0) {
    contextInfo += `\n### Document Structure:\n`;
    markdownContext.headings.slice(0, 10).forEach((h) => {
      contextInfo += `${"  ".repeat(h.level - 1)}- ${h.text}\n`;
    });
  }

  return basePrompt + contextInfo;
}

// ============================================================================
// Prompt Templates
// ============================================================================

export const MARKDOWN_PROMPTS = {
  summarize: {
    brief: "Provide a 2-3 sentence summary of the key points.",
    standard: "Provide a comprehensive paragraph summarizing the main ideas.",
    detailed:
      "Provide a detailed summary with key points, organized by sections.",
  },

  improve: {
    clarity:
      "Focus on making the content clearer and easier to understand. Simplify complex sentences and improve flow.",
    conciseness:
      "Focus on removing unnecessary words and making the content more concise while preserving meaning.",
    grammar: "Focus on correcting grammar, spelling, and punctuation errors.",
    style:
      "Focus on improving the writing style, making it more engaging and professional.",
    all: "Improve all aspects: clarity, conciseness, grammar, and style.",
  },

  tone: {
    formal:
      "Use formal, professional language appropriate for academic or business contexts.",
    casual:
      "Use casual, conversational language that is friendly and approachable.",
    technical: "Use precise technical language with appropriate terminology.",
    friendly: "Use warm, friendly language that connects with the reader.",
  },

  audience: {
    beginner:
      "Simplify for beginners with no prior knowledge. Explain all terms and concepts.",
    intermediate:
      "Write for readers with some background knowledge. Explain advanced concepts.",
    general: "Write for a general audience. Balance accessibility with depth.",
  },
};

// ============================================================================
// Export Types
// ============================================================================

export type SummarizeMarkdownParams = z.infer<typeof summarizeMarkdownSchema>;
export type ImproveWritingParams = z.infer<typeof improveWritingSchema>;
export type GenerateOutlineParams = z.infer<typeof generateOutlineSchema>;
export type TranslateMarkdownParams = z.infer<typeof translateMarkdownSchema>;
export type GenerateTableParams = z.infer<typeof generateTableSchema>;
export type GenerateCodeParams = z.infer<typeof generateCodeSchema>;
export type AnalyzeContentParams = z.infer<typeof analyzeContentSchema>;
export type ExpandContentParams = z.infer<typeof expandContentSchema>;
export type SimplifyContentParams = z.infer<typeof simplifyContentSchema>;

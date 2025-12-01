import { useState, useCallback, useRef } from "react";
import {
  useAIChatStore,
  type ResearchStep,
  type ResearchStepType,
  type ResearchSource,
} from "@/lib/ai/core";
import { chatStream, type AIServiceConfig } from "@/lib/ai/core";
import { getAPIKeySecurely } from "@/lib/platform";

// Research step configuration
const RESEARCH_STEPS: {
  type: ResearchStepType;
  title: string;
  description: string;
}[] = [
  {
    type: "plan",
    title: "制定研究计划",
    description: "分析问题并规划研究方向",
  },
  { type: "search", title: "搜索信息", description: "在文档中查找相关内容" },
  { type: "read", title: "深度阅读", description: "仔细阅读和理解关键内容" },
  { type: "analyze", title: "分析推理", description: "分析信息并进行逻辑推理" },
  { type: "synthesize", title: "综合整理", description: "整合各方面信息" },
  { type: "verify", title: "验证结论", description: "检验结论的准确性" },
  { type: "report", title: "生成报告", description: "撰写最终研究报告" },
];

// System prompts for different research phases
const RESEARCH_PROMPTS = {
  plan: `你是一个深度研究助手。用户提出了一个研究问题，请制定一个详细的研究计划。

请按以下格式输出研究计划：
1. 首先分析用户问题的核心要点
2. 列出需要研究的关键方面（3-5个）
3. 规划研究步骤和优先级

输出格式要求：
- 使用清晰的Markdown格式
- 每个研究方面用##标记
- 关键点用**加粗**`,

  search: `你是一个信息检索助手。根据研究计划，在提供的文档内容中搜索相关信息。

任务：
1. 根据当前页面内容，找出与研究问题相关的信息
2. 标注信息来源（页码）
3. 评估信息的相关性和重要性

输出要求：
- 列出找到的关键信息点
- 标注每个信息点的来源页码
- 对信息进行初步分类`,

  analyze: `你是一个分析推理助手。基于收集到的信息进行深度分析。

任务：
1. 分析各信息点之间的关系
2. 识别关键模式和趋势
3. 进行逻辑推理得出初步结论

输出要求：
- 展示完整的推理过程
- 明确标注推理依据
- 指出任何不确定性或需要进一步验证的点`,

  synthesize: `你是一个信息综合助手。将分析结果综合成连贯的见解。

任务：
1. 整合各方面的分析结论
2. 构建完整的理解框架
3. 突出最重要的发现

输出要求：
- 按逻辑顺序组织内容
- 建立各部分之间的联系
- 突出核心结论`,

  verify: `你是一个验证助手。检验之前得出的结论。

任务：
1. 检查结论是否有充分的证据支持
2. 识别可能的逻辑漏洞或偏见
3. 提出需要补充的信息

输出要求：
- 列出每个结论及其支撑证据
- 标注置信度（高/中/低）
- 提出改进建议`,

  report: `你是一个报告撰写助手。基于完整的研究过程，撰写最终报告。

报告格式：
## 研究问题
[简述用户的原始问题]

## 核心发现
[列出3-5个最重要的发现]

## 详细分析
[展开讨论每个核心发现]

## 结论
[给出明确的结论和建议]

## 参考信息
[列出信息来源和页码]

注意：
- 保持客观专业的语气
- 使用清晰的Markdown格式
- 确保结论有据可依`,
};

export interface UseDeepResearchReturn {
  isResearching: boolean;
  currentStep: ResearchStep | null;
  progress: number; // 0-100
  startResearch: (query: string) => Promise<void>;
  cancelResearch: () => void;
  clearResearch: () => void;
}

export function useDeepResearch(): UseDeepResearchReturn {
  const {
    settings,
    pdfContext,
    currentResearch,
    startResearch: initResearch,
    addResearchStep,
    updateResearchStep,
    setResearchPlan,
    completeResearch,
    cancelResearch: cancelCurrentResearch,
    clearCurrentResearch,
  } = useAIChatStore();

  const [isResearching, setIsResearching] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentStepIdRef = useRef<string | null>(null);

  // Calculate progress
  const progress = currentResearch
    ? Math.round(
        (currentResearch.steps.filter((s) => s.status === "complete").length /
          RESEARCH_STEPS.length) *
          100
      )
    : 0;

  // Get current step
  const currentStep =
    currentResearch && currentResearch.currentStepIndex >= 0
      ? currentResearch.steps[currentResearch.currentStepIndex]
      : null;

  // Get API config
  const getConfig = useCallback(async (): Promise<AIServiceConfig | null> => {
    const providerId =
      settings.provider === "custom"
        ? settings.customProviderId || ""
        : settings.provider;

    const apiKey = await getAPIKeySecurely(
      providerId as "openai" | "anthropic"
    ).catch(() => settings.apiKeys[providerId]);

    if (!apiKey) {
      return null;
    }

    const customProvider =
      settings.provider === "custom"
        ? (settings.customProviders || []).find(
            (p) => p.id === settings.customProviderId
          )
        : undefined;

    return {
      provider: settings.provider,
      model: settings.model,
      apiKey,
      temperature: 0.7,
      maxTokens: settings.maxTokens,
      customProvider,
    };
  }, [settings]);

  // Execute a single research step
  const executeStep = useCallback(
    async (
      config: AIServiceConfig,
      stepType: ResearchStepType,
      stepTitle: string,
      stepDescription: string,
      previousContext: string
    ): Promise<{
      result: string;
      reasoning: string;
      sources: ResearchSource[];
    }> => {
      const stepId = addResearchStep({
        type: stepType,
        status: "running",
        title: stepTitle,
        description: stepDescription,
        startedAt: Date.now(),
      });

      currentStepIdRef.current = stepId;

      const systemPrompt =
        RESEARCH_PROMPTS[stepType as keyof typeof RESEARCH_PROMPTS] ||
        RESEARCH_PROMPTS.analyze;

      let fullResult = "";
      const sources: ResearchSource[] = [];

      try {
        await chatStream(config, {
          messages: [
            {
              id: `research_${stepType}_${Date.now()}`,
              role: "user",
              content: `${previousContext}\n\n请执行: ${stepTitle}`,
            },
          ],
          pdfContext,
          systemPrompt,
          temperature: 0.7,
          maxTokens: config.maxTokens,
          enableTools: false,
          enableMultiStep: false,
          abortSignal: abortControllerRef.current?.signal,
          onUpdate: (text) => {
            fullResult = text;
            updateResearchStep(stepId, {
              result: text,
              reasoning: text,
            });
          },
          onFinish: (text, _toolInvocations, _suggestions, usage) => {
            fullResult = text;
            // Update session usage if available
            if (usage) {
              useAIChatStore.getState().updateSessionUsage(usage);
            }
          },
          onError: (error) => {
            throw error;
          },
        });

        // Extract sources from pdfContext if available
        if (pdfContext) {
          sources.push({
            id: `source_${Date.now()}`,
            title: pdfContext.fileName,
            pageNumber: pdfContext.currentPage,
            snippet: pdfContext.pageText?.slice(0, 200) || "",
            relevance: 0.8,
          });
        }

        updateResearchStep(stepId, {
          status: "complete",
          result: fullResult,
          sources,
          completedAt: Date.now(),
          duration:
            Date.now() -
            (currentResearch?.steps.find((s) => s.id === stepId)?.startedAt ||
              Date.now()),
        });

        return { result: fullResult, reasoning: fullResult, sources };
      } catch (error) {
        updateResearchStep(stepId, {
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
          completedAt: Date.now(),
        });
        throw error;
      }
    },
    [addResearchStep, updateResearchStep, pdfContext, currentResearch]
  );

  // Start deep research workflow
  const startResearch = useCallback(
    async (query: string) => {
      const config = await getConfig();
      if (!config) {
        throw new Error("Please configure API key first");
      }

      setIsResearching(true);
      abortControllerRef.current = new AbortController();

      // Initialize research workflow
      initResearch(query);

      let context = `研究问题: ${query}\n\n`;

      if (pdfContext) {
        context += `文档: ${pdfContext.fileName}\n`;
        context += `当前页: ${pdfContext.currentPage}/${pdfContext.totalPages}\n`;
        if (pdfContext.pageText) {
          context += `\n页面内容:\n${pdfContext.pageText.slice(0, 3000)}...\n`;
        }
      }

      try {
        // Execute research steps
        for (const stepConfig of RESEARCH_STEPS) {
          // Check if cancelled
          if (abortControllerRef.current?.signal.aborted) {
            break;
          }

          const { result } = await executeStep(
            config,
            stepConfig.type,
            stepConfig.title,
            stepConfig.description,
            context
          );

          // Update context with step result
          context += `\n\n### ${stepConfig.title}结果:\n${result}`;

          // Set plan after first step
          if (stepConfig.type === "plan") {
            setResearchPlan(result);
          }

          // Generate final report
          if (stepConfig.type === "report") {
            completeResearch(result);
          }

          // Small delay between steps
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error("Research error:", error);
      } finally {
        setIsResearching(false);
        abortControllerRef.current = null;
        currentStepIdRef.current = null;
      }
    },
    [
      getConfig,
      initResearch,
      executeStep,
      setResearchPlan,
      completeResearch,
      pdfContext,
    ]
  );

  // Cancel research
  const cancelResearch = useCallback(() => {
    abortControllerRef.current?.abort();
    cancelCurrentResearch();
    setIsResearching(false);
  }, [cancelCurrentResearch]);

  // Clear research
  const clearResearch = useCallback(() => {
    clearCurrentResearch();
    setIsResearching(false);
  }, [clearCurrentResearch]);

  return {
    isResearching,
    currentStep,
    progress,
    startResearch,
    cancelResearch,
    clearResearch,
  };
}

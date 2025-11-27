import { create } from "zustand";
import { persist } from "zustand/middleware";

// Import types from AI SDK
import type { LanguageModelUsage } from "ai";
import type { SimpleToolInvocation } from "./ai-service";
import type { MCPServerConfig } from "./mcp-client";

// Define Message type with tool support
export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: number;
  // Tool invocation support
  toolInvocations?: SimpleToolInvocation[];
  // Suggestions for next user input
  suggestions?: string[];
  // Token usage for this message
  usage?: LanguageModelUsage;
}

// Token usage tracking
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  reasoningTokens?: number;
  cachedInputTokens?: number;
  totalTokens: number;
}

// Session usage accumulator
export interface SessionUsage {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalReasoningTokens: number;
  totalCachedTokens: number;
  messageCount: number;
}

// Built-in providers
export type BuiltInProvider = "openai" | "anthropic";
// All providers including custom
export type AIProvider = BuiltInProvider | "custom";

export interface AIModel {
  id: string;
  name: string;
  provider: BuiltInProvider;
  contextWindow: number;
  supportsVision: boolean;
  maxImageSize?: number; // in MB
}

// Custom provider configuration
export interface CustomProvider {
  id: string;
  name: string;
  baseURL: string;  // OpenAI-compatible API endpoint
  apiKeyHeader?: string;  // Custom header name for API key (default: Authorization)
  models: CustomAIModel[];
  isEnabled: boolean;
}

export interface CustomAIModel {
  id: string;
  name: string;
  contextWindow: number;
  supportsVision: boolean;
  maxImageSize?: number;
}

// Preset custom providers (OpenAI-compatible)
export const PRESET_PROVIDERS: Omit<CustomProvider, 'id' | 'isEnabled'>[] = [
  {
    name: "DeepSeek",
    baseURL: "https://api.deepseek.com/v1",
    models: [
      { id: "deepseek-chat", name: "DeepSeek Chat", contextWindow: 64000, supportsVision: false },
      { id: "deepseek-coder", name: "DeepSeek Coder", contextWindow: 64000, supportsVision: false },
      { id: "deepseek-reasoner", name: "DeepSeek Reasoner", contextWindow: 64000, supportsVision: false },
    ],
  },
  {
    name: "Moonshot (Kimi)",
    baseURL: "https://api.moonshot.cn/v1",
    models: [
      { id: "moonshot-v1-8k", name: "Moonshot V1 8K", contextWindow: 8000, supportsVision: false },
      { id: "moonshot-v1-32k", name: "Moonshot V1 32K", contextWindow: 32000, supportsVision: false },
      { id: "moonshot-v1-128k", name: "Moonshot V1 128K", contextWindow: 128000, supportsVision: false },
    ],
  },
  {
    name: "Ollama (Local)",
    baseURL: "http://localhost:11434/v1",
    models: [
      { id: "llama3.2", name: "Llama 3.2", contextWindow: 128000, supportsVision: false },
      { id: "llama3.2-vision", name: "Llama 3.2 Vision", contextWindow: 128000, supportsVision: true },
      { id: "qwen2.5", name: "Qwen 2.5", contextWindow: 32000, supportsVision: false },
      { id: "deepseek-r1", name: "DeepSeek R1", contextWindow: 64000, supportsVision: false },
    ],
  },
  {
    name: "Groq",
    baseURL: "https://api.groq.com/openai/v1",
    models: [
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", contextWindow: 128000, supportsVision: false },
      { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant", contextWindow: 128000, supportsVision: false },
      { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", contextWindow: 32768, supportsVision: false },
    ],
  },
  {
    name: "OpenRouter",
    baseURL: "https://openrouter.ai/api/v1",
    models: [
      { id: "openai/gpt-4o", name: "GPT-4o (via OpenRouter)", contextWindow: 128000, supportsVision: true },
      { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet (via OpenRouter)", contextWindow: 200000, supportsVision: true },
      { id: "google/gemini-pro-1.5", name: "Gemini Pro 1.5 (via OpenRouter)", contextWindow: 1000000, supportsVision: true },
    ],
  },
];

export const AI_MODELS: AIModel[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o (Vision)",
    provider: "openai",
    contextWindow: 128000,
    supportsVision: true,
    maxImageSize: 20,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini (Vision)",
    provider: "openai",
    contextWindow: 128000,
    supportsVision: true,
    maxImageSize: 20,
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo (Vision)",
    provider: "openai",
    contextWindow: 128000,
    supportsVision: true,
    maxImageSize: 20,
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "openai",
    contextWindow: 16385,
    supportsVision: false,
  },
  {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet (Vision)",
    provider: "anthropic",
    contextWindow: 200000,
    supportsVision: true,
    maxImageSize: 5,
  },
  {
    id: "claude-3-5-haiku-20241022",
    name: "Claude 3.5 Haiku (Vision)",
    provider: "anthropic",
    contextWindow: 200000,
    supportsVision: true,
    maxImageSize: 5,
  },
  {
    id: "claude-3-opus-20240229",
    name: "Claude 3 Opus (Vision)",
    provider: "anthropic",
    contextWindow: 200000,
    supportsVision: true,
    maxImageSize: 5,
  },
];

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  pdfFileName?: string;
  pdfPath?: string;
  // Accumulated token usage for this conversation
  usage?: SessionUsage;
}

export interface PDFPageImage {
  dataUrl: string;
  width: number;
  height: number;
  pageNumber: number;
}

export interface PDFContext {
  fileName: string;
  currentPage: number;
  totalPages: number;
  pageText?: string;
  selectedText?: string;
  pageImages?: PDFPageImage[];
  annotations?: Array<{
    type: string;
    text: string;
    pageNumber: number;
  }>;
  bookmarks?: Array<{
    title: string;
    pageNumber: number;
  }>;
}

// Image generation settings
export interface ImageGenerationSettings {
  model: "dall-e-3" | "dall-e-2" | "gpt-image-1";
  size: "256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792" | "1536x1024" | "1024x1536" | "auto";
  quality: "standard" | "hd";
  style: "vivid" | "natural";
}

// Speech synthesis settings
export interface SpeechSettings {
  model: "tts-1" | "tts-1-hd" | "gpt-4o-mini-tts";
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  speed: number; // 0.25 to 4.0
}

// Transcription settings
export interface TranscriptionSettings {
  model: "whisper-1" | "gpt-4o-transcribe" | "gpt-4o-mini-transcribe";
  language?: string; // ISO-639-1 code
}

// ============================================================================
// Quick Commands & Prompt Templates Types
// ============================================================================

export interface QuickCommand {
  id: string;
  name: string;
  description: string;
  prompt: string;           // Supports variables like {{selection}}, {{page}}, {{fileName}}
  icon?: string;            // Lucide icon name
  category: 'builtin' | 'custom';
  shortcut?: string;        // Optional keyboard shortcut
  enabled: boolean;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  content: string;          // The actual prompt template
  category: string;         // Category for organization
  isBuiltin: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface SystemPromptPreset {
  id: string;
  name: string;
  description: string;
  prompt: string;
  isBuiltin: boolean;
}

// Available template variables
export const TEMPLATE_VARIABLES = [
  { key: '{{selection}}', description: 'Selected text from the PDF' },
  { key: '{{page}}', description: 'Current page number' },
  { key: '{{pageText}}', description: 'Text content of current page' },
  { key: '{{fileName}}', description: 'Name of the PDF file' },
  { key: '{{totalPages}}', description: 'Total number of pages' },
  { key: '{{language}}', description: 'Target language for translation' },
] as const;

// Built-in quick commands
export const BUILTIN_QUICK_COMMANDS: Omit<QuickCommand, 'id'>[] = [
  {
    name: 'Summarize',
    description: 'Summarize the current page or selected text',
    prompt: 'Please provide a comprehensive summary of the following content from page {{page}}:\n\n{{selection}}',
    icon: 'FileText',
    category: 'builtin',
    shortcut: '/sum',
    enabled: true,
  },
  {
    name: 'Translate',
    description: 'Translate content to specified language',
    prompt: 'Please translate the following text to {{language}}. Preserve formatting where possible:\n\n{{selection}}',
    icon: 'Languages',
    category: 'builtin',
    shortcut: '/tr',
    enabled: true,
  },
  {
    name: 'Explain',
    description: 'Explain the selected content in detail',
    prompt: 'Please explain this text in detail, breaking down complex concepts and providing context:\n\n{{selection}}',
    icon: 'Lightbulb',
    category: 'builtin',
    shortcut: '/exp',
    enabled: true,
  },
  {
    name: 'Key Points',
    description: 'Extract key points from the content',
    prompt: 'Please extract and list the key points from the following content. Use bullet points for clarity:\n\n{{selection}}',
    icon: 'List',
    category: 'builtin',
    shortcut: '/key',
    enabled: true,
  },
  {
    name: 'Questions',
    description: 'Generate study questions from content',
    prompt: 'Based on the following content from page {{page}}, generate 5-10 study questions that would help understand the material:\n\n{{selection}}',
    icon: 'HelpCircle',
    category: 'builtin',
    shortcut: '/q',
    enabled: true,
  },
  {
    name: 'Define',
    description: 'Define terms or concepts',
    prompt: 'Please provide clear definitions and explanations for the key terms and concepts in the following text:\n\n{{selection}}',
    icon: 'BookOpen',
    category: 'builtin',
    shortcut: '/def',
    enabled: true,
  },
  {
    name: 'Simplify',
    description: 'Simplify complex content',
    prompt: 'Please simplify the following text, making it easier to understand while preserving the key information:\n\n{{selection}}',
    icon: 'Sparkles',
    category: 'builtin',
    shortcut: '/simple',
    enabled: true,
  },
  {
    name: 'Compare',
    description: 'Compare and contrast concepts',
    prompt: 'Please identify and compare the different concepts, ideas, or items mentioned in the following text:\n\n{{selection}}',
    icon: 'GitCompare',
    category: 'builtin',
    shortcut: '/cmp',
    enabled: true,
  },
];

// Built-in prompt templates
export const BUILTIN_PROMPT_TEMPLATES: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Academic Summary',
    description: 'Summarize academic content with proper structure',
    content: 'Please provide an academic summary of the following content from "{{fileName}}" (Page {{page}}):\n\n{{selection}}\n\nInclude:\n1. Main thesis/argument\n2. Key supporting points\n3. Methodology (if applicable)\n4. Conclusions\n5. Implications',
    category: 'Academic',
    isBuiltin: true,
  },
  {
    name: 'Code Analysis',
    description: 'Analyze and explain code snippets',
    content: 'Please analyze the following code from the document:\n\n{{selection}}\n\nProvide:\n1. What the code does\n2. Key functions/methods\n3. Potential improvements\n4. Any issues or bugs',
    category: 'Technical',
    isBuiltin: true,
  },
  {
    name: 'Meeting Notes',
    description: 'Extract meeting notes and action items',
    content: 'Please extract meeting notes from the following content:\n\n{{selection}}\n\nFormat as:\n- **Attendees**: (if mentioned)\n- **Key Discussion Points**:\n- **Decisions Made**:\n- **Action Items**:\n- **Next Steps**:',
    category: 'Business',
    isBuiltin: true,
  },
  {
    name: 'Literature Review',
    description: 'Create a literature review summary',
    content: 'Please create a literature review summary for the following academic content:\n\n{{selection}}\n\nInclude:\n1. Research context and background\n2. Key findings from cited works\n3. Gaps in existing research\n4. How this work contributes to the field',
    category: 'Academic',
    isBuiltin: true,
  },
  {
    name: 'ELI5 (Explain Like I\'m 5)',
    description: 'Explain complex topics in simple terms',
    content: 'Please explain the following content as if you were explaining it to a 5-year-old. Use simple words, analogies, and examples:\n\n{{selection}}',
    category: 'General',
    isBuiltin: true,
  },
  {
    name: 'Critique & Analysis',
    description: 'Critical analysis of content',
    content: 'Please provide a critical analysis of the following content:\n\n{{selection}}\n\nConsider:\n1. Strengths of the argument/content\n2. Weaknesses or gaps\n3. Assumptions made\n4. Alternative perspectives\n5. Overall assessment',
    category: 'Academic',
    isBuiltin: true,
  },
];

// System prompt presets
export const SYSTEM_PROMPT_PRESETS: SystemPromptPreset[] = [
  {
    id: 'default',
    name: 'Default Assistant',
    description: 'General-purpose PDF assistant',
    prompt: `You are a helpful AI assistant specialized in analyzing and understanding PDF documents. You help users by:
- Answering questions about document content
- Summarizing sections or entire documents
- Translating text while preserving formatting
- Explaining technical terms and concepts
- Finding and citing specific information with page numbers
- Suggesting insights and connections within the document

Always provide page numbers when referencing specific content. Be concise but thorough in your explanations.`,
    isBuiltin: true,
  },
  {
    id: 'academic',
    name: 'Academic Researcher',
    description: 'Focused on academic analysis and research',
    prompt: `You are an academic research assistant helping analyze scholarly documents. Your approach:
- Use formal academic language and proper citations
- Identify research methodologies and their validity
- Highlight key arguments, evidence, and conclusions
- Point out potential biases or limitations
- Suggest related research directions
- Reference specific pages and sections

Maintain scholarly rigor in all responses.`,
    isBuiltin: true,
  },
  {
    id: 'technical',
    name: 'Technical Analyst',
    description: 'For technical documentation and code',
    prompt: `You are a technical documentation expert. Your focus:
- Explain technical concepts clearly with examples
- Analyze code snippets and algorithms
- Identify best practices and potential issues
- Suggest improvements and optimizations
- Create clear step-by-step explanations
- Reference relevant standards and specifications

Be precise and practical in your explanations.`,
    isBuiltin: true,
  },
  {
    id: 'creative',
    name: 'Creative Writer',
    description: 'For creative and literary analysis',
    prompt: `You are a creative writing and literary analysis assistant. Your approach:
- Analyze narrative structure, themes, and symbolism
- Discuss character development and motivations
- Explore literary devices and their effects
- Provide creative interpretations
- Suggest writing improvements
- Connect to broader literary traditions

Be insightful and engaging in your analysis.`,
    isBuiltin: true,
  },
  {
    id: 'tutor',
    name: 'Patient Tutor',
    description: 'Educational and learning-focused',
    prompt: `You are a patient and encouraging tutor. Your approach:
- Break down complex topics into simple steps
- Use analogies and real-world examples
- Ask guiding questions to check understanding
- Provide practice problems when appropriate
- Celebrate progress and encourage curiosity
- Adapt explanations based on comprehension level

Focus on helping the learner truly understand, not just memorize.`,
    isBuiltin: true,
  },
];

export interface AISettings {
  provider: AIProvider;
  customProviderId?: string;  // ID of custom provider when provider === 'custom'
  model: string;
  temperature: number;
  maxTokens: number;
  apiKeys: Record<string, string>;  // Dynamic API keys for all providers
  systemPrompt: string;
  includePDFContext: boolean;
  // Custom providers configuration
  customProviders: CustomProvider[];
  // MCP server configurations
  mcpServers: MCPServerConfig[];
  // Enable/disable MCP tools globally
  enableMCPTools: boolean;
  // Enable multi-step tool calls
  enableMultiStepTools: boolean;
  // Maximum steps for multi-step tool calls
  maxToolSteps: number;
  // Media generation settings
  imageSettings: ImageGenerationSettings;
  speechSettings: SpeechSettings;
  transcriptionSettings: TranscriptionSettings;
  // Quick commands configuration
  quickCommands: QuickCommand[];
  // Prompt templates
  promptTemplates: PromptTemplate[];
  // Default translation language
  defaultTranslationLanguage: string;
}

// ============================================================================
// Deep Research Workflow Types
// ============================================================================

export type ResearchStepType = 'plan' | 'search' | 'read' | 'analyze' | 'synthesize' | 'verify' | 'report';
export type ResearchStepStatus = 'pending' | 'running' | 'complete' | 'error' | 'skipped';

export interface ResearchStep {
  id: string;
  type: ResearchStepType;
  status: ResearchStepStatus;
  title: string;
  description?: string;
  reasoning?: string;  // Chain of thought content
  toolCalls?: SimpleToolInvocation[];
  sources?: ResearchSource[];
  result?: string;
  error?: string;
  startedAt?: number;
  completedAt?: number;
  duration?: number;
}

export interface ResearchSource {
  id: string;
  title: string;
  url?: string;
  pageNumber?: number;
  snippet: string;
  relevance: number;  // 0-1 score
}

export type ResearchWorkflowStatus = 'idle' | 'planning' | 'researching' | 'synthesizing' | 'complete' | 'error' | 'cancelled';

export interface ResearchWorkflow {
  id: string;
  query: string;
  status: ResearchWorkflowStatus;
  plan?: string;  // Generated research plan
  steps: ResearchStep[];
  currentStepIndex: number;
  finalReport?: string;
  sources: ResearchSource[];
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  totalDuration?: number;
  error?: string;
}

interface AIChatState {
  // UI State
  isSidebarOpen: boolean;
  isLoading: boolean;
  error: string | null;

  // Conversations
  conversations: Record<string, Conversation>;
  currentConversationId: string | null;

  // Settings
  settings: AISettings;

  // PDF Context
  pdfContext: PDFContext | null;

  // Current session token usage (for Context component)
  sessionUsage: SessionUsage;

  // Deep Research Workflow
  currentResearch: ResearchWorkflow | null;
  researchHistory: ResearchWorkflow[];

  // Actions - UI
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Actions - Conversations
  createConversation: (title?: string) => string;
  deleteConversation: (id: string) => void;
  setCurrentConversation: (id: string | null) => void;
  updateConversationTitle: (id: string, title: string) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  clearMessages: () => void;
  deleteMessage: (messageId: string) => void;

  // Actions - Settings
  updateSettings: (settings: Partial<AISettings>) => void;
  setAPIKey: (provider: string, key: string) => void;

  // Actions - PDF Context
  setPDFContext: (context: PDFContext | null) => void;
  updatePDFContext: (updates: Partial<PDFContext>) => void;

  // Actions - Token Usage
  updateSessionUsage: (usage: LanguageModelUsage) => void;
  resetSessionUsage: () => void;
  getContextWindowSize: () => number;

  // Actions - Custom Providers
  addCustomProvider: (provider: Omit<CustomProvider, 'id'>) => string;
  updateCustomProvider: (id: string, updates: Partial<CustomProvider>) => void;
  deleteCustomProvider: (id: string) => void;
  addPresetProvider: (presetIndex: number) => string;

  // Actions - MCP Servers
  addMCPServer: (server: Omit<MCPServerConfig, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateMCPServer: (id: string, updates: Partial<MCPServerConfig>) => void;
  deleteMCPServer: (id: string) => void;
  toggleMCPServer: (id: string) => void;
  getEnabledMCPServers: () => MCPServerConfig[];

  // Actions - Deep Research
  startResearch: (query: string) => string;
  updateResearchStep: (stepId: string, updates: Partial<ResearchStep>) => void;
  addResearchStep: (step: Omit<ResearchStep, 'id'>) => string;
  setResearchPlan: (plan: string) => void;
  completeResearch: (report: string) => void;
  cancelResearch: () => void;
  clearCurrentResearch: () => void;

  // Actions - Media Settings
  updateImageSettings: (settings: Partial<ImageGenerationSettings>) => void;
  updateSpeechSettings: (settings: Partial<SpeechSettings>) => void;
  updateTranscriptionSettings: (settings: Partial<TranscriptionSettings>) => void;

  // Actions - Quick Commands
  addQuickCommand: (command: Omit<QuickCommand, 'id'>) => string;
  updateQuickCommand: (id: string, updates: Partial<QuickCommand>) => void;
  deleteQuickCommand: (id: string) => void;
  toggleQuickCommand: (id: string) => void;
  getEnabledQuickCommands: () => QuickCommand[];
  resetQuickCommands: () => void;

  // Actions - Prompt Templates
  addPromptTemplate: (template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updatePromptTemplate: (id: string, updates: Partial<PromptTemplate>) => void;
  deletePromptTemplate: (id: string) => void;
  getPromptTemplatesByCategory: (category: string) => PromptTemplate[];
  resetPromptTemplates: () => void;

  // Actions - Template Processing
  processTemplate: (template: string, extraVars?: Record<string, string>) => string;

  // Helpers
  getCurrentConversation: () => Conversation | null;
  getConversationList: () => Conversation[];
  hasAPIKey: (provider: AIProvider) => boolean;
  getTotalUsedTokens: () => number;
  getProviderAPIKey: (providerId?: string) => string | undefined;
  getAllModels: () => (AIModel | (CustomAIModel & { providerId: string; providerName: string }))[];
}

const DEFAULT_IMAGE_SETTINGS: ImageGenerationSettings = {
  model: "dall-e-3",
  size: "1024x1024",
  quality: "standard",
  style: "vivid",
};

const DEFAULT_SPEECH_SETTINGS: SpeechSettings = {
  model: "tts-1",
  voice: "alloy",
  speed: 1.0,
};

const DEFAULT_TRANSCRIPTION_SETTINGS: TranscriptionSettings = {
  model: "whisper-1",
  language: undefined,
};

// Generate default quick commands with IDs
const generateDefaultQuickCommands = (): QuickCommand[] => {
  return BUILTIN_QUICK_COMMANDS.map((cmd, index) => ({
    ...cmd,
    id: `builtin_cmd_${index}`,
  }));
};

// Generate default prompt templates with IDs
const generateDefaultPromptTemplates = (): PromptTemplate[] => {
  const now = Date.now();
  return BUILTIN_PROMPT_TEMPLATES.map((template, index) => ({
    ...template,
    id: `builtin_tpl_${index}`,
    createdAt: now,
    updatedAt: now,
  }));
};

const DEFAULT_SETTINGS: AISettings = {
  provider: "openai",
  model: "gpt-4o-mini",
  temperature: 0.7,
  maxTokens: 4096,
  apiKeys: {},
  systemPrompt: `You are a helpful AI assistant specialized in analyzing and understanding PDF documents. You help users by:
- Answering questions about document content
- Summarizing sections or entire documents
- Translating text while preserving formatting
- Explaining technical terms and concepts
- Finding and citing specific information with page numbers
- Suggesting insights and connections within the document

Always provide page numbers when referencing specific content. Be concise but thorough in your explanations.`,
  includePDFContext: true,
  customProviders: [],
  mcpServers: [],
  enableMCPTools: false,
  enableMultiStepTools: true,
  maxToolSteps: 5,
  imageSettings: DEFAULT_IMAGE_SETTINGS,
  speechSettings: DEFAULT_SPEECH_SETTINGS,
  transcriptionSettings: DEFAULT_TRANSCRIPTION_SETTINGS,
  quickCommands: generateDefaultQuickCommands(),
  promptTemplates: generateDefaultPromptTemplates(),
  defaultTranslationLanguage: 'Chinese',
};

export const useAIChatStore = create<AIChatState>()(
  persist(
    (set, get) => ({
      // Initial State
      isSidebarOpen: false,
      isLoading: false,
      error: null,
      conversations: {},
      currentConversationId: null,
      settings: DEFAULT_SETTINGS,
      pdfContext: null,
      sessionUsage: {
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalReasoningTokens: 0,
        totalCachedTokens: 0,
        messageCount: 0,
      },
      currentResearch: null,
      researchHistory: [],

      // UI Actions
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // Conversation Actions
      createConversation: (title) => {
        const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const pdfContext = get().pdfContext;
        const conversation: Conversation = {
          id,
          title: title || (pdfContext ? `Chat: ${pdfContext.fileName}` : "New Conversation"),
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          pdfFileName: pdfContext?.fileName,
        };

        set((state) => ({
          conversations: { ...state.conversations, [id]: conversation },
          currentConversationId: id,
        }));

        return id;
      },

      deleteConversation: (id) =>
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [id]: _deleted, ...rest } = state.conversations;
          return {
            conversations: rest,
            currentConversationId:
              state.currentConversationId === id ? null : state.currentConversationId,
          };
        }),

      setCurrentConversation: (id) => set({ currentConversationId: id }),

      updateConversationTitle: (id, title) =>
        set((state) => ({
          conversations: {
            ...state.conversations,
            [id]: {
              ...state.conversations[id],
              title,
              updatedAt: Date.now(),
            },
          },
        })),

      addMessage: (message) =>
        set((state) => {
          const { currentConversationId, conversations } = state;
          if (!currentConversationId || !conversations[currentConversationId]) {
            return state;
          }

          return {
            conversations: {
              ...conversations,
              [currentConversationId]: {
                ...conversations[currentConversationId],
                messages: [...conversations[currentConversationId].messages, message],
                updatedAt: Date.now(),
              },
            },
          };
        }),

      updateMessage: (messageId, updates) =>
        set((state) => {
          const { currentConversationId, conversations } = state;
          if (!currentConversationId || !conversations[currentConversationId]) {
            return state;
          }

          return {
            conversations: {
              ...conversations,
              [currentConversationId]: {
                ...conversations[currentConversationId],
                messages: conversations[currentConversationId].messages.map((msg) =>
                  msg.id === messageId ? { ...msg, ...updates } : msg
                ),
                updatedAt: Date.now(),
              },
            },
          };
        }),

      clearMessages: () =>
        set((state) => {
          const { currentConversationId, conversations } = state;
          if (!currentConversationId || !conversations[currentConversationId]) {
            return state;
          }

          return {
            conversations: {
              ...conversations,
              [currentConversationId]: {
                ...conversations[currentConversationId],
                messages: [],
                updatedAt: Date.now(),
              },
            },
          };
        }),

      deleteMessage: (messageId) =>
        set((state) => {
          const { currentConversationId, conversations } = state;
          if (!currentConversationId || !conversations[currentConversationId]) {
            return state;
          }

          return {
            conversations: {
              ...conversations,
              [currentConversationId]: {
                ...conversations[currentConversationId],
                messages: conversations[currentConversationId].messages.filter(
                  (msg) => msg.id !== messageId
                ),
                updatedAt: Date.now(),
              },
            },
          };
        }),

      // Settings Actions
      updateSettings: (settings) =>
        set((state) => ({
          settings: { ...state.settings, ...settings },
        })),

      setAPIKey: (provider, key) =>
        set((state) => ({
          settings: {
            ...state.settings,
            apiKeys: {
              ...state.settings.apiKeys,
              [provider]: key,
            },
          },
        })),

      // PDF Context Actions
      setPDFContext: (context) => set({ pdfContext: context }),

      updatePDFContext: (updates) =>
        set((state) => ({
          pdfContext: state.pdfContext ? { ...state.pdfContext, ...updates } : null,
        })),

      // Token Usage Actions
      updateSessionUsage: (usage) =>
        set((state) => {
          const newSessionUsage = {
            totalInputTokens: state.sessionUsage.totalInputTokens + (usage.inputTokens ?? 0),
            totalOutputTokens: state.sessionUsage.totalOutputTokens + (usage.outputTokens ?? 0),
            totalReasoningTokens: state.sessionUsage.totalReasoningTokens + (usage.reasoningTokens ?? 0),
            totalCachedTokens: state.sessionUsage.totalCachedTokens + (usage.cachedInputTokens ?? 0),
            messageCount: state.sessionUsage.messageCount + 1,
          };

          // Also update conversation usage if one is active
          const { currentConversationId, conversations } = state;
          if (currentConversationId && conversations[currentConversationId]) {
            const conv = conversations[currentConversationId];
            const convUsage = conv.usage || {
              totalInputTokens: 0,
              totalOutputTokens: 0,
              totalReasoningTokens: 0,
              totalCachedTokens: 0,
              messageCount: 0,
            };
            return {
              sessionUsage: newSessionUsage,
              conversations: {
                ...conversations,
                [currentConversationId]: {
                  ...conv,
                  usage: {
                    totalInputTokens: convUsage.totalInputTokens + (usage.inputTokens ?? 0),
                    totalOutputTokens: convUsage.totalOutputTokens + (usage.outputTokens ?? 0),
                    totalReasoningTokens: convUsage.totalReasoningTokens + (usage.reasoningTokens ?? 0),
                    totalCachedTokens: convUsage.totalCachedTokens + (usage.cachedInputTokens ?? 0),
                    messageCount: convUsage.messageCount + 1,
                  },
                },
              },
            };
          }
          return { sessionUsage: newSessionUsage };
        }),

      resetSessionUsage: () =>
        set({
          sessionUsage: {
            totalInputTokens: 0,
            totalOutputTokens: 0,
            totalReasoningTokens: 0,
            totalCachedTokens: 0,
            messageCount: 0,
          },
        }),

      getContextWindowSize: () => {
        const { settings } = get();
        const model = AI_MODELS.find((m) => m.id === settings.model);
        return model?.contextWindow || 128000;
      },

      // Helpers
      getCurrentConversation: () => {
        const { currentConversationId, conversations } = get();
        return currentConversationId ? conversations[currentConversationId] || null : null;
      },

      getConversationList: () => {
        const { conversations } = get();
        return Object.values(conversations).sort((a, b) => b.updatedAt - a.updatedAt);
      },

      hasAPIKey: (provider) => {
        const { settings } = get();
        return !!settings.apiKeys[provider];
      },

      getTotalUsedTokens: () => {
        const { sessionUsage } = get();
        return (
          sessionUsage.totalInputTokens +
          sessionUsage.totalOutputTokens +
          sessionUsage.totalReasoningTokens
        );
      },

      // Custom Provider Actions
      addCustomProvider: (provider) => {
        const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newProvider: CustomProvider = { ...provider, id, isEnabled: true };
        set((state) => ({
          settings: {
            ...state.settings,
            customProviders: [...state.settings.customProviders, newProvider],
          },
        }));
        return id;
      },

      updateCustomProvider: (id, updates) =>
        set((state) => ({
          settings: {
            ...state.settings,
            customProviders: state.settings.customProviders.map((p) =>
              p.id === id ? { ...p, ...updates } : p
            ),
          },
        })),

      deleteCustomProvider: (id) =>
        set((state) => ({
          settings: {
            ...state.settings,
            customProviders: state.settings.customProviders.filter((p) => p.id !== id),
            // Reset to openai if current custom provider is deleted
            ...(state.settings.customProviderId === id
              ? { provider: 'openai' as AIProvider, customProviderId: undefined, model: 'gpt-4o-mini' }
              : {}),
          },
        })),

      addPresetProvider: (presetIndex) => {
        const preset = PRESET_PROVIDERS[presetIndex];
        if (!preset) return '';
        const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newProvider: CustomProvider = { ...preset, id, isEnabled: true };
        set((state) => ({
          settings: {
            ...state.settings,
            customProviders: [...state.settings.customProviders, newProvider],
          },
        }));
        return id;
      },

      // MCP Server Actions
      addMCPServer: (server) => {
        const now = Date.now();
        const id = `mcp_${now}_${Math.random().toString(36).substr(2, 9)}`;
        const newServer: MCPServerConfig = {
          ...server,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          settings: {
            ...state.settings,
            mcpServers: [...state.settings.mcpServers, newServer],
          },
        }));
        return id;
      },

      updateMCPServer: (id, updates) =>
        set((state) => ({
          settings: {
            ...state.settings,
            mcpServers: state.settings.mcpServers.map((s) =>
              s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s
            ),
          },
        })),

      deleteMCPServer: (id) =>
        set((state) => ({
          settings: {
            ...state.settings,
            mcpServers: state.settings.mcpServers.filter((s) => s.id !== id),
          },
        })),

      toggleMCPServer: (id) =>
        set((state) => ({
          settings: {
            ...state.settings,
            mcpServers: state.settings.mcpServers.map((s) =>
              s.id === id ? { ...s, enabled: !s.enabled, updatedAt: Date.now() } : s
            ),
          },
        })),

      getEnabledMCPServers: () => {
        const { settings } = get();
        return settings.mcpServers.filter((s) => s.enabled);
      },

      // Deep Research Actions
      startResearch: (query) => {
        const id = `research_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const workflow: ResearchWorkflow = {
          id,
          query,
          status: 'planning',
          steps: [],
          currentStepIndex: -1,
          sources: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set({ currentResearch: workflow });
        return id;
      },

      updateResearchStep: (stepId, updates) =>
        set((state) => {
          if (!state.currentResearch) return state;
          return {
            currentResearch: {
              ...state.currentResearch,
              steps: state.currentResearch.steps.map((step) =>
                step.id === stepId ? { ...step, ...updates } : step
              ),
              updatedAt: Date.now(),
            },
          };
        }),

      addResearchStep: (step) => {
        const id = `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        set((state) => {
          if (!state.currentResearch) return state;
          return {
            currentResearch: {
              ...state.currentResearch,
              steps: [...state.currentResearch.steps, { ...step, id }],
              currentStepIndex: state.currentResearch.steps.length,
              updatedAt: Date.now(),
            },
          };
        });
        return id;
      },

      setResearchPlan: (plan) =>
        set((state) => {
          if (!state.currentResearch) return state;
          return {
            currentResearch: {
              ...state.currentResearch,
              plan,
              status: 'researching',
              updatedAt: Date.now(),
            },
          };
        }),

      completeResearch: (report) =>
        set((state) => {
          if (!state.currentResearch) return state;
          const completed: ResearchWorkflow = {
            ...state.currentResearch,
            status: 'complete',
            finalReport: report,
            completedAt: Date.now(),
            updatedAt: Date.now(),
            totalDuration: Date.now() - state.currentResearch.createdAt,
          };
          return {
            currentResearch: completed,
            researchHistory: [completed, ...state.researchHistory].slice(0, 20), // Keep last 20
          };
        }),

      cancelResearch: () =>
        set((state) => {
          if (!state.currentResearch) return state;
          return {
            currentResearch: {
              ...state.currentResearch,
              status: 'cancelled',
              updatedAt: Date.now(),
            },
          };
        }),

      clearCurrentResearch: () => set({ currentResearch: null }),

      // Media Settings Actions
      updateImageSettings: (settings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            imageSettings: { ...state.settings.imageSettings, ...settings },
          },
        })),

      updateSpeechSettings: (settings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            speechSettings: { ...state.settings.speechSettings, ...settings },
          },
        })),

      updateTranscriptionSettings: (settings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            transcriptionSettings: { ...state.settings.transcriptionSettings, ...settings },
          },
        })),

      // Quick Commands Actions
      addQuickCommand: (command) => {
        const id = `custom_cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newCommand: QuickCommand = { ...command, id };
        set((state) => ({
          settings: {
            ...state.settings,
            quickCommands: [...state.settings.quickCommands, newCommand],
          },
        }));
        return id;
      },

      updateQuickCommand: (id, updates) =>
        set((state) => ({
          settings: {
            ...state.settings,
            quickCommands: state.settings.quickCommands.map((cmd) =>
              cmd.id === id ? { ...cmd, ...updates } : cmd
            ),
          },
        })),

      deleteQuickCommand: (id) =>
        set((state) => ({
          settings: {
            ...state.settings,
            quickCommands: state.settings.quickCommands.filter((cmd) => cmd.id !== id),
          },
        })),

      toggleQuickCommand: (id) =>
        set((state) => ({
          settings: {
            ...state.settings,
            quickCommands: state.settings.quickCommands.map((cmd) =>
              cmd.id === id ? { ...cmd, enabled: !cmd.enabled } : cmd
            ),
          },
        })),

      getEnabledQuickCommands: () => {
        const { settings } = get();
        return settings.quickCommands.filter((cmd) => cmd.enabled);
      },

      resetQuickCommands: () =>
        set((state) => ({
          settings: {
            ...state.settings,
            quickCommands: generateDefaultQuickCommands(),
          },
        })),

      // Prompt Templates Actions
      addPromptTemplate: (template) => {
        const id = `custom_tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = Date.now();
        const newTemplate: PromptTemplate = { ...template, id, createdAt: now, updatedAt: now };
        set((state) => ({
          settings: {
            ...state.settings,
            promptTemplates: [...state.settings.promptTemplates, newTemplate],
          },
        }));
        return id;
      },

      updatePromptTemplate: (id, updates) =>
        set((state) => ({
          settings: {
            ...state.settings,
            promptTemplates: state.settings.promptTemplates.map((tpl) =>
              tpl.id === id ? { ...tpl, ...updates, updatedAt: Date.now() } : tpl
            ),
          },
        })),

      deletePromptTemplate: (id) =>
        set((state) => ({
          settings: {
            ...state.settings,
            promptTemplates: state.settings.promptTemplates.filter((tpl) => tpl.id !== id),
          },
        })),

      getPromptTemplatesByCategory: (category) => {
        const { settings } = get();
        return settings.promptTemplates.filter((tpl) => tpl.category === category);
      },

      resetPromptTemplates: () =>
        set((state) => ({
          settings: {
            ...state.settings,
            promptTemplates: generateDefaultPromptTemplates(),
          },
        })),

      // Template Processing - Replace variables with actual values
      processTemplate: (template, extraVars = {}) => {
        const { pdfContext, settings } = get();
        let result = template;
        
        // Replace built-in variables
        result = result.replace(/\{\{selection\}\}/g, pdfContext?.selectedText || pdfContext?.pageText || '[No text selected]');
        result = result.replace(/\{\{page\}\}/g, String(pdfContext?.currentPage || 1));
        result = result.replace(/\{\{pageText\}\}/g, pdfContext?.pageText || '[No page text available]');
        result = result.replace(/\{\{fileName\}\}/g, pdfContext?.fileName || 'Document');
        result = result.replace(/\{\{totalPages\}\}/g, String(pdfContext?.totalPages || 1));
        result = result.replace(/\{\{language\}\}/g, extraVars.language || settings.defaultTranslationLanguage || 'Chinese');
        
        // Replace any extra variables
        for (const [key, value] of Object.entries(extraVars)) {
          result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
        }
        
        return result;
      },

      // Helper to get API key for any provider
      getProviderAPIKey: (providerId) => {
        const { settings } = get();
        if (providerId) {
          return settings.apiKeys[providerId];
        }
        if (settings.provider === 'custom' && settings.customProviderId) {
          return settings.apiKeys[settings.customProviderId];
        }
        return settings.apiKeys[settings.provider];
      },

      // Helper to get all available models
      getAllModels: () => {
        const { settings } = get();
        const builtInModels: AIModel[] = AI_MODELS;
        const customModels = settings.customProviders
          .filter((p) => p.isEnabled)
          .flatMap((p) =>
            p.models.map((m) => ({
              ...m,
              providerId: p.id,
              providerName: p.name,
            }))
          );
        return [...builtInModels, ...customModels];
      },
    }),
    {
      name: "ai-chat-storage",
      partialize: (state) => ({
        conversations: state.conversations,
        settings: {
          ...state.settings,
          // Don't persist API keys in localStorage for security
          apiKeys: {},
        },
        currentConversationId: state.currentConversationId,
      }),
      // Merge function to handle backwards compatibility with old persisted state
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<AIChatState>;
        return {
          ...currentState,
          ...persisted,
          settings: {
            ...currentState.settings,
            ...persisted?.settings,
            // Ensure customProviders is always an array
            customProviders: persisted?.settings?.customProviders || [],
            // Ensure apiKeys is always an object
            apiKeys: persisted?.settings?.apiKeys || {},
            // Ensure MCP settings have defaults for backward compatibility
            mcpServers: persisted?.settings?.mcpServers || [],
            enableMCPTools: persisted?.settings?.enableMCPTools ?? false,
            enableMultiStepTools: persisted?.settings?.enableMultiStepTools ?? true,
            maxToolSteps: persisted?.settings?.maxToolSteps ?? 5,
            // Ensure media settings have defaults for backward compatibility
            imageSettings: persisted?.settings?.imageSettings || DEFAULT_IMAGE_SETTINGS,
            speechSettings: persisted?.settings?.speechSettings || DEFAULT_SPEECH_SETTINGS,
            transcriptionSettings: persisted?.settings?.transcriptionSettings || DEFAULT_TRANSCRIPTION_SETTINGS,
            // Ensure quick commands and templates have defaults for backward compatibility
            quickCommands: persisted?.settings?.quickCommands?.length 
              ? persisted.settings.quickCommands 
              : generateDefaultQuickCommands(),
            promptTemplates: persisted?.settings?.promptTemplates?.length
              ? persisted.settings.promptTemplates
              : generateDefaultPromptTemplates(),
            defaultTranslationLanguage: persisted?.settings?.defaultTranslationLanguage || 'Chinese',
          },
        };
      },
    }
  )
);

"use client";

import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAIChatStore, AI_MODELS } from "@/lib/ai-chat-store";
import { useAIChat } from "@/hooks/use-ai-chat";
import { usePDFContext } from "@/hooks/use-pdf-context";
import {
  useImageGeneration,
  useSpeechSynthesis,
  useTranscription,
  downloadImage,
  downloadAudio,
} from "@/hooks/use-ai-media";
import {
  IMAGE_MODELS,
  IMAGE_SIZES,
  SPEECH_MODELS,
  SPEECH_VOICES,
  TRANSCRIPTION_MODELS,
} from "@/lib/ai-providers";
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
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FileText,
  Languages,
  Lightbulb,
  BookOpen,
  AlertCircle,
  Search,
  Eye,
  Image as ImageIcon,
  ScanEye,
  Wand2,
  Volume2,
  Mic,
  Play,
  Pause,
  Square,
  Download,
  Copy,
  Upload,
  X,
  Sparkles,
  Zap,
  ArrowRight,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader } from "@/components/ai-elements/loader";
import { cn } from "@/lib/utils";
import type { ImageSize, SpeechVoice } from "@/lib/ai-providers";
import { AIChartInsight } from "./ai-chart-insight";
import { AIReportGenerator } from "./ai-report-generator";

export function AIToolsPanel() {
  const { t } = useTranslation();
  const { sendMessage, isLoading } = useAIChat();
  const {
    pdfContext,
    settings,
    updateImageSettings,
    updateSpeechSettings,
    updateTranscriptionSettings,
  } = useAIChatStore();
  const { extractCurrentPageImages } = usePDFContext();

  // Media generation hooks
  const imageGen = useImageGeneration();
  const speechSynth = useSpeechSynthesis();
  const transcription = useTranscription();

  // File input ref for transcription
  const audioFileInputRef = useRef<HTMLInputElement>(null);

  const [targetLanguage, setTargetLanguage] = useState("Chinese");
  const [customPrompt, setCustomPrompt] = useState("");
  const [isExtractingImage, setIsExtractingImage] = useState(false);

  // Image generation state
  const [imagePrompt, setImagePrompt] = useState("");

  // Speech synthesis state
  const [speechText, setSpeechText] = useState("");

  // Transcription state
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);

  const hasContent = !!pdfContext?.pageText || !!pdfContext?.selectedText;

  // Check if current model supports vision
  const currentModel = AI_MODELS.find((m) => m.id === settings.model);
  const supportsVision = currentModel?.supportsVision || false;

  const handleSummarize = async () => {
    if (!hasContent) return;

    const text = pdfContext?.selectedText || pdfContext?.pageText;
    await sendMessage(
      `Please provide a comprehensive summary of the following text from page ${pdfContext?.currentPage}:\n\n${text}`
    );
  };

  const handleTranslate = async () => {
    if (!hasContent) return;

    const text = pdfContext?.selectedText || pdfContext?.pageText;
    await sendMessage(
      `Please translate the following text to ${targetLanguage}. Preserve formatting where possible:\n\n${text}`
    );
  };

  const handleExplain = async () => {
    if (!hasContent) return;

    const text = pdfContext?.selectedText;
    if (text) {
      await sendMessage(
        `Please explain this text in detail, breaking down complex concepts and providing context:\n\n${text}`
      );
    } else {
      await sendMessage(
        `Please explain the main concepts and ideas on page ${pdfContext?.currentPage} of this document.`
      );
    }
  };

  const handleGenerateStudyGuide = async () => {
    const annotations = pdfContext?.annotations || [];
    if (annotations.length === 0) {
      await sendMessage(
        `Please create a study guide based on the content of page ${pdfContext?.currentPage}.`
      );
    } else {
      const annotationText = annotations
        .map((ann) => `- [Page ${ann.pageNumber}] ${ann.text}`)
        .join("\n");

      await sendMessage(
        `Please create a comprehensive study guide based on these annotations:\n\n${annotationText}`
      );
    }
  };

  const handleSemanticSearch = async () => {
    if (!customPrompt.trim()) return;

    await sendMessage(
      `Search for and explain information about: "${customPrompt}" in this document. Include page references if found.`
    );
    setCustomPrompt("");
  };

  const handleCustomPrompt = async () => {
    if (!customPrompt.trim()) return;

    await sendMessage(customPrompt);
    setCustomPrompt("");
  };

  const handleAnalyzePageVisually = async () => {
    if (!supportsVision) return;

    setIsExtractingImage(true);
    try {
      const images = await extractCurrentPageImages();
      if (images && images.length > 0) {
        await sendMessage(
          `Please analyze this PDF page visually. Describe what you see, extract any text from images, identify diagrams, charts, tables, or other visual elements, and explain their significance.`
        );
      }
    } finally {
      setIsExtractingImage(false);
    }
  };

  const handleExtractTextFromImage = async () => {
    if (!supportsVision) return;

    setIsExtractingImage(true);
    try {
      const images = await extractCurrentPageImages();
      if (images && images.length > 0) {
        await sendMessage(
          `Please extract all text from this page image using OCR. Preserve the layout and formatting as much as possible.`
        );
      }
    } finally {
      setIsExtractingImage(false);
    }
  };

  const handleIdentifyDiagrams = async () => {
    if (!supportsVision) return;

    setIsExtractingImage(true);
    try {
      const images = await extractCurrentPageImages();
      if (images && images.length > 0) {
        await sendMessage(
          `Identify and describe all diagrams, flowcharts, graphs, tables, and visual elements on this page. Explain what each represents and their relationships.`
        );
      }
    } finally {
      setIsExtractingImage(false);
    }
  };

  // Image Generation Handlers
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    await imageGen.generate(imagePrompt);
  };

  const handleUsePageContextForImage = () => {
    const context =
      pdfContext?.selectedText || pdfContext?.pageText?.slice(0, 500);
    if (context) {
      setImagePrompt(`Create an illustration for: ${context}`);
    }
  };

  // Speech Synthesis Handlers
  const handleSynthesizeSpeech = async () => {
    if (!speechText.trim()) return;
    await speechSynth.synthesize(speechText);
  };

  const handleUsePageTextForSpeech = () => {
    const text = pdfContext?.selectedText || pdfContext?.pageText;
    if (text) {
      setSpeechText(text.slice(0, 4000)); // Limit to 4000 chars
    }
  };

  // Transcription Handlers
  const handleAudioFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && transcription.isValidFile(file)) {
      setSelectedAudioFile(file);
    }
  };

  const handleTranscribe = async () => {
    if (!selectedAudioFile) return;
    await transcription.transcribe(selectedAudioFile);
  };

  const handleCopyTranscription = async () => {
    if (transcription.result?.text) {
      await navigator.clipboard.writeText(transcription.result.text);
    }
  };

  const handleInsertTranscription = async () => {
    if (transcription.result?.text) {
      await sendMessage(
        `I transcribed this audio: "${transcription.result.text}"\n\nPlease help me understand or summarize this content.`
      );
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Status Alert - Enhanced with better styling */}
      {!hasContent && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-sm">
            {t("ai.no_pdf_context")}
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Actions Header */}
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">
          {t("ai.ai_tools", "AI Tools")}
        </span>
        <Badge variant="secondary" className="text-[10px] ml-auto">
          {hasContent
            ? t("ai.ready", "Ready")
            : t("ai.no_context", "No Context")}
        </Badge>
      </div>

      {/* Quick Actions - Enhanced with better visuals */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm">{t("ai.quick_actions")}</CardTitle>
              <CardDescription className="text-xs">
                {t("ai.quick_actions_description")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-between gap-2 group",
                    "hover:bg-primary/5 hover:border-primary/30"
                  )}
                  onClick={handleSummarize}
                  disabled={isLoading || !hasContent}
                >
                  <span className="flex items-center gap-2">
                    {isLoading ? (
                      <Loader size={16} className="text-primary" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    {t("ai.summarize_page")}
                  </span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {t("ai.summarize_tooltip", "Generate a comprehensive summary")}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-between gap-2 group",
                    "hover:bg-primary/5 hover:border-primary/30"
                  )}
                  onClick={handleExplain}
                  disabled={isLoading || !hasContent}
                >
                  <span className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    {t("ai.explain_content")}
                  </span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {t("ai.explain_tooltip", "Break down complex concepts")}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-between gap-2 group",
                    "hover:bg-primary/5 hover:border-primary/30"
                  )}
                  onClick={handleGenerateStudyGuide}
                  disabled={isLoading}
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    {t("ai.generate_study_guide")}
                  </span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {t(
                  "ai.study_guide_tooltip",
                  "Create a study guide from content"
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* Translation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("ai.translation")}</CardTitle>
          <CardDescription>{t("ai.translation_description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>{t("ai.target_language")}</Label>
            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Chinese">中文 (Chinese)</SelectItem>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Spanish">Español (Spanish)</SelectItem>
                <SelectItem value="French">Français (French)</SelectItem>
                <SelectItem value="German">Deutsch (German)</SelectItem>
                <SelectItem value="Japanese">日本語 (Japanese)</SelectItem>
                <SelectItem value="Korean">한국어 (Korean)</SelectItem>
                <SelectItem value="Russian">Русский (Russian)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleTranslate}
            disabled={isLoading || !hasContent}
          >
            <Languages className="w-4 h-4" />
            {t("ai.translate_to", { language: targetLanguage })}
          </Button>
        </CardContent>
      </Card>

      {/* Vision Analysis */}
      {supportsVision && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-4 h-4" />
              {t("ai.vision_analysis")}
            </CardTitle>
            <CardDescription>
              {t("ai.vision_analysis_description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleAnalyzePageVisually}
              disabled={isLoading || isExtractingImage}
            >
              {isExtractingImage ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <ScanEye className="w-4 h-4" />
              )}
              {t("ai.analyze_page_visually")}
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleExtractTextFromImage}
              disabled={isLoading || isExtractingImage}
            >
              {isExtractingImage ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              {t("ai.extract_text_from_image")}
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleIdentifyDiagrams}
              disabled={isLoading || isExtractingImage}
            >
              {isExtractingImage ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
              {t("ai.identify_diagrams")}
            </Button>

            <Alert variant="default" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {t("ai.vision_model_note", { model: currentModel?.name })}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Chart Insight - New Feature */}
      <AIChartInsight />

      {/* Report Generator - New Feature */}
      <AIReportGenerator />

      {/* Semantic Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("ai.semantic_search")}</CardTitle>
          <CardDescription>
            {t("ai.semantic_search_description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder={t("ai.search_placeholder")}
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleSemanticSearch}
            disabled={isLoading || !customPrompt.trim()}
          >
            <Search className="w-4 h-4" />
            {t("ai.search")}
          </Button>
        </CardContent>
      </Card>

      {/* Image Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wand2 className="w-4 h-4" />
            {t("ai.image_generation")}
          </CardTitle>
          <CardDescription>
            {t("ai.image_generation_description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>{t("ai.image_model")}</Label>
            <Select
              value={settings.imageSettings.model}
              onValueChange={(v) =>
                updateImageSettings({
                  model: v as typeof settings.imageSettings.model,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IMAGE_MODELS.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("ai.image_size")}</Label>
            <Select
              value={settings.imageSettings.size}
              onValueChange={(v) =>
                updateImageSettings({ size: v as ImageSize })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IMAGE_SIZES[settings.imageSettings.model]?.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("ai.image_prompt")}</Label>
            <Textarea
              placeholder={t("ai.image_prompt_placeholder")}
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUsePageContextForImage}
              disabled={!hasContent}
            >
              {t("ai.use_page_context")}
            </Button>
          </div>

          <Button
            className="w-full"
            onClick={handleGenerateImage}
            disabled={imageGen.isGenerating || !imagePrompt.trim()}
          >
            {imageGen.isGenerating ? (
              <Loader className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Wand2 className="w-4 h-4 mr-2" />
            )}
            {t("ai.generate_image")}
          </Button>

          {imageGen.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{imageGen.error}</AlertDescription>
            </Alert>
          )}

          {imageGen.result && imageGen.result.images.length > 0 && (
            <div className="space-y-2">
              <div className="relative rounded-lg overflow-hidden border">
                {/* eslint-disable-next-line @next/next/no-img-element -- Dynamic base64 data URL from AI generation */}
                <img
                  src={`data:image/png;base64,${imageGen.result.images[0].base64}`}
                  alt="Generated"
                  className="w-full h-auto"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    downloadImage(imageGen.result!.images[0].base64)
                  }
                >
                  <Download className="w-4 h-4 mr-1" />
                  {t("ai.download")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={imageGen.clearResult}
                >
                  <X className="w-4 h-4 mr-1" />
                  {t("ai.clear")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Speech Synthesis (Text-to-Speech) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            {t("ai.speech_synthesis")}
          </CardTitle>
          <CardDescription>
            {t("ai.speech_synthesis_description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>{t("ai.speech_model")}</Label>
            <Select
              value={settings.speechSettings.model}
              onValueChange={(v) =>
                updateSpeechSettings({
                  model: v as typeof settings.speechSettings.model,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPEECH_MODELS.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("ai.voice")}</Label>
            <Select
              value={settings.speechSettings.voice}
              onValueChange={(v) =>
                updateSpeechSettings({ voice: v as SpeechVoice })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPEECH_VOICES.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    {voice.name} - {voice.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              {t("ai.speed")}: {settings.speechSettings.speed.toFixed(1)}x
            </Label>
            <Slider
              value={[settings.speechSettings.speed]}
              onValueChange={([v]) => updateSpeechSettings({ speed: v })}
              min={0.25}
              max={4.0}
              step={0.25}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("ai.text_to_speak")}</Label>
            <Textarea
              placeholder={t("ai.text_to_speak_placeholder")}
              value={speechText}
              onChange={(e) => setSpeechText(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUsePageTextForSpeech}
              disabled={!hasContent}
            >
              {t("ai.use_page_text")}
            </Button>
          </div>

          <Button
            className="w-full"
            onClick={handleSynthesizeSpeech}
            disabled={speechSynth.isSynthesizing || !speechText.trim()}
          >
            {speechSynth.isSynthesizing ? (
              <Loader className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Volume2 className="w-4 h-4 mr-2" />
            )}
            {t("ai.generate_speech")}
          </Button>

          {speechSynth.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{speechSynth.error}</AlertDescription>
            </Alert>
          )}

          {speechSynth.audioUrl && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={
                    speechSynth.isPlaying ? speechSynth.pause : speechSynth.play
                  }
                >
                  {speechSynth.isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={speechSynth.stop}>
                  <Square className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadAudio(speechSynth.audioUrl!)}
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={speechSynth.clearResult}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audio Transcription (Speech-to-Text) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mic className="w-4 h-4" />
            {t("ai.audio_transcription")}
          </CardTitle>
          <CardDescription>
            {t("ai.audio_transcription_description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>{t("ai.transcription_model")}</Label>
            <Select
              value={settings.transcriptionSettings.model}
              onValueChange={(v) =>
                updateTranscriptionSettings({
                  model: v as typeof settings.transcriptionSettings.model,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSCRIPTION_MODELS.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("ai.audio_file")}</Label>
            <input
              type="file"
              ref={audioFileInputRef}
              accept="audio/*,.mp3,.mp4,.m4a,.wav,.webm,.ogg,.flac"
              onChange={handleAudioFileSelect}
              className="hidden"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => audioFileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                {selectedAudioFile
                  ? selectedAudioFile.name
                  : t("ai.select_audio_file")}
              </Button>
              {selectedAudioFile && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSelectedAudioFile(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("ai.supported_formats")}: MP3, MP4, M4A, WAV, WebM, OGG, FLAC
            </p>
          </div>

          <Button
            className="w-full"
            onClick={handleTranscribe}
            disabled={transcription.isTranscribing || !selectedAudioFile}
          >
            {transcription.isTranscribing ? (
              <Loader className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Mic className="w-4 h-4 mr-2" />
            )}
            {t("ai.transcribe")}
          </Button>

          {transcription.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{transcription.error}</AlertDescription>
            </Alert>
          )}

          {transcription.result && (
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-muted">
                <ScrollArea className="max-h-48">
                  <p className="text-sm whitespace-pre-wrap">
                    {transcription.result.text}
                  </p>
                </ScrollArea>
                {transcription.result.durationInSeconds && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {t("ai.duration")}:{" "}
                    {Math.round(transcription.result.durationInSeconds)}s
                    {transcription.result.language &&
                      ` | ${t("ai.language")}: ${transcription.result.language}`}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyTranscription}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  {t("ai.copy")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleInsertTranscription}
                >
                  {t("ai.insert_to_chat")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={transcription.clearResult}
                >
                  <X className="w-4 h-4 mr-1" />
                  {t("ai.clear")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Prompt */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("ai.custom_prompt")}</CardTitle>
          <CardDescription>{t("ai.custom_prompt_description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder={t("ai.custom_prompt_placeholder")}
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <Button
            className="w-full"
            onClick={handleCustomPrompt}
            disabled={isLoading || !customPrompt.trim()}
          >
            {t("ai.send")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

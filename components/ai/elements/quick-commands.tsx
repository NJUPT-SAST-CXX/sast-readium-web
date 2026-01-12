"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  useAIChatStore,
  type QuickCommand,
  type PromptTemplate,
  TEMPLATE_VARIABLES,
} from "@/lib/ai/core";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  FileText,
  Languages,
  Lightbulb,
  List,
  HelpCircle,
  BookOpen,
  Sparkles,
  GitCompare,
  Zap,
  Command as CommandIcon,
  ChevronRight,
  Hash,
  Plus,
} from "lucide-react";

// Icon mapping for quick commands
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Languages,
  Lightbulb,
  List,
  HelpCircle,
  BookOpen,
  Sparkles,
  GitCompare,
  Zap,
  Command: CommandIcon,
};

export interface QuickCommandsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (prompt: string) => void;
  filterText?: string;
  className?: string;
  triggerRef?: React.RefObject<HTMLElement>;
  position?: { top: number; left: number };
}

export function QuickCommands({
  open,
  onOpenChange,
  onSelect,
  filterText = "",
  className,
  position,
}: QuickCommandsProps) {
  const { t } = useTranslation();
  const { settings, getEnabledQuickCommands, processTemplate } =
    useAIChatStore();
  const [searchValue, setSearchValue] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  // Get enabled quick commands
  const enabledCommands = useMemo(
    () => getEnabledQuickCommands(),
    [getEnabledQuickCommands]
  );

  // Filter by search or slash command
  const filteredCommands = useMemo(() => {
    const query =
      searchValue.toLowerCase() || filterText.toLowerCase().replace(/^\//, "");
    if (!query) return enabledCommands;

    return enabledCommands.filter(
      (cmd) =>
        cmd.name.toLowerCase().includes(query) ||
        cmd.description.toLowerCase().includes(query) ||
        cmd.shortcut?.toLowerCase().includes(`/${query}`)
    );
  }, [enabledCommands, searchValue, filterText]);

  // Get prompt templates grouped by category
  const templatesByCategory = useMemo(() => {
    const categories: Record<string, PromptTemplate[]> = {};
    settings.promptTemplates.forEach((tpl) => {
      if (!categories[tpl.category]) {
        categories[tpl.category] = [];
      }
      categories[tpl.category].push(tpl);
    });
    return categories;
  }, [settings.promptTemplates]);

  // Handle command selection
  const handleSelectCommand = useCallback(
    (command: QuickCommand) => {
      const processedPrompt = processTemplate(command.prompt);
      onSelect(processedPrompt);
      onOpenChange(false);
      setSearchValue("");
    },
    [processTemplate, onSelect, onOpenChange]
  );

  // Handle template selection
  const handleSelectTemplate = useCallback(
    (template: PromptTemplate) => {
      const processedPrompt = processTemplate(template.content);
      onSelect(processedPrompt);
      onOpenChange(false);
      setSearchValue("");
    },
    [processTemplate, onSelect, onOpenChange]
  );

  // Reset search when closed - using onOpenChange callback pattern
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setSearchValue("");
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  // Get icon component for a command
  const getIcon = (iconName?: string) => {
    if (!iconName) return Zap;
    return ICON_MAP[iconName] || Zap;
  };

  const popoverStyle = position
    ? {
        position: "fixed" as const,
        top: position.top,
        left: position.left,
      }
    : {};

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <span className="hidden" />
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-80 p-0", className)}
        style={popoverStyle}
        align="start"
        side="top"
        sideOffset={8}
      >
        <Command className="rounded-lg border-0">
          <CommandInput
            placeholder={t(
              "ai.quick_commands.search_placeholder",
              "Search commands..."
            )}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList ref={listRef}>
            <CommandEmpty>
              {t("ai.quick_commands.no_results", "No commands found.")}
            </CommandEmpty>

            {/* Quick Commands */}
            {filteredCommands.length > 0 && (
              <CommandGroup
                heading={t("ai.quick_commands.title", "Quick Commands")}
              >
                {filteredCommands.map((cmd) => {
                  const Icon = getIcon(cmd.icon);
                  return (
                    <CommandItem
                      key={cmd.id}
                      value={cmd.name}
                      onSelect={() => handleSelectCommand(cmd)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{cmd.name}</span>
                          {cmd.shortcut && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1 py-0"
                            >
                              {cmd.shortcut}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {cmd.description}
                        </p>
                      </div>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {/* Prompt Templates by Category */}
            {!searchValue && Object.entries(templatesByCategory).length > 0 && (
              <>
                <CommandSeparator />
                {Object.entries(templatesByCategory).map(
                  ([category, templates]) => (
                    <CommandGroup key={category} heading={category}>
                      {templates.slice(0, 3).map((tpl) => (
                        <CommandItem
                          key={tpl.id}
                          value={tpl.name}
                          onSelect={() => handleSelectTemplate(tpl)}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <span className="font-medium">{tpl.name}</span>
                            <p className="text-xs text-muted-foreground truncate">
                              {tpl.description}
                            </p>
                          </div>
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )
                )}
              </>
            )}
          </CommandList>

          {/* Variable Hints Footer */}
          <div className="border-t p-2 bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">
              {t("ai.quick_commands.variables_hint", "Available variables:")}
            </p>
            <div className="flex flex-wrap gap-1">
              {TEMPLATE_VARIABLES.slice(0, 4).map((v) => (
                <Badge
                  key={v.key}
                  variant="secondary"
                  className="text-[10px] px-1 py-0"
                >
                  {v.key}
                </Badge>
              ))}
              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                +{TEMPLATE_VARIABLES.length - 4}
              </Badge>
            </div>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Inline trigger button for the chat input
export interface QuickCommandsTriggerProps {
  onClick?: () => void;
  className?: string;
}

export function QuickCommandsTrigger({
  onClick,
  className,
}: QuickCommandsTriggerProps) {
  const { t } = useTranslation();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn("h-7 w-7", className)}
      onClick={onClick}
      title={t("ai.quick_commands.trigger_tooltip", "Quick Commands (/)")}
    >
      <Zap className="h-4 w-4" />
    </Button>
  );
}

// Hook to handle slash command detection in input
// Returns computed values and handlers - no side effects in render
export function useSlashCommands(inputValue: string) {
  const [isOpen, setIsOpen] = useState(false);

  // Compute if input starts with slash
  const startsWithSlash = inputValue.startsWith("/");
  const slashFilter = startsWithSlash ? inputValue : "";

  // Handler to check input and update open state
  const checkInput = useCallback((value: string) => {
    const shouldBeOpen = value.startsWith("/");
    setIsOpen(shouldBeOpen);
  }, []);

  // Close handler
  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Open handler
  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  return {
    isOpen,
    isSlashActive: startsWithSlash,
    slashFilter,
    checkInput,
    close,
    open,
    setIsOpen,
  };
}

// Variable insertion helper component
export interface VariableInsertProps {
  onInsert: (variable: string) => void;
  className?: string;
}

export function VariableInsert({ onInsert, className }: VariableInsertProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn("h-7 gap-1 text-xs", className)}
        >
          <Plus className="h-3 w-3" />
          {t("ai.quick_commands.insert_variable", "Variable")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <p className="text-xs font-medium mb-2">
          {t(
            "ai.quick_commands.select_variable",
            "Select a variable to insert"
          )}
        </p>
        <ScrollArea className="h-48">
          <div className="space-y-1">
            {TEMPLATE_VARIABLES.map((v) => (
              <Button
                key={v.key}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left h-auto py-2"
                onClick={() => {
                  onInsert(v.key);
                  setOpen(false);
                }}
              >
                <div>
                  <code className="text-xs bg-muted px-1 rounded">{v.key}</code>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {v.description}
                  </p>
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

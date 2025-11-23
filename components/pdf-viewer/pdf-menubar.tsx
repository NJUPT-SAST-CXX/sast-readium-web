'use client';

import { useState } from 'react';
import { 
  File, 
  Edit3, 
  View, 
  Settings,
  ChevronDown,
  ChevronUp,
  FileText,
  Save,
  Share2,
  Printer,
  Download,
  Undo,
  Redo,
  Copy,
  Scissors,
  Clipboard,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw, // eslint-disable-line @typescript-eslint/no-unused-vars
  Maximize2,
  Grid3x3,
  List,
  Search,
  Bookmark,
  MessageSquare,
  Sun, // eslint-disable-line @typescript-eslint/no-unused-vars
  Moon, // eslint-disable-line @typescript-eslint/no-unused-vars
  FolderOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { usePDFStore } from '@/lib/pdf-store';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/language-switcher';
import { PDFPropertiesDialog } from './pdf-properties-dialog';
import { PDFRecentFilesDialog } from './pdf-recent-files-dialog';
import { isTauri, renameFile } from '@/lib/tauri-bridge';

interface MenuSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: {
    label: string;
    icon?: React.ReactNode;
    shortcut?: string;
    action?: () => void;
    divider?: boolean;
  }[];
}

interface PDFMenuBarProps {
  onDownload?: () => void;
  onPrint?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  onSearch?: () => void;
  onOpenSettings?: () => void;
}

export function PDFMenuBar({ onDownload, onPrint, onShare, onSave, onSearch, onOpenSettings, onOpenFile, onOpenFolder, onRevealInFileManager, onOpenRecentFile, onFileUpdate }: PDFMenuBarProps & { onOpenFile?: () => void; onOpenFolder?: () => void; onRevealInFileManager?: () => void; onOpenRecentFile?: (file: File) => void; onFileUpdate?: (newFile: File) => void }) {
  const { t } = useTranslation();
  const {
    currentPDF,
    zoomIn,
    zoomOut,
    rotateClockwise,
    toggleThumbnails,
    toggleOutline,
    toggleAnnotations,
    undoAnnotation,
    redoAnnotation,
    canUndo,
    canRedo,
    setViewMode,
    showMenuBar,
    toggleDarkMode, // eslint-disable-line @typescript-eslint/no-unused-vars
    isDarkMode, // eslint-disable-line @typescript-eslint/no-unused-vars
  } = usePDFStore();

  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [showProperties, setShowProperties] = useState(false);
  const [showRecentFiles, setShowRecentFiles] = useState(false);

  const getCurrentNativePath = () => {
    const file = currentPDF as (File & { __nativePath?: string | null }) | null;
    const nativePath = file?.__nativePath ?? null;
    return nativePath ? String(nativePath) : null;
  };

  const handleCopyCurrentFilePath = async () => {
    const nativePath = getCurrentNativePath();
    if (!nativePath) return;
    try {
      await navigator.clipboard.writeText(nativePath);
    } catch (error) {
      console.error('Failed to copy current file path:', error);
    }
  };

  const handleRenameCurrentFile = async () => {
    const nativePath = getCurrentNativePath();
    if (!nativePath || !isTauri()) return;

    const file = currentPDF as File | null;
    const currentName = file?.name || 'document.pdf';
    const input = window.prompt(t('menu.file.rename'), currentName);
    if (!input) return;

    const trimmed = input.trim();
    if (!trimmed || trimmed === currentName) return;

    const ok = await renameFile(nativePath, trimmed);
    if (!ok) return;

    // Note: recentFiles entries are updated when reopening via recent dialog; here we only
    // rename the file on disk and the in-memory File name used for UI.
    if (file) {
      try {
        Object.defineProperty(file, 'name', { value: trimmed, configurable: true });
      } catch {
        // best effort; ignore if we cannot redefine the property
      }
    }
  };

  // Clipboard operations
  const handleCut = async () => {
    try {
      const selection = window.getSelection();
      const text = selection?.toString();
      if (text) {
        await navigator.clipboard.writeText(text);
        // Note: Actual cutting (removing text) is limited in PDF context
        // as PDFs are typically read-only documents
      }
    } catch (err) {
      console.error('Failed to cut text:', err);
    }
  };

  const handleCopy = async () => {
    try {
      const selection = window.getSelection();
      const text = selection?.toString();
      if (text) {
        await navigator.clipboard.writeText(text);
      }
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      // Paste functionality is limited in PDF viewer context
      // This is mainly for form fields or text annotations
      console.log('Paste:', text);
    } catch (err) {
      console.error('Failed to paste text:', err);
    }
  };

  // New window functionality
  const handleNewWindow = () => {
    // Always allow opening a new window with the current application state
    window.open(window.location.href, '_blank');
  };

  const menuSections: MenuSection[] = [
    {
      id: 'file',
      label: t('menu.file.label'),
      icon: <File className="h-4 w-4" />,
      items: [
        {
          label: t('menu.file.open_file'),
          icon: <FileText className="h-4 w-4" />,
          shortcut: 'Ctrl+O',
          action: onOpenFile,
        },
        {
          label: t('menu.file.open_folder'),
          icon: <FolderOpen className="h-4 w-4" />,
          action: onOpenFolder,
        },
        { divider: true, label: '' },
        {
          label: t('menu.file.new_window'),
          icon: <FileText className="h-4 w-4" />,
          shortcut: 'Ctrl+N',
          action: handleNewWindow,
        },
        {
          label: t('menu.file.recent_files'),
          icon: <File className="h-4 w-4" />,
          action: () => setShowRecentFiles(true),
        },
        ...(
          isTauri()
            ? [
                {
                  label: t('menu.file.copy_path'),
                  icon: <Copy className="h-4 w-4" />,
                  action: handleCopyCurrentFilePath,
                },
                {
                  label: t('menu.file.rename'),
                  icon: <Edit3 className="h-4 w-4" />,
                  action: handleRenameCurrentFile,
                },
                {
                  label: t('menu.file.reveal_in_file_manager'),
                  icon: <FolderOpen className="h-4 w-4" />,
                  action: onRevealInFileManager,
                },
              ]
            : []
        ),
        {
          label: t('menu.file.save'),
          icon: <Save className="h-4 w-4" />,
          shortcut: 'Ctrl+S',
          action: onSave,
        },
        { divider: true, label: '' },
        {
          label: t('menu.file.print'),
          icon: <Printer className="h-4 w-4" />,
          shortcut: 'Ctrl+P',
          action: onPrint,
        },
        {
          label: t('menu.file.download'),
          icon: <Download className="h-4 w-4" />,
          shortcut: 'Ctrl+D',
          action: onDownload,
        },
        {
          label: t('menu.file.share'),
          icon: <Share2 className="h-4 w-4" />,
          action: onShare,
        },
        { divider: true, label: '' },
        {
          label: t('menu.file.properties'),
          icon: <List className="h-4 w-4" />,
          action: () => setShowProperties(true),
        },
      ],
    },
    {
      id: 'edit',
      label: t('menu.edit.label'),
      icon: <Edit3 className="h-4 w-4" />,
      items: [
        {
          label: t('menu.edit.undo'),
          icon: <Undo className="h-4 w-4" />,
          shortcut: 'Ctrl+Z',
          action: () => canUndo() && undoAnnotation(),
        },
        {
          label: t('menu.edit.redo'),
          icon: <Redo className="h-4 w-4" />,
          shortcut: 'Ctrl+Y',
          action: () => canRedo() && redoAnnotation(),
        },
        { divider: true, label: '' },
        {
          label: t('menu.edit.cut'),
          icon: <Scissors className="h-4 w-4" />,
          shortcut: 'Ctrl+X',
          action: handleCut,
        },
        {
          label: t('menu.edit.copy'),
          icon: <Copy className="h-4 w-4" />,
          shortcut: 'Ctrl+C',
          action: handleCopy,
        },
        {
          label: t('menu.edit.paste'),
          icon: <Clipboard className="h-4 w-4" />,
          shortcut: 'Ctrl+V',
          action: handlePaste,
        },
        { divider: true, label: '' },
        {
          label: t('menu.edit.find'),
          icon: <Search className="h-4 w-4" />,
          shortcut: 'Ctrl+F',
          action: onSearch,
        },
      ],
    },
    {
      id: 'view',
      label: t('menu.view.label'),
      icon: <View className="h-4 w-4" />,
      items: [
        {
          label: t('menu.view.zoom_in'),
          icon: <ZoomIn className="h-4 w-4" />,
          shortcut: 'Ctrl++',
          action: zoomIn,
        },
        {
          label: t('menu.view.zoom_out'),
          icon: <ZoomOut className="h-4 w-4" />,
          shortcut: 'Ctrl+-',
          action: zoomOut,
        },
        { divider: true, label: '' },
        {
          label: t('menu.view.rotate_cw'),
          icon: <RotateCw className="h-4 w-4" />,
          shortcut: 'R',
          action: rotateClockwise,
        },
        { divider: true, label: '' },
        {
          label: t('menu.view.single_page'),
          icon: <FileText className="h-4 w-4" />,
          action: () => setViewMode('single'),
        },
        {
          label: t('menu.view.continuous'),
          icon: <List className="h-4 w-4" />,
          action: () => setViewMode('continuous'),
        },
        {
          label: t('menu.view.two_page'),
          icon: <Grid3x3 className="h-4 w-4" />,
          action: () => setViewMode('twoPage'),
        },
        { divider: true, label: '' },
        {
          label: t('menu.view.thumbnails'),
          icon: <Maximize2 className="h-4 w-4" />,
          action: toggleThumbnails,
        },
        {
          label: t('menu.view.bookmarks'),
          icon: <Bookmark className="h-4 w-4" />,
          action: toggleOutline,
        },
        {
          label: t('menu.view.annotations'),
          icon: <MessageSquare className="h-4 w-4" />,
          action: toggleAnnotations,
        },
      ],
    },
    {
      id: 'settings',
      label: t('menu.settings.label'),
      icon: <Settings className="h-4 w-4" />,
      items: [
        {
          label: t('menu.settings.preferences'),
          icon: <Settings className="h-4 w-4" />,
          action: onOpenSettings,
        },
      ],
    },
  ];

  const handleMenuClick = (menuId: string) => {
    setExpandedMenu(expandedMenu === menuId ? null : menuId);
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          'transition-[max-height,opacity] duration-200 ease-out',
          showMenuBar
            ? 'max-h-16 opacity-100'
            : 'max-h-0 opacity-0 pointer-events-none'
        )}
      >
        <div className="flex items-center gap-1 border-b border-border bg-background px-2 py-1 text-sm animate-in slide-in-from-top duration-300">
        {menuSections.map((section) => {
          const isOpen = expandedMenu === section.id;

          return (
            <div key={section.id} className="relative">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'h-7 gap-1.5 px-2',
                      isOpen && 'bg-accent'
                    )}
                    onClick={() => handleMenuClick(section.id)}
                  >
                    {section.icon}
                    <span>{section.label}</span>
                    {isOpen ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <span>{section.label} Menu</span>
                </TooltipContent>
              </Tooltip>

              {/* Dropdown Menu */}
              {isOpen && (
                <>
                  {/* Backdrop to close menu on outside click */}
                  <div
                    className="fixed inset-0 z-[60]"
                    onClick={() => setExpandedMenu(null)}
                  />
                </>
              )}

              {/* Menu Items */}
              <div
                className={cn(
                  'absolute left-0 top-full z-[70] mt-1 min-w-[200px] rounded-md border border-border bg-popover p-1 shadow-lg origin-top transform transition-[opacity,transform] duration-180 ease-out will-change-transform opacity-0 -translate-y-1 pointer-events-none',
                  isOpen && 'opacity-100 translate-y-0 pointer-events-auto'
                )}
              >
                {section.items.map((item, index) => {
                  if (item.divider) {
                    return <Separator key={`divider-${index}`} className="my-1" />;
                  }
                  return (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-full justify-start gap-2 px-2 font-normal"
                      onClick={() => {
                        item.action?.();
                        setExpandedMenu(null);
                      }}
                    >
                      {item.icon && <span className="w-4">{item.icon}</span>}
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.shortcut && (
                        <span className="text-xs text-muted-foreground">
                          {item.shortcut}
                        </span>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>
          );
        })}
        
        <div className="ml-auto">
          <LanguageSwitcher />
        </div>
      </div>
      
      <PDFPropertiesDialog 
        open={showProperties} 
        onOpenChange={setShowProperties}
        onFileUpdate={onFileUpdate}
      />
      
      <PDFRecentFilesDialog
        open={showRecentFiles}
        onOpenChange={setShowRecentFiles}
        onOpenRecentFile={onOpenRecentFile}
      />
    </div>
    </TooltipProvider>
  );
}

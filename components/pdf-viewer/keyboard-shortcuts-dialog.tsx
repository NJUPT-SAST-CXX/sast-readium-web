"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { useTranslation } from "react-i18next";

interface ShortcutGroup {
  title: string;
  shortcuts: Array<{
    keys: string[];
    description: string;
  }>;
}

interface KeyboardShortcutsDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  const { t } = useTranslation();

  const shortcutGroups: ShortcutGroup[] = [
    {
      title: t("shortcuts.group.navigation"),
      shortcuts: [
        { keys: ["←"], description: t("shortcuts.action.prev_page") },
        { keys: ["→"], description: t("shortcuts.action.next_page") },
        { keys: ["Home"], description: t("shortcuts.action.first_page") },
        { keys: ["End"], description: t("shortcuts.action.last_page") },
      ],
    },
    {
      title: t("shortcuts.group.zoom"),
      shortcuts: [
        { keys: ["Ctrl", "+"], description: t("shortcuts.action.zoom_in") },
        { keys: ["Ctrl", "-"], description: t("shortcuts.action.zoom_out") },
        {
          keys: ["Ctrl", "Scroll"],
          description: t("shortcuts.action.zoom_wheel"),
        },
      ],
    },
    {
      title: t("shortcuts.group.view"),
      shortcuts: [
        { keys: ["R"], description: t("shortcuts.action.rotate_cw") },
        { keys: ["Shift", "R"], description: t("shortcuts.action.rotate_ccw") },
        { keys: ["F11"], description: t("shortcuts.action.toggle_fullscreen") },
      ],
    },
    {
      title: t("shortcuts.group.annotations"),
      shortcuts: [
        { keys: ["Ctrl", "Z"], description: t("shortcuts.action.undo") },
        { keys: ["Ctrl", "Y"], description: t("shortcuts.action.redo") },
        {
          keys: ["Ctrl", "Shift", "Z"],
          description: t("shortcuts.action.redo_alt"),
        },
      ],
    },
    {
      title: t("shortcuts.group.general"),
      shortcuts: [
        { keys: ["?"], description: t("shortcuts.action.show_help") },
        { keys: ["H"], description: t("shortcuts.action.show_help_alt") },
        { keys: ["Esc"], description: t("shortcuts.action.close_dialogs") },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("shortcuts.title")}</DialogTitle>
          <DialogDescription>{t("shortcuts.description")}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 pr-4">
            {shortcutGroups.map((group) => (
              <div key={group.title}>
                <h3 className="mb-3 text-sm font-semibold text-foreground">
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                    >
                      <span className="text-sm text-muted-foreground">
                        {shortcut.description}
                      </span>
                      <KbdGroup className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span
                            key={keyIndex}
                            className="flex items-center gap-1"
                          >
                            <Kbd>{key}</Kbd>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="text-xs text-muted-foreground">
                                +
                              </span>
                            )}
                          </span>
                        ))}
                      </KbdGroup>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

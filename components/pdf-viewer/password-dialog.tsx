import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PasswordDialogProps {
  open: boolean;
  fileName: string;
  onSubmit: (password: string) => void;
  onCancel: () => void;
  error?: boolean;
}

export function PasswordDialog({
  open,
  fileName,
  onSubmit,
  onCancel,
  error,
}: PasswordDialogProps) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (password) {
      onSubmit(password);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            {t("dialog.password.title") || "Password Protected"}
          </DialogTitle>
          <DialogDescription>
            {t("dialog.password.description", { fileName }) ||
              `The file "${fileName}" is encrypted. Please enter the password to open it.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder={t("dialog.password.placeholder") || "Enter password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className={error ? "border-destructive" : ""}
            />
            {error && (
              <p className="text-sm text-destructive">
                {t("dialog.password.incorrect") ||
                  "Incorrect password. Please try again."}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              {t("dialog.cancel")}
            </Button>
            <Button type="submit" disabled={!password}>
              {t("dialog.password.submit") || "Open"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { usePDFStore } from '@/lib/pdf-store';
import { useTranslation } from 'react-i18next';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Navigation2 } from 'lucide-react';

export function PDFGoToPage() {
  const { t } = useTranslation();
  const { currentPage, numPages, goToPage } = usePDFStore();
  const [pageInput, setPageInput] = useState('');
  const [open, setOpen] = useState(false);

  // Sync local input with current page when popover opens
  useEffect(() => {
    if (open) {
      const timeoutId = setTimeout(() => {
        setPageInput(currentPage.toString());
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [open, currentPage]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const page = parseInt(pageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= numPages) {
      goToPage(page);
      setOpen(false);
    } else {
      // Invalid input, reset to current page
      setPageInput(currentPage.toString());
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon">
              <Navigation2 className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>{t('toolbar.tooltip.go_to_page')}</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-60 p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="page-input">
              {t('toolbar.go_to.label')} ({t('viewer.page_n_of_m', { current: currentPage, total: numPages })})
            </Label>
            <Input
              id="page-input"
              type="number"
              min={1}
              max={numPages}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              placeholder={t('toolbar.go_to.placeholder', { total: numPages })}
              className="w-full"
              autoFocus
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" size="sm">
              {t('toolbar.go_to.go')}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

'use client';

import { usePDFStore } from '@/lib/pdf-store';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { FileText, Calendar, Database } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PDFPropertiesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PDFPropertiesDialog({ open, onOpenChange }: PDFPropertiesDialogProps) {
  const { t } = useTranslation();
  const { metadata, numPages } = usePDFStore();

  if (!metadata) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return t('properties.unknown');
    try {
      // Handle PDF date format: D:YYYYMMDDHHmmSS...
      if (dateStr.startsWith('D:')) {
        const year = dateStr.substring(2, 6);
        const month = dateStr.substring(6, 8);
        const day = dateStr.substring(8, 10);
        const hour = dateStr.substring(10, 12);
        const minute = dateStr.substring(12, 14);
        return new Date(`${year}-${month}-${day}T${hour}:${minute}:00`).toLocaleString();
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return t('properties.unknown');
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const info = metadata.info || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('properties.title')}
          </DialogTitle>
          <DialogDescription>
            {t('properties.filename')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Basic Info */}
            <section className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                {t('properties.title')}
              </h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-muted-foreground">{t('properties.filename')}</div>
                <div className="col-span-2 font-medium truncate" title={info.Title || '-'}>
                  {info.Title || '-'}
                </div>
                
                <div className="text-muted-foreground">{t('properties.author')}</div>
                <div className="col-span-2 font-medium truncate" title={info.Author || '-'}>
                  {info.Author || '-'}
                </div>

                <div className="text-muted-foreground">{t('properties.subject')}</div>
                <div className="col-span-2 font-medium truncate" title={info.Subject || '-'}>
                  {info.Subject || '-'}
                </div>

                <div className="text-muted-foreground">{t('properties.keywords')}</div>
                <div className="col-span-2 font-medium truncate" title={info.Keywords || '-'}>
                  {info.Keywords || '-'}
                </div>
              </div>
            </section>

            {/* Technical Info */}
            <section className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Database className="h-4 w-4" />
                {t('properties.creator')}
              </h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-muted-foreground">{t('properties.filesize')}</div>
                <div className="col-span-2 font-medium">
                  {formatFileSize(metadata.contentLength)}
                </div>

                <div className="text-muted-foreground">{t('properties.page_count')}</div>
                <div className="col-span-2 font-medium">
                  {t('properties.n_pages', { count: numPages })}
                </div>

                <div className="text-muted-foreground">{t('properties.pdf_version')}</div>
                <div className="col-span-2 font-medium">
                  {info.PDFFormatVersion || '-'}
                </div>

                <div className="text-muted-foreground">{t('properties.creator')}</div>
                <div className="col-span-2 font-medium truncate" title={info.Creator || '-'}>
                  {info.Creator || '-'}
                </div>

                <div className="text-muted-foreground">{t('properties.producer')}</div>
                <div className="col-span-2 font-medium truncate" title={info.Producer || '-'}>
                  {info.Producer || '-'}
                </div>
              </div>
            </section>

            {/* Dates */}
            <section className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {t('properties.creation_date')}
              </h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-muted-foreground">{t('properties.creation_date')}</div>
                <div className="col-span-2 font-medium">
                  {formatDate(info.CreationDate)}
                </div>

                <div className="text-muted-foreground">{t('properties.mod_date')}</div>
                <div className="col-span-2 font-medium">
                  {formatDate(info.ModDate)}
                </div>
              </div>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

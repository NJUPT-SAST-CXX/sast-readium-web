'use client';

import { useState, useEffect, useCallback } from 'react';
import { WelcomePage } from '@/components/welcome-page/welcome-page';
import { PDFViewer } from '@/components/pdf-viewer/pdf-viewer';
import { usePDFStore } from '@/lib/pdf-store';
import { cn } from '@/lib/utils';

interface OpenDocument {
  id: string;
  file: File;
  title: string;
}

export default function Home() {
  const [openDocuments, setOpenDocuments] = useState<OpenDocument[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { resetPDF, isDarkMode, openDocumentSession } = usePDFStore();

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Compute a stable-ish document id from file metadata
  const getDocumentId = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    if (file.type !== "application/pdf") {
      alert("Please select a valid PDF file");
      return;
    }

    const id = getDocumentId(file);

    setOpenDocuments((prev) => {
      const exists = prev.find((doc) => doc.id === id);
      if (exists) {
        return prev;
      }
      return [...prev, { id, file, title: file.name }];
    });

    setActiveDocumentId(id);
    openDocumentSession(id);
  }, [openDocumentSession]);

  const handleSwitchDocument = (id: string) => {
    setActiveDocumentId(id);
    openDocumentSession(id);
  };

  // Handle closing PDF viewer / active document
  const handleClose = () => {
    if (!activeDocumentId) return;

    setOpenDocuments((prev) => {
      const remaining = prev.filter((doc) => doc.id !== activeDocumentId);

      if (remaining.length === 0) {
        setActiveDocumentId(null);
        resetPDF();
      } else {
        const next = remaining[0];
        setActiveDocumentId(next.id);
        openDocumentSession(next.id);
      }

      return remaining;
    });
  };

  // Handle drag and drop
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type === 'application/pdf') {
          handleFileSelect(file);
        } else {
          alert('Please drop a valid PDF file');
        }
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [handleFileSelect]);

  return (
    <>
      {/* Drag and Drop Overlay */}
      {isDragging && openDocuments.length === 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="rounded-lg border-4 border-dashed border-primary bg-background p-12 text-center">
            <div className="text-6xl">📄</div>
            <p className="mt-4 text-2xl font-semibold">Drop PDF file here</p>
            <p className="mt-2 text-muted-foreground">Release to open the document</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {openDocuments.length > 0 ? (
        (() => {
          const activeDoc =
            openDocuments.find((doc) => doc.id === activeDocumentId) ??
            openDocuments[0];

          const header = (
            <div className="flex items-center gap-2 overflow-x-auto border-b border-border bg-background px-4 py-2">
              {openDocuments.map((doc) => {
                const isActive = doc.id === activeDoc.id;
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => handleSwitchDocument(doc.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm border",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80",
                    )}
                  >
                    <span className="max-w-[160px] truncate">{doc.title}</span>
                  </button>
                );
              })}
            </div>
          );

          return <PDFViewer file={activeDoc.file} onClose={handleClose} header={header} />;
        })()
      ) : (
        <WelcomePage onFileSelect={handleFileSelect} />
      )}
    </>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { WelcomePage } from "@/components/welcome-page/welcome-page";
import { PDFViewer } from "@/components/pdf-viewer/pdf-viewer";
import { PDFTabBar } from "@/components/pdf-viewer/pdf-tab-bar";
import { usePDFStore } from "@/lib/pdf-store";
import { unloadPDFDocument } from "@/lib/pdf-utils";

interface OpenDocument {
  id: string;
  file: File;
  title: string;
}

export default function Home() {
  const { t } = useTranslation();
  const [openDocuments, setOpenDocuments] = useState<OpenDocument[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { resetPDF, isDarkMode, openDocumentSession, closeDocumentSession } = usePDFStore();

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
  const handleFileSelect = useCallback((input: File | File[]) => {
    const files = Array.isArray(input) ? input : [input];
    const validFiles = files.filter(file => file.type === "application/pdf");

    if (validFiles.length === 0) {
      alert(t('home.invalid_pdf'));
      return;
    }

    let lastId: string | null = null;

    setOpenDocuments((prev) => {
      const newDocs = [...prev];
      validFiles.forEach(file => {
        const id = getDocumentId(file);
        lastId = id;
        if (!newDocs.find((doc) => doc.id === id)) {
          newDocs.push({ id, file, title: file.name });
        }
      });
      return newDocs;
    });

    // Switch to the last opened document (existing or new) after state update
    if (lastId) {
      setActiveDocumentId(lastId);
      openDocumentSession(lastId);
    }
  }, [openDocumentSession, t]);

  const handleSwitchDocument = useCallback((id: string) => {
    setActiveDocumentId(id);
    openDocumentSession(id);
  }, [openDocumentSession]);

  // Handle closing PDF viewer / active document
  const handleClose = useCallback((id?: string) => {
    const targetId = id || activeDocumentId;
    if (!targetId) return;

    // Unload the PDF document to clean up cache and resources
    const doc = openDocuments.find((d) => d.id === targetId);
    if (doc) {
      unloadPDFDocument(doc.file);
    }

    // Close the document session to clean up state
    closeDocumentSession(targetId);

    setOpenDocuments((prev) => {
      const remaining = prev.filter((doc) => doc.id !== targetId);

      // If we closed the ACTIVE document, switch to another
      if (activeDocumentId === targetId) {
        if (remaining.length === 0) {
          setActiveDocumentId(null);
          // Schedule resetPDF to run after state update completes
          setTimeout(() => resetPDF(), 0);
        } else {
          // Try to stay near the closed tab, or go to the last used?
          // Simple behavior: go to the first available or previous
          // For now, mimicking previous behavior: go to remaining[0]
          const next = remaining[0];
          setActiveDocumentId(next.id);
          openDocumentSession(next.id);
        }
      }

      return remaining;
    });
  }, [activeDocumentId, closeDocumentSession, openDocumentSession, resetPDF, openDocuments]);

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
        const pdfFiles: File[] = [];
        for (let i = 0; i < files.length; i++) {
          if (files[i].type === 'application/pdf') {
            pdfFiles.push(files[i]);
          }
        }
        
        if (pdfFiles.length > 0) {
          handleFileSelect(pdfFiles);
        } else {
          alert(t('home.drop_invalid'));
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
  }, [handleFileSelect, t]);

  return (
    <>
      {/* Drag and Drop Overlay */}
      {isDragging && openDocuments.length === 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="rounded-lg border-4 border-dashed border-primary bg-background p-12 text-center">
            <div className="text-6xl">📄</div>
            <p className="mt-4 text-2xl font-semibold">{t('home.drag_title')}</p>
            <p className="mt-2 text-muted-foreground">{t('home.drag_subtitle')}</p>
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
            <PDFTabBar
              documents={openDocuments}
              activeDocumentId={activeDocumentId}
              onSwitch={handleSwitchDocument}
              onClose={handleClose}
            />
          );

          return (
            <PDFViewer
              key={activeDoc.id}
              file={activeDoc.file}
              onClose={handleClose}
              header={header}
              onOpenFileFromMenu={handleFileSelect}
            />
          );
        })()
      ) : (
        <WelcomePage onFileSelect={handleFileSelect} />
      )}
    </>
  );
}

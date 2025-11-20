'use client';

import { useState, useEffect } from 'react';
import { WelcomePage } from '@/components/welcome-page/welcome-page';
import { PDFViewer } from '@/components/pdf-viewer/pdf-viewer';
import { usePDFStore } from '@/lib/pdf-store';

export default function Home() {
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { resetPDF, isDarkMode } = usePDFStore();

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Handle file selection
  const handleFileSelect = (file: File) => {
    if (file.type === 'application/pdf') {
      setCurrentFile(file);
    } else {
      alert('Please select a valid PDF file');
    }
  };

  // Handle closing PDF viewer
  const handleClose = () => {
    setCurrentFile(null);
    resetPDF();
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
  }, []);

  return (
    <>
      {/* Drag and Drop Overlay */}
      {isDragging && !currentFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="rounded-lg border-4 border-dashed border-primary bg-background p-12 text-center">
            <div className="text-6xl">📄</div>
            <p className="mt-4 text-2xl font-semibold">Drop PDF file here</p>
            <p className="mt-2 text-muted-foreground">Release to open the document</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {currentFile ? (
        <PDFViewer file={currentFile} onClose={handleClose} />
      ) : (
        <WelcomePage onFileSelect={handleFileSelect} />
      )}
    </>
  );
}

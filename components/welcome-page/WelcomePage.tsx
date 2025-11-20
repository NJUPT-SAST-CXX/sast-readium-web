'use client';

import { FileText, Upload, Clock, Keyboard, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePDFStore } from '@/lib/pdf-store';
import { useRef } from 'react';

interface WelcomePageProps {
  onFileSelect: (file: File) => void;
}

export function WelcomePage({ onFileSelect }: WelcomePageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { recentFiles } = usePDFStore();

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onFileSelect(file);
    }
  };

  const handleOpenClick = () => {
    fileInputRef.current?.click();
  };

  const handleRecentFileClick = (url: string) => {
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], 'document.pdf', { type: 'application/pdf' });
        onFileSelect(file);
      })
      .catch((err) => console.error('Error loading recent file:', err));
  };

  const keyboardShortcuts = [
    { keys: ['←', '→'], description: 'Navigate between pages' },
    { keys: ['Ctrl', '+'], description: 'Zoom in' },
    { keys: ['Ctrl', '-'], description: 'Zoom out' },
    { keys: ['Ctrl', 'F'], description: 'Search in document' },
    { keys: ['F11'], description: 'Toggle fullscreen' },
    { keys: ['R'], description: 'Rotate page clockwise' },
    { keys: ['Shift', 'R'], description: 'Rotate page counter-clockwise' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold">PDF Reader</h1>
            <p className="text-sm text-muted-foreground">
              A modern, feature-rich PDF viewer
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Start Section */}
            <section>
              <h2 className="mb-4 text-lg font-semibold">Start</h2>
              <div className="space-y-3">
                <Button
                  onClick={handleOpenClick}
                  className="w-full justify-start gap-3 h-12"
                  variant="outline"
                >
                  <Upload className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Open PDF File</div>
                    <div className="text-xs text-muted-foreground">
                      Browse and select a PDF document
                    </div>
                  </div>
                </Button>
              </div>
            </section>

            {/* Recent Section */}
            <section>
              <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent
              </h2>
              {recentFiles.length > 0 ? (
                <div className="space-y-2">
                  {recentFiles.slice(0, 5).map((file, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentFileClick(file.url)}
                      className="w-full rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{file.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {file.numPages ? `${file.numPages} pages` : 'PDF Document'} •{' '}
                            {new Date(file.lastOpened).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-8 text-center">
                  <Clock className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    No recent files yet. Open a PDF to get started.
                  </p>
                </div>
              )}
            </section>

            {/* Keyboard Shortcuts Section */}
            <section>
              <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                Keyboard Shortcuts
              </h2>
              <div className="space-y-2 rounded-lg border border-border bg-card p-4">
                {keyboardShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <span className="text-sm text-muted-foreground">
                      {shortcut.description}
                    </span>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <kbd
                          key={keyIndex}
                          className="rounded bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Help Section */}
            <section>
              <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                <Info className="h-5 w-5" />
                Features
              </h2>
              <div className="space-y-3 rounded-lg border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Advanced Navigation</h3>
                    <p className="text-sm text-muted-foreground">
                      Page thumbnails, bookmarks, and quick jump controls
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Upload className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Flexible Zoom & Rotation</h3>
                    <p className="text-sm text-muted-foreground">
                      Zoom from 25% to 500%, rotate pages in any direction
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Keyboard className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Full-Text Search</h3>
                    <p className="text-sm text-muted-foreground">
                      Search across all pages with result highlighting
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Info className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Dark Mode Support</h3>
                    <p className="text-sm text-muted-foreground">
                      Comfortable reading in any lighting condition
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>Built with Next.js 16 & React 19</p>
          <p>Drag & drop PDF files anywhere to open</p>
        </div>
      </footer>
    </div>
  );
}


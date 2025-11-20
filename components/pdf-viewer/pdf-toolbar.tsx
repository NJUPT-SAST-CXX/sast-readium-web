'use client';

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Maximize,
  Minimize,
  Download,
  Printer,
  Search,
  X,
  Menu,
  Moon,
  Sun,
  Maximize2,
  BookOpen,
  Columns2,
  FileText,
  Rows3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { usePDFStore } from '@/lib/pdf-store';
import { useState, useEffect } from 'react';

interface PDFToolbarProps {
  onDownload: () => void;
  onPrint: () => void;
  onSearch: (query: string) => void;
  onClose: () => void;
}

export function PDFToolbar({ onDownload, onPrint, onSearch, onClose }: PDFToolbarProps) {
  const {
    currentPage,
    numPages,
    zoom,
    isFullscreen,
    showThumbnails,
    showOutline,
    isDarkMode,
    searchQuery,
    searchResults,
    currentSearchIndex,
    viewMode,
    fitMode,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    goToPage,
    zoomIn,
    zoomOut,
    setZoom,
    setViewMode,
    setFitMode,
    rotateClockwise,
    rotateCounterClockwise,
    toggleFullscreen,
    toggleThumbnails,
    toggleOutline,
    toggleDarkMode,
    setSearchQuery,
    nextSearchResult,
    previousSearchResult,
  } = usePDFStore();

  const [pageInput, setPageInput] = useState(currentPage.toString());
  const [showSearch, setShowSearch] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // Sync page input with current page
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(pageInput, 10);
    if (!isNaN(page)) {
      goToPage(page);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(localSearchQuery);
    onSearch(localSearchQuery);
  };

  // Zoom levels from 50% to 300% as requested
  const zoomLevels = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0];

  return (
    <TooltipProvider>
      <div className="flex flex-col border-b border-border bg-background">
        {/* Main Toolbar */}
        <div className="flex items-center justify-between gap-2 px-4 py-2">
          {/* Left Section */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleThumbnails}
                  className={showThumbnails ? 'bg-accent' : ''}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Thumbnails</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleOutline}
                  className={showOutline ? 'bg-accent' : ''}
                >
                  <BookOpen className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Bookmarks</TooltipContent>
            </Tooltip>
          </div>

          {/* Center Section - Navigation */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={firstPage}
                  disabled={currentPage <= 1}
                >
                  <ChevronsLeft className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>First Page (Home)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={previousPage}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Previous Page (←)</TooltipContent>
            </Tooltip>

            <form onSubmit={handlePageInputSubmit} className="flex items-center gap-2">
              <Input
                type="text"
                value={pageInput}
                onChange={handlePageInputChange}
                onBlur={() => setPageInput(currentPage.toString())}
                className="w-16 text-center"
              />
              <span className="text-sm text-muted-foreground">/ {numPages}</span>
            </form>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={nextPage}
                  disabled={currentPage >= numPages}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Next Page (→)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={lastPage}
                  disabled={currentPage >= numPages}
                >
                  <ChevronsRight className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Last Page (End)</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6" />

            {/* Zoom Controls */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={zoomOut}>
                  <ZoomOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <div>Zoom Out</div>
                  <div className="text-muted-foreground">Ctrl/Cmd + -</div>
                </div>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <select
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm cursor-pointer hover:bg-accent"
                >
                  {zoomLevels.map((level) => (
                    <option key={level} value={level}>
                      {Math.round(level * 100)}%
                    </option>
                  ))}
                </select>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <div>Zoom Level (50% - 300%)</div>
                  <div className="text-muted-foreground">Ctrl/Cmd + Scroll to zoom</div>
                </div>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={zoomIn}>
                  <ZoomIn className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <div>Zoom In</div>
                  <div className="text-muted-foreground">Ctrl/Cmd + +</div>
                </div>
              </TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6" />

            {/* Rotation Controls */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={rotateCounterClockwise}>
                  <RotateCcw className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rotate Counter-Clockwise</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={rotateClockwise}>
                  <RotateCw className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rotate Clockwise</TooltipContent>
            </Tooltip>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSearch(!showSearch)}
                  className={showSearch ? 'bg-accent' : ''}
                >
                  <Search className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Search</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onPrint}>
                  <Printer className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Print</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onDownload}>
                  <Download className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
                  {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Dark Mode</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
                  {isFullscreen ? (
                    <Minimize className="h-5 w-5" />
                  ) : (
                    <Maximize className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Fullscreen</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="flex items-center gap-2 border-t border-border px-4 py-2">
            <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-2">
              <Input
                type="text"
                placeholder="Search in document..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="sm">
                Search
              </Button>
            </form>
            {searchResults.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {currentSearchIndex + 1} / {searchResults.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={previousSearchResult}
                  disabled={searchResults.length === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={nextSearchResult}
                  disabled={searchResults.length === 0}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={() => setShowSearch(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}


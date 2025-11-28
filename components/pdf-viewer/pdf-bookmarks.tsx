"use client";

import { Star, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePDFStore } from "@/lib/pdf-store";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface PDFBookmarksProps {
  onNavigate: (pageNumber: number) => void;
  currentPage: number;
}

export function PDFBookmarks({ onNavigate, currentPage }: PDFBookmarksProps) {
  const { bookmarks, addBookmark, removeBookmark } = usePDFStore();
  const [isAdding, setIsAdding] = useState(false);
  const [bookmarkTitle, setBookmarkTitle] = useState("");

  const handleAddBookmark = () => {
    if (bookmarkTitle.trim()) {
      addBookmark(currentPage, bookmarkTitle.trim());
      setBookmarkTitle("");
      setIsAdding(false);
    }
  };

  const sortedBookmarks = [...bookmarks].sort(
    (a, b) => a.pageNumber - b.pageNumber
  );

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">My Bookmarks</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsAdding(!isAdding)}
            className="h-8 w-8"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {isAdding && (
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Bookmark name..."
              value={bookmarkTitle}
              onChange={(e) => setBookmarkTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddBookmark();
                } else if (e.key === "Escape") {
                  setIsAdding(false);
                  setBookmarkTitle("");
                }
              }}
              className="h-8 text-sm"
              autoFocus
            />
            <Button size="sm" onClick={handleAddBookmark} className="h-8">
              Add
            </Button>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {sortedBookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <Star className="mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">No bookmarks yet</p>
              <p className="mt-1 text-xs">
                Click <Plus className="inline h-3 w-3" /> to add one
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {sortedBookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className={cn(
                    "group flex items-center gap-2 rounded-md p-2 transition-colors hover:bg-accent",
                    bookmark.pageNumber === currentPage && "bg-accent/50"
                  )}
                >
                  <button
                    onClick={() => onNavigate(bookmark.pageNumber)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 shrink-0 fill-primary text-primary" />
                      <div className="flex-1 truncate">
                        <p className="text-sm font-medium">{bookmark.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Page {bookmark.pageNumber}
                        </p>
                      </div>
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeBookmark(bookmark.id)}
                    className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

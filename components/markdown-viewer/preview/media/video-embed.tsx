"use client";

import { useState, useMemo } from "react";
import { Play, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VideoEmbedProps {
  src: string;
  title?: string;
  className?: string;
}

// Parse video URL to get embed URL
function getEmbedUrl(src: string): { type: string; embedUrl: string } | null {
  // YouTube
  const youtubeMatch = src.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (youtubeMatch) {
    return {
      type: "youtube",
      embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
    };
  }

  // Bilibili
  const bilibiliMatch = src.match(/bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/);
  if (bilibiliMatch) {
    return {
      type: "bilibili",
      embedUrl: `https://player.bilibili.com/player.html?bvid=${bilibiliMatch[1]}&high_quality=1`,
    };
  }

  // Bilibili with aid
  const bilibiliAidMatch = src.match(/bilibili\.com\/video\/av(\d+)/);
  if (bilibiliAidMatch) {
    return {
      type: "bilibili",
      embedUrl: `https://player.bilibili.com/player.html?aid=${bilibiliAidMatch[1]}&high_quality=1`,
    };
  }

  // Vimeo
  const vimeoMatch = src.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return {
      type: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
    };
  }

  // Direct video file
  if (/\.(mp4|webm|ogg|mov)$/i.test(src)) {
    return {
      type: "direct",
      embedUrl: src,
    };
  }

  return null;
}

export function VideoEmbed({ src, title, className }: VideoEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const embedInfo = useMemo(() => getEmbedUrl(src), [src]);

  if (!embedInfo) {
    return (
      <div
        className={cn(
          "my-4 p-4 rounded-lg border border-dashed border-muted-foreground/50 text-center text-muted-foreground",
          className
        )}
      >
        <p>无法识别的视频链接</p>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline inline-flex items-center gap-1 mt-2"
        >
          打开原链接 <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    );
  }

  // Direct video
  if (embedInfo.type === "direct") {
    return (
      <div className={cn("my-4 rounded-lg overflow-hidden", className)}>
        {title && (
          <div className="px-3 py-2 bg-muted text-sm font-medium">{title}</div>
        )}
        <video
          src={src}
          controls
          className="w-full max-h-[500px] bg-black"
          preload="metadata"
        >
          您的浏览器不支持视频播放
        </video>
      </div>
    );
  }

  // Embed video (YouTube, Bilibili, Vimeo)
  return (
    <div className={cn("my-4 rounded-lg overflow-hidden border", className)}>
      {title && (
        <div className="px-3 py-2 bg-muted text-sm font-medium border-b">
          {title}
        </div>
      )}
      <div className="relative aspect-video bg-black">
        {showPreview && !isLoaded ? (
          <button
            type="button"
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/80 hover:bg-muted/60 transition-colors"
            onClick={() => {
              setShowPreview(false);
              setIsLoaded(true);
            }}
          >
            <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center">
              <Play className="h-8 w-8 text-primary-foreground ml-1" />
            </div>
            <span className="text-sm text-muted-foreground">点击播放</span>
          </button>
        ) : (
          <iframe
            src={embedInfo.embedUrl}
            title={title || "Video"}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => setIsLoaded(true)}
          />
        )}
      </div>
      <div className="px-3 py-2 bg-muted/50 text-xs text-muted-foreground flex items-center justify-between">
        <span className="capitalize">{embedInfo.type}</span>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground inline-flex items-center gap-1"
        >
          打开原链接 <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

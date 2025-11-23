"use client";

import { useEffect, useState } from "react";
import {
  getAppRuntimeInfo,
  getSystemInfo,
  type AppRuntimeInfo,
  type SystemInfo,
} from "@/lib/tauri-bridge";

export function AboutRuntimeInfo() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [runtimeInfo, setRuntimeInfo] = useState<AppRuntimeInfo | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [sys, app] = await Promise.all([
        getSystemInfo(),
        getAppRuntimeInfo(),
      ]);
      if (cancelled) return;
      if (sys) setSystemInfo(sys);
      if (app) setRuntimeInfo(app);
      setLoaded(true);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded) {
    return null;
  }

  if (!systemInfo && !runtimeInfo) {
    return (
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">运行环境</h2>
        <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          当前在浏览器环境运行，未使用 Tauri
          桌面运行时，因此不提供本地系统级信息。
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">运行环境（Tauri 桌面）</h2>
      <div className="rounded-lg border bg-card p-4 text-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          {runtimeInfo && (
            <div className="space-y-1">
              <div>
                <span className="text-muted-foreground">Rust 包名：</span>
                <span className="font-mono break-all">{runtimeInfo.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">应用版本：</span>
                <span className="font-mono">{runtimeInfo.version}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Tauri 版本：</span>
                <span className="font-mono">{runtimeInfo.tauri_version}</span>
              </div>
              <div>
                <span className="text-muted-foreground">构建模式：</span>
                <span className="font-mono">
                  {runtimeInfo.debug ? "debug" : "release"}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-1">
            {systemInfo && (
              <>
                <div>
                  <span className="text-muted-foreground">操作系统：</span>
                  <span className="font-mono">{systemInfo.os}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">架构：</span>
                  <span className="font-mono">{systemInfo.arch}</span>
                </div>
              </>
            )}
            {runtimeInfo?.exe_path && (
              <div>
                <span className="text-muted-foreground">可执行文件：</span>
                <span className="font-mono break-all">
                  {runtimeInfo.exe_path}
                </span>
              </div>
            )}
            {runtimeInfo?.current_dir && (
              <div>
                <span className="text-muted-foreground">当前工作目录：</span>
                <span className="font-mono break-all">
                  {runtimeInfo.current_dir}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

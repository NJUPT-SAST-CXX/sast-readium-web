"use client";

import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import {
  getAppRuntimeInfo,
  getSystemInfo,
  type AppRuntimeInfo,
  type SystemInfo,
} from "@/lib/tauri-bridge";

export function AboutRuntimeInfo() {
  const { t } = useTranslation();
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
        <h2 className="text-xl font-semibold">{t("about.runtime.title")}</h2>
        <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          {t("about.runtime.browser")}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{t("about.runtime.desktop")}</h2>
      <div className="rounded-lg border bg-card p-4 text-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          {runtimeInfo && (
            <div className="space-y-1">
              <div>
                <span className="text-muted-foreground">
                  {t("about.runtime.rust_package")}：
                </span>
                <span className="font-mono break-all">{runtimeInfo.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {t("about.runtime.app_version")}：
                </span>
                <span className="font-mono">{runtimeInfo.version}</span>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {t("about.runtime.tauri_version")}：
                </span>
                <span className="font-mono">{runtimeInfo.tauri_version}</span>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {t("about.runtime.build_mode")}：
                </span>
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
                  <span className="text-muted-foreground">
                    {t("about.runtime.os")}：
                  </span>
                  <span className="font-mono">{systemInfo.os}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {t("about.runtime.arch")}：
                  </span>
                  <span className="font-mono">{systemInfo.arch}</span>
                </div>
              </>
            )}
            {runtimeInfo?.exe_path && (
              <div>
                <span className="text-muted-foreground">
                  {t("about.runtime.executable")}：
                </span>
                <span className="font-mono break-all">
                  {runtimeInfo.exe_path}
                </span>
              </div>
            )}
            {runtimeInfo?.current_dir && (
              <div>
                <span className="text-muted-foreground">
                  {t("about.runtime.cwd")}：
                </span>
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

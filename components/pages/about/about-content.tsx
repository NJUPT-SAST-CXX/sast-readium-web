"use client";

import { useTranslation } from "react-i18next";
import { useState } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AboutRuntimeInfo } from "./about-runtime-info";
import { Github, Bug, Loader2, RefreshCw } from "lucide-react";
import { checkForAppUpdates } from "@/lib/platform";
import pkg from "../../../package.json";

export function AboutContent() {
  const { t } = useTranslation();
  const [isChecking, setIsChecking] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const dependencies = Object.entries(pkg.dependencies ?? {});
  // const devDependencies = Object.entries(pkg.devDependencies ?? {});

  const currentYear = new Date().getFullYear();

  const handleCheckUpdate = async () => {
    setIsChecking(true);
    setUpdateStatus(t("about.update.checking"));
    try {
      const status = await checkForAppUpdates();
      if (status.available) {
        setUpdateStatus(
          t("about.update.available", { version: status.version })
        );
      } else if (status.error) {
        setUpdateStatus(t("about.update.error", { error: status.error }));
      } else {
        setUpdateStatus(t("about.update.latest"));
      }
    } catch (error) {
      setUpdateStatus(t("about.update.error", { error: String(error) }));
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl p-6 space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative w-24 h-24">
          <Image
            src="/app-icon.png"
            alt="Logo"
            fill
            className="object-contain drop-shadow-xl"
          />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("about.title")}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            {t("about.description")}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t("about.project_info")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  {t("about.version")}
                </span>
                <Badge variant="secondary">v{pkg.version}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  {t("about.license")}
                </span>
                <span>MIT</span>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleCheckUpdate}
                  disabled={isChecking}
                >
                  {isChecking ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-3 w-3" />
                  )}
                  {t("about.check_update")}
                </Button>
                {updateStatus && (
                  <p className="text-xs text-center text-muted-foreground animate-in fade-in slide-in-from-top-1">
                    {updateStatus}
                  </p>
                )}
              </div>

              <Separator />
              <div>
                <h4 className="font-medium mb-2">{t("about.team")}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("about.team_desc")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Links */}
          <Card>
            <CardHeader>
              <CardTitle>{t("about.links")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                asChild
              >
                <a
                  href="https://github.com/NJUPT-SAST-CXX/sast-readium-web"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Github className="h-4 w-4" /> {t("about.github")}
                </a>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                asChild
              >
                <a
                  href="https://github.com/NJUPT-SAST-CXX/sast-readium-web/issues"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Bug className="h-4 w-4" /> {t("about.issues")}
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <AboutRuntimeInfo />

          <Card>
            <CardHeader>
              <CardTitle>{t("about.dependencies")}</CardTitle>
              <CardDescription>Core libraries and frameworks.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                <div className="flex flex-wrap gap-2">
                  {dependencies.map(([name, version]) => (
                    <div
                      key={name}
                      className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs"
                    >
                      <span className="font-medium">{name}</span>
                      <span className="text-muted-foreground text-[10px]">
                        {String(version)}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      <footer className="text-center text-sm text-muted-foreground pt-8 pb-4">
        <p>{t("about.copyright", { year: currentYear })}</p>
      </footer>
    </div>
  );
}

import type { Metadata } from "next";
import pkg from "../../package.json";
import { AboutRuntimeInfo } from "@/components/about/about-runtime-info";

export const metadata: Metadata = {
  title: "About - SAST Readium",
  description: "Project information and dependencies for SAST Readium",
};

const dependencies = Object.entries(pkg.dependencies ?? {});
const devDependencies = Object.entries(pkg.devDependencies ?? {});

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-10">
        <header className="space-y-2 border-b pb-4">
          <h1 className="text-3xl font-semibold tracking-tight">关于 SAST Readium</h1>
          <p className="text-sm text-muted-foreground">
            查看项目基本信息、脚本命令以及依赖列表。
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">项目信息</h2>
          <div className="rounded-lg border bg-card p-4 text-sm">
            <div className="flex flex-col gap-1">
              <div>
                <span className="text-muted-foreground">名称：</span>
                <span className="font-mono">{pkg.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">版本：</span>
                <span className="font-mono">{pkg.version}</span>
              </div>
              <div>
                <span className="text-muted-foreground">私有：</span>
                <span className="font-mono">{pkg.private ? "true" : "false"}</span>
              </div>
            </div>
          </div>
        </section>

        <AboutRuntimeInfo />

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">脚本命令</h2>
          <div className="rounded-lg border bg-card p-4 text-sm">
            <ul className="space-y-1 font-mono">
              {Object.entries(pkg.scripts ?? {}).map(([key, value]) => (
                <li key={key} className="flex flex-wrap gap-2">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold">
                    {key}
                  </span>
                  <span className="text-muted-foreground">{String(value)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">依赖（dependencies）</h2>
          <div className="rounded-lg border bg-card p-4 text-sm">
            {dependencies.length === 0 ? (
              <p className="text-muted-foreground">暂无 dependencies。</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {dependencies.map(([name, version]) => (
                  <div key={name} className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs sm:text-sm">{name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{String(version)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">开发依赖（devDependencies）</h2>
          <div className="rounded-lg border bg-card p-4 text-sm">
            {devDependencies.length === 0 ? (
              <p className="text-muted-foreground">暂无 devDependencies。</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {devDependencies.map(([name, version]) => (
                  <div key={name} className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs sm:text-sm">{name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{String(version)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

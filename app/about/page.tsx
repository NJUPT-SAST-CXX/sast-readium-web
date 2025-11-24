import type { Metadata } from "next";
import { AboutContent } from "@/components/about/about-content";

export const metadata: Metadata = {
  title: "About - SAST Readium",
  description: "Project information and dependencies for SAST Readium",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <AboutContent />
    </main>
  );
}

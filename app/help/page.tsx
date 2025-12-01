import type { Metadata } from "next";
import { HelpContent } from "@/components/help/help-content";

export const metadata: Metadata = {
  title: "Help - SAST Readium",
  description: "Documentation and help resources for SAST Readium",
};

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <HelpContent />
    </main>
  );
}

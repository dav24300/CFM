"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";

type Props = {
  href: string;
  tags: string[];
  label?: string;
};

export function PreviewButton({ href, tags, label = "Voir sur le site" }: Props) {
  async function openPreview() {
    await fetch("/api/admin/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags }),
    });
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <Button type="button" size="sm" variant="secondary" onClick={openPreview}>
      <ExternalLink className="mr-1 h-4 w-4" />
      {label}
    </Button>
  );
}

"use client";

import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/primitives/button";
import { cn } from "@/lib/utils/cn";

type Props = {
  entity: string;
  label?: string;
  className?: string;
};

export function ExportButton({ entity, label = "Exporter CSV", className }: Props) {
  return (
    <a
      href={`/api/admin/export/${entity}`}
      download
      className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "inline-flex gap-1", className)}
    >
      <Download className="h-4 w-4" />
      {label}
    </a>
  );
}

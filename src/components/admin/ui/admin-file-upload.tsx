"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { buttonVariants } from "@/components/ui/primitives/button";
import { useMediaUpload, type MediaUploadOptions } from "@/components/admin/hooks/useMediaUpload";

type Props = {
  label?: string;
  accept?: string;
  options?: MediaUploadOptions;
  onUploaded: (result: { path: string; previewUrl: string; published: boolean }) => void;
  disabled?: boolean;
  className?: string;
  variant?: "button" | "inline";
};

export function AdminFileUpload({
  label = "Choisir fichier",
  accept = "image/jpeg,image/png,image/webp,image/svg+xml,image/heic,image/heif,application/pdf,video/mp4,video/webm",
  options,
  onUploaded,
  disabled,
  className,
  variant = "button",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading } = useMediaUpload();

  async function handleFile(file: File) {
    const result = await upload(file, options);
    if (result) {
      onUploaded({
        path: result.path,
        previewUrl: result.previewUrl,
        published: result.published,
      });
    }
  }

  return (
    <label
      className={cn(
        variant === "button"
          ? cn(buttonVariants({ variant: "secondary", size: "sm" }), "inline-flex cursor-pointer", className)
          : cn("cursor-pointer text-sm text-admin-accent", className),
        (disabled || uploading) && "pointer-events-none opacity-50"
      )}
    >
      {variant === "button" && <Upload className="mr-1 h-3 w-3" />}
      {uploading ? "Upload…" : label}
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={accept}
        disabled={disabled || uploading}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
    </label>
  );
}

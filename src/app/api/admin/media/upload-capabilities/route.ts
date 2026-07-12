import { requireAdminAccess } from "@/lib/admin-rest";
import { jsonData } from "@/infrastructure/http/api-response";
import { isUploadStorageAvailable } from "@/infrastructure/media/file-storage.adapter";
import { isSupabaseStorageEnabled } from "@/infrastructure/media/storage.factory";

export async function GET() {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;
  return jsonData({
    storageAvailable: isUploadStorageAvailable(),
    storageBackend: isSupabaseStorageEnabled() ? "supabase" : "local",
    maxImageMb: 20,
    maxPdfMb: 20,
    maxVideoMb: 50,
    formats: ["JPG", "PNG", "WebP", "SVG", "HEIC", "PDF", "MP4"],
  });
}

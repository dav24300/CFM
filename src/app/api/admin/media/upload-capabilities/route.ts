import { getAdminAccess } from "@/lib/admin-access";
import { jsonData, jsonUnauthorized } from "@/lib/api-response";
import { isUploadStorageAvailable } from "@/infrastructure/media/file-storage.adapter";
import { isSupabaseStorageEnabled } from "@/infrastructure/media/storage.factory";

export async function GET() {
  if (!(await getAdminAccess())) return jsonUnauthorized();
  return jsonData({
    storageAvailable: isUploadStorageAvailable(),
    storageBackend: isSupabaseStorageEnabled() ? "supabase" : "local",
    maxImageMb: 20,
    maxPdfMb: 20,
    maxVideoMb: 50,
    formats: ["JPG", "PNG", "WebP", "SVG", "HEIC", "PDF", "MP4"],
  });
}

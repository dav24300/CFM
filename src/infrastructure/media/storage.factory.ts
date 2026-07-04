import type { MediaStoragePort } from "@/domain/media/storage.port";
import { localStorageAdapter } from "@/infrastructure/media/local-storage.adapter";
import {
  isSupabaseStorageEnabled,
  supabaseStorageAdapter,
} from "@/infrastructure/media/supabase-storage.adapter";

export function getMediaStorage(): MediaStoragePort {
  if (isSupabaseStorageEnabled()) {
    return supabaseStorageAdapter;
  }
  return localStorageAdapter;
}

export { isSupabaseStorageEnabled };

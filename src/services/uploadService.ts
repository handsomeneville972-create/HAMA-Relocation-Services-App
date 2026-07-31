import { supabase } from '../utils/supabaseClient';
import { Platform } from 'react-native';

const AVATARS_BUCKET = 'avatars';
const isWeb = Platform.OS === 'web';

export type UploadResult = { url: string } | { error: string };

/**
 * Upload a profile avatar image to Supabase Storage.
 * Stores at: avatars/{userId}/{timestamp}.{ext}
 * Returns the public URL on success.
 */
export const uploadAvatar = async (
  userId: string,
  uri: string,
): Promise<UploadResult> => {
  try {
    const mimeExt = (uri.split('?')[0].split('.').pop()?.toLowerCase() ?? '') === 'heic'
      ? 'heic'
      : '';
    const urlExt = uri.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
    const knownExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    const fallbackExt = knownExts.includes(urlExt) ? urlExt : 'jpg';
    const fileName = `${Date.now()}.${fallbackExt}`;
    const filePath = `${userId}/${fileName}`;

    const upload = async (body: any, contentType: string): Promise<string | null> => {
      const { error } = await supabase.storage
        .from(AVATARS_BUCKET)
        .upload(filePath, body, {
          contentType,
          upsert: true,
        });
      return error?.message ?? null;
    };

    let uploadError: string | null = null;

    if (isWeb) {
      // Web: fetch the blob URL and upload as a Blob
      const response = await fetch(uri);
      const blob = await response.blob();
      uploadError = await upload(blob, blob.type || `image/${fallbackExt}`);
    } else {
      // Native: FormData with {uri, name, type} — works with file:// URIs
      const ext = knownExts.includes(mimeExt || urlExt) ? (mimeExt || urlExt) : 'jpg';
      const type = `image/${ext}`;
      const formData = new FormData();
      formData.append('file', { uri, name: fileName, type } as any);
      uploadError = await upload(formData, type);
    }

    if (uploadError) {
      // Last resort: retry with the blob approach on native too
      const response = await fetch(uri);
      const blob = await response.blob();
      uploadError = await upload(blob, blob.type || `image/${fallbackExt}`);
    }

    if (uploadError) return { error: uploadError };

    const { data: publicUrlData } = supabase.storage
      .from(AVATARS_BUCKET)
      .getPublicUrl(filePath);

    return { url: publicUrlData.publicUrl };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Upload failed' };
  }
};

/**
 * Delete a user's previous avatar file(s) from storage.
 * Called before uploading a new one to clean up old files.
 */
export const deleteUserAvatars = async (userId: string): Promise<void> => {
  try {
    const { data: files } = await supabase.storage
      .from(AVATARS_BUCKET)
      .list(userId);

    if (files && files.length > 0) {
      const paths = files.map((f) => `${userId}/${f.name}`);
      await supabase.storage.from(AVATARS_BUCKET).remove(paths);
    }
  } catch {
    // Silent fail — old files remain but won't cause issues
  }
};

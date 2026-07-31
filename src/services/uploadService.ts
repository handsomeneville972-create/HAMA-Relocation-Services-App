import { supabase } from '../utils/supabaseClient';

const AVATARS_BUCKET = 'avatars';

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
    const response = await fetch(uri);
    const blob = await response.blob();

    const mimeExt = (blob.type || '').split('/')[1]?.toLowerCase();
    const urlExt = uri.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
    const knownExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    const ext = knownExts.includes(urlExt) ? urlExt : knownExts.includes(mimeExt) ? mimeExt : 'jpg';
    const fileName = `${Date.now()}.${ext}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(AVATARS_BUCKET)
      .upload(filePath, blob, {
        contentType: blob.type || `image/${ext}`,
        upsert: true,
      });

    if (uploadError) return { error: uploadError.message };

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

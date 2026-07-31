import { supabase, SUPABASE_URL } from '../utils/supabaseClient';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

const AVATARS_BUCKET = 'avatars';
const isWeb = Platform.OS === 'web';

export type UploadResult = { url: string; fileName: string } | { error: string };

const KNOWN_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

const getPublicUrl = (filePath: string): string => {
  const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
};

/**
 * Upload a profile avatar image to Supabase Storage.
 * Stores at: avatars/{userId}/{timestamp}.{ext}
 *
 * Web:        fetch(uri) -> Blob -> supabase.storage.upload
 * Native:     supabase-js FormData (documented RN pattern) first;
 *             on failure, falls back to a direct PUT via
 *             expo-file-system, which avoids React Native's
 *             FormData/multipart boundary issues entirely.
 */
export const uploadAvatar = async (
  userId: string,
  uri: string,
): Promise<UploadResult> => {
  try {
    const urlPath = uri.split('?')[0];
    const urlExt = urlPath.split('.').pop()?.toLowerCase() ?? '';
    const ext = KNOWN_EXTS.includes(urlExt) ? urlExt : 'jpg';
    const fileName = `${Date.now()}.${ext}`;
    const filePath = `${userId}/${fileName}`;
    const type = `image/${ext}`;

    if (isWeb) {
      const response = await fetch(uri);
      const blob = await response.blob();
      const { error } = await supabase.storage
        .from(AVATARS_BUCKET)
        .upload(filePath, blob, {
          contentType: blob.type || type,
          upsert: true,
        });
      if (error) return { error: error.message };
      return { url: getPublicUrl(filePath), fileName };
    }

    // Native attempt 1: supabase-js with React Native FormData
    const formData = new FormData();
    formData.append('file', { uri, name: fileName, type } as any);
    const { error: firstError } = await supabase.storage
      .from(AVATARS_BUCKET)
      .upload(filePath, formData as any, {
        contentType: type,
        upsert: true,
      });

    if (!firstError) {
      return { url: getPublicUrl(filePath), fileName };
    }

    // Native attempt 2: direct PUT via expo-file-system
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      return { error: firstError.message };
    }

    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${AVATARS_BUCKET}/${filePath}`;
    const uploadResult = await FileSystem.uploadAsync(uploadUrl, uri, {
      httpMethod: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': type,
        'x-upsert': 'true',
      },
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    });

    if (uploadResult.status >= 200 && uploadResult.status < 300) {
      return { url: getPublicUrl(filePath), fileName };
    }

    return {
      error: `${firstError.message} (fallback: ${uploadResult.status} ${uploadResult.body})`,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Upload failed' };
  }
};

/**
 * Delete a user's previous avatar file(s) from storage.
 * Call after a new avatar is saved; pass the new file's name via
 * `keepFileName` so the just-uploaded file is never removed.
 */
export const deleteUserAvatars = async (
  userId: string,
  keepFileName?: string,
): Promise<void> => {
  try {
    const { data: files } = await supabase.storage
      .from(AVATARS_BUCKET)
      .list(userId);

    if (files && files.length > 0) {
      const paths = files
        .filter((f) => f.name !== keepFileName)
        .map((f) => `${userId}/${f.name}`);
      if (paths.length > 0) {
        await supabase.storage.from(AVATARS_BUCKET).remove(paths);
      }
    }
  } catch {
    // Silent fail — old files remain but won't cause issues
  }
};

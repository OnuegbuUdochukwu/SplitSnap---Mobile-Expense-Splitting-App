import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';

const RECEIPTS_BUCKET = 'receipts';

export async function uploadReceiptImage(fileUri: string) {
  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) return { error: new Error('File does not exist') };

    const extMatch = fileUri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    const ext = extMatch ? extMatch[1] : 'jpg';
    const fileName = `receipt_${Date.now()}.${ext}`;

    const res = await fetch(fileUri);
    const blob = await res.blob();

    const { data, error } = await supabase.storage
      .from(RECEIPTS_BUCKET)
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: false,
        contentType: `image/${ext}`,
      });

    if (error) return { error };

    // create signed URL for short-lived preview/use
    const expiresIn = 300;
    const { data: signedData, error: signedError } = await supabase.storage
      .from(RECEIPTS_BUCKET)
      .createSignedUrl(fileName, expiresIn);

    const publicURL = (signedData as any)?.signedUrl;
    if (signedError)
      console.debug('[lib/storage] createSignedUrl error:', signedError);

    // Optionally trigger OCR edge function
    const edgeBase = process.env.SUPABASE_EDGE_FUNCTIONS_BASE_URL;
    if (edgeBase && publicURL) {
      try {
        await fetch(`${edgeBase}/process-receipt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_url: publicURL }),
        });
      } catch (e) {
        console.debug('[lib/storage] OCR trigger failed:', e);
      }
    }

    return { data: { path: data?.path, publicURL } };
  } catch (err) {
    return { error: err };
  }
}

export async function deleteReceiptImage(path: string) {
  try {
    const { data, error } = await supabase.storage
      .from(RECEIPTS_BUCKET)
      .remove([path]);
    if (error) return { error };
    return { data };
  } catch (err) {
    return { error: err };
  }
}

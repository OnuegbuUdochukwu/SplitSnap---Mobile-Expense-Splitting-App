import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';

const RECEIPTS_BUCKET = 'receipts';

export async function uploadReceiptImage(fileUri: string) {
  try {
    // Read the file as a binary blob
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      return { error: new Error('File does not exist') };
    }

    const fileName = `receipt_${Date.now()}.jpg`;

    const file = await fetch(fileUri);
    const blob = await file.blob();

    const { data, error } = await supabase.storage
      .from(RECEIPTS_BUCKET)
      .upload(fileName, blob, { cacheControl: '3600', upsert: false });

    if (error) return { error };

    // Generate a signed URL for the uploaded image (private bucket)
    // Expires in 300 seconds by default
    const expiresIn = 300; // seconds
    const { data: signedData, error: signedError } = await supabase.storage
      .from(RECEIPTS_BUCKET)
      .createSignedUrl(fileName, expiresIn);
    const publicURL = (signedData as any)?.signedUrl;
    if (signedError) {
      console.debug('[lib/storage] createSignedUrl error:', signedError);
    }

    // Optionally call OCR edge function to process the image if configured
    const edgeBase = process.env.SUPABASE_EDGE_FUNCTIONS_BASE_URL;
    if (edgeBase) {
      try {
        await fetch(`${edgeBase}/process-receipt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_url: publicURL }),
        });
      } catch (e) {
        // Non-fatal; OCR can run asynchronously or retry later
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

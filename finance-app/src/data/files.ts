import { Capacitor } from '@capacitor/core';

export const isNative = () => Capacitor.isNativePlatform();

function toBase64(data: string | Uint8Array): string {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(bin);
}

/**
 * Save a file for the user. Browser: normal download. Android app: write to the
 * app cache and open the system share sheet (Save to Drive / Files / WhatsApp...).
 * Returns 'saved' | 'shared' | 'cancelled'.
 */
export async function saveFile(filename: string, data: string | Uint8Array, mime: string): Promise<'saved' | 'shared' | 'cancelled'> {
  if (isNative()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const written = await Filesystem.writeFile({ path: filename, data: toBase64(data), directory: Directory.Cache, recursive: true });
    try {
      await Share.share({ title: filename, dialogTitle: 'Save your file', url: written.uri });
      return 'shared';
    } catch {
      return 'cancelled';
    }
  }
  const blob = new Blob([typeof data === 'string' ? data : (data as BlobPart)], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'saved';
}

export const readFileText = (f: File): Promise<string> => f.text();
export const readFileBuffer = (f: File): Promise<ArrayBuffer> => f.arrayBuffer();
